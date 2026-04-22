import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { athleteSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const plan_id = searchParams.get('plan_id');

  let query = supabase
    .from('athletes')
    .select(`
      *,
      profile:profiles(*),
      membership:memberships(*, plan:membership_plans(*))
    `);

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`);
  }

  if (plan_id) {
    query = query.eq('memberships.plan_id', plan_id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filteredData = data || [];

  if (status === 'active') {
    filteredData = filteredData.filter((a) => a.membership?.status === 'active');
  } else if (status === 'expired') {
    filteredData = filteredData.filter((a) => a.membership?.status === 'expired');
  } else if (status === 'new') {
    filteredData = filteredData.filter((a) => a.membership?.status === 'new');
  }

  return NextResponse.json(filteredData);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, gym_id')
      .eq('id', user.id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validated = athleteSchema.parse(body);

    let profileId: string;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      profileId = crypto.randomUUID();
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          full_name: validated.full_name,
          email: validated.email,
          phone: validated.phone || null,
          gym_id: currentProfile.gym_id,
          role: 'athlete',
          is_active: true,
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
        return NextResponse.json({ error: createProfileError.message }, { status: 400 });
      }
    }

    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .insert({
        profile_id: profileId,
        gym_id: currentProfile.gym_id,
        emergency_contact: validated.emergency_contact || null,
        emergency_phone: validated.emergency_phone || null,
        health_notes: validated.health_notes || null,
        current_level: validated.current_level || 'beginner',
        is_active: true,
      })
      .select()
      .single();

    if (athleteError) {
      return NextResponse.json({ error: athleteError.message }, { status: 400 });
    }

    if (validated.plan_id) {
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

      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          athlete_id: athleteData.id,
          plan_id: validated.plan_id,
          gym_id: currentProfile.gym_id,
          status: 'active',
          start_date: startDate,
          end_date: endDateStr,
          classes_used: 0,
          auto_renew: false,
        })
        .select()
        .single();

      if (membershipError) {
        console.error('Membership creation error:', membershipError);
        return NextResponse.json({ error: 'Error al crear membresía: ' + membershipError.message }, { status: 400 });
      }
    }

    return NextResponse.json(athleteData, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}