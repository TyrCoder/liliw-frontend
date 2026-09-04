import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase-server';
import { passwordProblem, usernameProblem } from '@/lib/credentials';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`register:${ip}`, 3, 60_000)) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Try again in 1 minute.' } },
      { status: 429 },
    );
  }

  try {
    const { username, email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: { message: 'Email and password are required.' } }, { status: 400 });
    }

    // Enforced here, not only in the form. The strength meter in AuthModal is
    // display, and posting to this route directly met no rules at all beyond
    // Supabase's own six-character floor.
    const pwProblem = passwordProblem(password);
    if (pwProblem) {
      return NextResponse.json({ error: { message: pwProblem } }, { status: 400 });
    }

    // An absent username still falls back to the address, as before; a supplied
    // one has to be valid rather than silently stored however it arrived.
    if (username) {
      const nameProblem = usernameProblem(username);
      if (nameProblem) {
        return NextResponse.json({ error: { message: nameProblem } }, { status: 400 });
      }
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username || email.split('@')[0], role: 'authenticated' },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: { message: error?.message || 'Registration failed.' } },
        { status: 400 },
      );
    }

    // Insert profile row explicitly (trigger may not run in time for immediate
    // signIn). Without this row the account signs in but has no username or
    // role, so a silent failure here produces a half-made account.
    const { error: profErr } = await supabaseServer.from('profiles').upsert({
      id: data.user.id, email, username: username || email.split('@')[0], role: 'authenticated',
    }, { onConflict: 'id' });
    if (profErr) {
      return NextResponse.json(
        { error: { message: `Account created but its profile could not be saved: ${profErr.message}` } },
        { status: 500 },
      );
    }

    // Sign in to get JWT
    const { data: session, error: signInErr } = await supabaseServer.auth.signInWithPassword({ email, password });
    if (signInErr || !session) {
      return NextResponse.json({ error: { message: 'Account created but could not log in automatically.' } }, { status: 201 });
    }

    const user = {
      id: data.user.id,
      username: username || email.split('@')[0],
      email,
      role: { id: 0, name: 'authenticated', type: 'authenticated' },
    };

    return NextResponse.json({ jwt: session.session?.access_token, user });
  } catch {
    return NextResponse.json(
      { error: { message: 'Registration failed. Please try again.' } },
      { status: 500 },
    );
  }
}
