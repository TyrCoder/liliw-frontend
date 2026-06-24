import { NextRequest, NextResponse } from 'next/server';
import { createSession, computeRole, sessionCookieHeader, verifySession, SESSION_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json(null, { status: 401 });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    clearTimeout(t);

    if (error || !user) return NextResponse.json(null, { status: 401 });

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'authenticated';
    const shaped = {
      id: user.id,
      username: profile?.username ?? user.email?.split('@')[0] ?? 'user',
      email: user.email!,
      role: { id: 0, name: role, type: role },
    };

    const sessionToken = createSession(shaped.email, computeRole(shaped));
    const res = NextResponse.json(shaped);
    if (sessionToken) res.headers.set('Set-Cookie', sessionCookieHeader(sessionToken));
    return res;
  } catch {
    clearTimeout(t);
    const existing = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (existing?.email) {
      return NextResponse.json({ email: existing.email, role: existing.role });
    }
    return NextResponse.json(null, { status: 503 });
  }
}
