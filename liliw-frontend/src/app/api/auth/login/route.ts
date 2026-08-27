import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { createSession, computeRole, sessionCookieHeader } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase-server';

// Supabase calls have no built-in cancellation here, so a hung request used to
// block the login route indefinitely. These races make the route fail fast
// with a clear message instead of leaving the client waiting.
const SIGN_IN_TIMEOUT_MS = 10_000;
const PROFILE_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`login:${ip}`, 5, 60_000)) {
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

    type SignInResult = Awaited<ReturnType<typeof supabaseServer.auth.signInWithPassword>>;
    let signIn: SignInResult;
    try {
      signIn = await withTimeout(
        supabaseServer.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
      );
    } catch {
      return NextResponse.json(
        { error: { message: 'Login is taking longer than usual. Please try again.' } },
        { status: 504 },
      );
    }
    const { data, error } = signIn;
    if (error || !data.user) {
      return NextResponse.json(
        { error: { message: error?.message || 'Invalid email or password.' } },
        { status: 401 },
      );
    }

    // Best-effort: a slow or unreachable profiles table shouldn't block an
    // otherwise-successful sign-in, so fall back to defaults on timeout.
    let profile: { username?: string; role?: string } | null = null;
    try {
      const result = await withTimeout(
        supabaseServer.from('profiles').select('username, role').eq('id', data.user.id).single(),
        PROFILE_TIMEOUT_MS,
      );
      profile = result.data;
    } catch {
      profile = null;
    }

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
