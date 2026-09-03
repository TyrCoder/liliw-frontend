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

    const sessionRole = computeRole(user);

    /**
     * Where this account belongs after signing in.
     *
     * Staff and business owners were being dropped on the public homepage and
     * left to find their own way to a dashboard they may not know exists — the
     * business owners least of all, since nothing in the visitor navigation
     * points at /lbo.
     *
     * Decided here rather than in the browser because this route already knows
     * the role, and because an owner's dashboard is not implied by their role
     * at all: every LBO carries plain 'authenticated' and is identified by
     * holding an approved application. Working that out client-side would mean
     * a second round trip on every single login, including the tourists it
     * never applies to.
     */
    let landing: string | null = null;

    if (sessionRole === 'admin' || sessionRole === 'chatoofficer' || sessionRole === 'chatoeditor') {
      landing = '/admin';
    } else {
      // Failure here is not worth blocking a sign-in over: a tourist has no
      // landing page anyway, and an owner sent to the homepage can still
      // navigate to /lbo. Timed out like the profile lookup above.
      try {
        const { data: lbo } = await withTimeout(
          supabaseServer
            .from('lbo_applications')
            .select('id')
            .eq('email', user.email)
            .eq('status', 'approved')
            .limit(1)
            .maybeSingle(),
          PROFILE_TIMEOUT_MS,
        );
        if (lbo) landing = '/lbo';
      } catch {
        landing = null;
      }
    }

    const sessionToken = createSession(user.email, sessionRole);
    const response = NextResponse.json({ jwt: data.session?.access_token, user, landing });
    if (sessionToken) response.headers.set('Set-Cookie', sessionCookieHeader(sessionToken));
    return response;
  } catch {
    return NextResponse.json(
      { error: { message: 'Login failed. Please try again.' } },
      { status: 500 },
    );
  }
}
