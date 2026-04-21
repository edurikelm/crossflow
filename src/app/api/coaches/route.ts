import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { coachSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  let query = supabase
    .from('coaches')
    .select('*');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const validated = coachSchema.parse(body);

    const insertData = {
      ...validated,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('coaches')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('Coach POST error:', e);
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}