import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthContext {
  profile: {
    id: string;
    gym_id: string;
  };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();

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

  return { profile, supabase };
}

export function requireGymOwnership(auth: AuthContext, targetGymId: string): NextResponse | null {
  if (auth.profile.gym_id !== targetGymId) {
    return NextResponse.json({ error: 'No tienes permiso para acceder a este recurso' }, { status: 403 });
  }
  return null;
}