import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user: me } } = await supabaseServer.auth.getUser(token);
  if (!me) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data } = await supabaseServer
    .from('tourist_profiles')
    .select('user_type, full_name, gender, created_at, avatar')
    .eq('email', (me.email as string).toLowerCase())
    .single();

  // The passport's "member since" line. Accounts created before the tourist
  // profile existed have no row here, so fall back to the auth-side profile —
  // otherwise long-standing users would show a blank date of issue.
  let memberSince: string | null = data?.created_at ?? null;
  if (!memberSince) {
    const { data: base } = await supabaseServer
      .from('profiles')
      .select('created_at')
      .eq('id', me.id)
      .maybeSingle();
    memberSince = base?.created_at ?? me.created_at ?? null;
  }

  return NextResponse.json({
    user_type: data?.user_type ?? null,
    full_name: data?.full_name ?? null,
    gender: data?.gender ?? null,
    member_since: memberSince,
    avatar: data?.avatar ?? null,
  });
}
