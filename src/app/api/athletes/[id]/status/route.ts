import { NextRequest, NextResponse } from 'next/server';
import { athleteStatusUpdateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const supabase = auth.supabase;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = athleteStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { status_override, trial_ends_at, reason } = parsed.data;

  const { data: athlete, error: fetchError } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !athlete) {
    return NextResponse.json({ error: 'Atleta no encontrado' }, { status: 404 });
  }

  const oldOverride = athlete.status_override;

  const updateData: Record<string, unknown> = {
    status_override,
    updated_at: new Date().toISOString(),
  };

  if (status_override === 'trial') {
    updateData.trial_ends_at = trial_ends_at ?? null;
  } else if (status_override === null) {
    updateData.trial_ends_at = null;
  }

  const { error: updateError } = await supabase
    .from('athletes')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  let cancelledBookings = 0;

  if (status_override === 'paused' || status_override === 'suspended') {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('athlete_id', id)
      .in('status', ['confirmed', 'waitlist']);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b: { id: string }) => b.id);

      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .in('id', bookingIds);

      cancelledBookings = bookings.length;
    }
  }

  await supabase
    .from('athlete_status_log')
    .insert({
      athlete_id: id,
      profile_id: auth.profile.id,
      old_override: oldOverride,
      new_override: status_override,
      reason: reason ?? null,
      created_at: new Date().toISOString(),
    });

  const { data: updatedAthlete } = await supabase
    .from('athletes')
    .select('*, profile:profiles(*)')
    .eq('id', id)
    .single();

  return NextResponse.json({
    athlete: updatedAthlete,
    cancelled_bookings: cancelledBookings,
  });
}
