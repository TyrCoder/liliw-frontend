import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { createSession, computeRole, sessionCookieHeader } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Try again in 1 minute.' } },
      { status: 429 },
    );
  }

  try {
    const { identifier, email: emailField, password } = await request.json();
    const email = (emailField || identifier || '').trim();
    if (!email || !password) {
      return NextResponse.json({ error: { message: 'Email and password are required.' } }, { status: 400 });
    }

    const { data, error } = await supabaseServer.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { error: { message: error?.message || 'Invalid email or password.' } },
        { status: 401 },
      );
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('username, role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role ?? 'authenticated';
    const user = {
      id: data.user.id,
      username: profile?.username ?? data.user.email?.split('@')[0] ?? 'user',
      email: data.user.email!,
      role: { id: 0, name: role, type: role },
    };

    const sessionToken = createSession(user.email, computeRole(user));
    const response = NextResponse.json({ jwt: data.session?.access_token, user });
    if (sessionToken) response.headers.set('Set-Cookie', sessionCookieHeader(sessionToken));
    return response;
  } catch {
    return NextResponse.json(
      { error: { message: 'Login failed. Please try again.' } },
      { status: 500 },
    );
  }
}
