import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { coachSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  let query = supabase
    .from('coaches')
    .select('*, profile:profiles(*)');

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`);
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
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const profile = auth.profile;

    const body = await request.json();
    const validated = coachSchema.parse(body);

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
          gym_id: profile.gym_id,
          role: 'coach',
          is_active: true,
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
        return NextResponse.json({ error: createProfileError.message }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('coaches')
      .insert({
        profile_id: profileId,
        gym_id: profile.gym_id,
        specialty: validated.specialty || [],
        bio: validated.bio || null,
        hourly_rate: validated.hourly_rate || null,
        contract_start: validated.contract_start || null,
        is_active: true,
      })
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