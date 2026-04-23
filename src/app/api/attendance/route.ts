import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const scheduled_class_id = searchParams.get('scheduled_class_id');

  if (!scheduled_class_id) {
    return NextResponse.json({ error: 'scheduled_class_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      athletes(*, profile:profiles(*), membership:memberships(*, plan:membership_plans(*)))
    `)
    .eq('scheduled_class_id', scheduled_class_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, gym_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { scheduled_class_id, athlete_ids } = body;

    if (!scheduled_class_id || !athlete_ids || !Array.isArray(athlete_ids)) {
      return NextResponse.json({ error: 'scheduled_class_id and athlete_ids array are required' }, { status: 400 });
    }

    const { data: scheduledClass, error: classError } = await supabase
      .from('scheduled_classes')
      .select('id, capacity, current_bookings, gym_id')
      .eq('id', scheduled_class_id)
      .single();

    if (classError || !scheduledClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    if (scheduledClass.gym_id !== profile.gym_id) {
      return NextResponse.json({ error: 'No tienes permiso para agregar atletas a esta clase' }, { status: 403 });
    }

    const availableSlots = scheduledClass.capacity - (scheduledClass.current_bookings || 0);
    if (athlete_ids.length > availableSlots) {
      return NextResponse.json({
        error: `Solo hay ${availableSlots} lugares disponibles. Intentaste agregar ${athlete_ids.length}.`
      }, { status: 400 });
    }

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('athlete_id')
      .eq('scheduled_class_id', scheduled_class_id)
      .in('athlete_id', athlete_ids);

    const existingAthleteIds = (existingBookings || []).map(b => b.athlete_id);
    const newAthleteIds = athlete_ids.filter(id => !existingAthleteIds.includes(id));

    if (newAthleteIds.length === 0) {
      return NextResponse.json({ error: 'Los atletas seleccionados ya están registrados en esta clase' }, { status: 400 });
    }

    const insertData = newAthleteIds.map(athlete_id => ({
      scheduled_class_id,
      athlete_id,
      gym_id: profile.gym_id,
      status: 'confirmed',
    }));

    const { data, error } = await supabase
      .from('bookings')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Booking insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('scheduled_classes')
      .update({ current_bookings: (scheduledClass.current_bookings || 0) + newAthleteIds.length })
      .eq('id', scheduled_class_id);

    if (updateError) {
      console.error('Error updating current_bookings:', updateError);
    }

    return NextResponse.json({ data, added: newAthleteIds.length }, { status: 201 });
  } catch (e) {
    console.error('Booking POST error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}