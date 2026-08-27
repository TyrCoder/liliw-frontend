import { NextRequest, NextResponse } from 'next/server';
import { consumeOtpDb } from '@/lib/otpDb';
import { checkRateLimit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`verify-reg:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  try {
    const { email, otp, fullName, username, password, userType } = await req.json();
    if (!email || !otp || !fullName || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const key    = email.toLowerCase();
    const result = await consumeOtpDb('register', key, otp);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    // Create Supabase auth user (email_confirm: true bypasses confirmation email since we already verified via OTP)
    const { data: created, error: createErr } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: 'authenticated' },
    });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message || 'Registration failed. The email may already be taken.' },
        { status: 400 },
      );
    }

    // Explicit profile row (trigger may lag)
    const { error: profErr } = await supabaseServer.from('profiles').upsert({
      id: created.user.id, email, username, role: 'authenticated',
    }, { onConflict: 'id' });
    if (profErr) {
      return NextResponse.json(
        { error: `Account created but its profile could not be saved: ${profErr.message}` },
        { status: 500 },
      );
    }

    // This row holds the full name and visitor type just collected on the form.
    // It was fire-and-forget, so a failure here threw both away without a word
    // and the new account looked like it had never answered those questions.
    const { error: touristErr } = await supabaseServer.from('tourist_profiles').upsert(
      { email: key, username, full_name: fullName, user_type: userType || null },
      { onConflict: 'email' },
    );
    if (touristErr) {
      console.error('[register] tourist_profiles upsert failed:', touristErr.message);
    }

    // Sign in to get JWT
    const { data: session } = await supabaseServer.auth.signInWithPassword({ email, password });
    const user = {
      id: created.user.id,
      username,
      email,
      role: { id: 0, name: 'authenticated', type: 'authenticated' },
    };

    return NextResponse.json({ jwt: session?.session?.access_token, user });
  } catch (err) {
    console.error('[verify-reg-otp]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
