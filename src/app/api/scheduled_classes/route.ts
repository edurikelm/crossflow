import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scheduledClassSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const coach_id = searchParams.get('coach_id');
  const class_template_id = searchParams.get('class_template_id');

  let query = supabase
    .from('scheduled_classes')
    .select('*, class_templates(*), coaches(*), profiles(full_name)');

  if (date) {
    query = query.eq('date', date);
  }

  if (coach_id) {
    query = query.eq('coach_id', coach_id);
  }

  if (class_template_id) {
    query = query.eq('class_template_id', class_template_id);
  }

  const { data, error } = await query
    .order('date')
    .order('start_time');

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
    const validated = scheduledClassSchema.parse(body);

    const insertData = {
      ...validated,
      profile_id: profile.id,
      gym_id: profile.gym_id,
    };

    const { data, error } = await supabase
      .from('scheduled_classes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('ScheduledClass POST error:', e);
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}