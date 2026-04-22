import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { athleteSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('athletes')
    .select('*, membership_plans(*), user_profiles(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = athleteSchema.partial().parse(body);

    const { data: athlete, error: fetchError } = await supabase
      .from('athletes')
      .select('profile_id')
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

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + planData.duration_days);

      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('athlete_id', id)
        .single();

      if (existingMembership) {
        await supabase
          .from('memberships')
          .update({
            plan_id: validated.plan_id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
          })
          .eq('athlete_id', id);
      } else {
        await supabase
          .from('memberships')
          .insert({
            athlete_id: id,
            plan_id: validated.plan_id,
            gym_id: athlete.gym_id,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
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
  const supabase = await createClient();
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