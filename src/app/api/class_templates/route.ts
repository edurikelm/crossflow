import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classTemplateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const level = searchParams.get('level');

  let query = supabase
    .from('class_templates')
    .select('*');

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (level) {
    query = query.eq('level', level);
  }

  const { data, error } = await query.order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const validated = classTemplateSchema.parse(body);

    const { data, error } = await supabase
      .from('class_templates')
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