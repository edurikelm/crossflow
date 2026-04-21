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
    .from('classes')
    .select('*, class_templates(*), coaches(*)');

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
    const body = await request.json();
    const validated = scheduledClassSchema.parse(body);

    const { data, error } = await supabase
      .from('classes')
      .insert(validated)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}