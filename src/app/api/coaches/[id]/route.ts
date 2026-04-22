import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('coaches')
    .select('*, profile:profiles(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
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
    const { full_name, phone, specialty, bio, hourly_rate, contract_start, is_active } = body;

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('profile_id')
      .eq('id', id)
      .single();

    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    if (full_name !== undefined || phone !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdate.full_name = full_name;
      if (phone !== undefined) profileUpdate.phone = phone;

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', coach.profile_id);

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 400 });
      }
    }

    const coachUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (specialty !== undefined) coachUpdate.specialty = specialty;
    if (bio !== undefined) coachUpdate.bio = bio;
    if (hourly_rate !== undefined) coachUpdate.hourly_rate = hourly_rate;
    if (contract_start !== undefined) coachUpdate.contract_start = contract_start;
    if (is_active !== undefined) coachUpdate.is_active = is_active;

    const { data, error } = await supabase
      .from('coaches')
      .update(coachUpdate)
      .eq('id', id)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
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
    .from('coaches')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}