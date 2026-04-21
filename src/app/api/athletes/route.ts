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
    .select('*, membership_plans(*), user_profiles(*)');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status === 'active') {
    query = query.eq('status', 'active');
  } else if (status === 'expired') {
    query = query.eq('status', 'expired');
  } else if (status === 'new') {
    query = query.eq('status', 'new');
  }

  if (plan_id) {
    query = query.eq('plan_id', plan_id);
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
    const validated = athleteSchema.parse(body);

    const { data, error } = await supabase
      .from('athletes')
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