import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classTemplateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const level = searchParams.get('level');

  let query = supabase
    .from('class_templates')
    .select('*, profiles(full_name)');

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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const supabase = auth.supabase;
    const profile = auth.profile;

    const body = await request.json();
    let validated;
    try {
      validated = classTemplateSchema.parse(body);
    } catch (e) {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }

    const insertData = {
      ...validated,
      profile_id: profile.id,
    };

    const { data, error } = await supabase
      .from('class_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: e }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}