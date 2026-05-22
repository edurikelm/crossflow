import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { athleteSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/requireAuth';
import { computeAthleteStatus } from '@/lib/athletes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('athletes')
    .select('*, profile:profiles(*), memberships(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    computed_status: computeAthleteStatus(data),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const supabase = auth.supabase;
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = athleteSchema.partial().parse(body);

    const { data: athlete, error: fetchError } = await supabase
      .from('athletes')
      .select('profile_id, gym_id, status_override')
      .eq('id', id)
      .single();

    if (fetchError || !athlete) {
      return NextResponse.json({ error: 'Atleta no encontrado' }, { status: 404 });
    }

    const athleteUpdateData: Record<string, unknown> = {};
    if (validated.emergency_contact !== undefined) athleteUpdateData.emergency_contact = validated.emergency_contact;
    if (validated.emergency_phone !== undefined) athleteUpdateData.emergency_phone = validated.emergency_phone;
    if (validated.health_notes !== undefined) athleteUpdateData.health_notes = validated.health_notes;
    if (validated.current_level !== undefined) athleteUpdateData.current_level = validated.current_level;
    athleteUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('athletes')
      .update(athleteUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (athlete.profile_id) {
      const profileUpdateData: Record<string, unknown> = {};
      if (validated.full_name !== undefined) profileUpdateData.full_name = validated.full_name;
      if (validated.phone !== undefined) profileUpdateData.phone = validated.phone;

      if (Object.keys(profileUpdateData).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdateData)
          .eq('id', athlete.profile_id);
      }
    }

    if (validated.plan_id !== undefined && validated.plan_id !== null) {
      const { data: planData, error: planError } = await supabase
        .from('membership_plans')
        .select('duration_days')
        .eq('id', validated.plan_id)
        .single();

      if (planError || !planData) {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 400 });
      }

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + planData.duration_days);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('athlete_id', id)
        .single();

      if (athlete.status_override === 'trial' || athlete.status_override === 'paused') {
        await supabase
          .from('athletes')
          .update({ status_override: null, trial_ends_at: null })
          .eq('id', id);
      }

      if (existingMembership) {
        await supabase
          .from('memberships')
          .update({
            plan_id: validated.plan_id,
            start_date: startDate,
            end_date: endDateStr,
          })
          .eq('athlete_id', id);
      } else {
        await supabase
          .from('memberships')
          .insert({
            athlete_id: id,
            plan_id: validated.plan_id,
            gym_id: athlete.gym_id,
            start_date: startDate,
            end_date: endDateStr,
            classes_used: 0,
            auto_renew: false,
          });
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const supabase = auth.supabase;
  const { id } = await params;

  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}