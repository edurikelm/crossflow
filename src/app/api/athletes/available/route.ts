import { NextRequest, NextResponse } from 'next/server';
import { computeAthleteStatus } from '@/lib/athletes';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const supabase = auth.supabase;
  const profile = auth.profile;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const scheduled_class_id = searchParams.get('scheduled_class_id');

    let query = supabase
      .from('athletes')
      .select(`
        *,
        profile:profiles(id, full_name, email, phone),
        membership:memberships(*, plan:membership_plans(id, name))
      `)
      .eq('gym_id', profile.gym_id);

    if (search) {
      query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`);
    }

    const { data: athletes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const availableAthletes = (athletes || []).filter((a) => {
      const status = computeAthleteStatus(a);
      return status === "active" || status === "trial";
    });

    let excludeIds: string[] = [];
    if (scheduled_class_id) {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('athlete_id')
        .eq('scheduled_class_id', scheduled_class_id);

      excludeIds = (existingBookings || []).map(b => b.athlete_id);
    }

    const filteredAthletes = availableAthletes.filter(
      (a) => !excludeIds.includes(a.id)
    );

    return NextResponse.json(filteredAthletes);
  } catch (e) {
    console.error('Available athletes error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}