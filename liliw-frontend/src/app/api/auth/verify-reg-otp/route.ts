import { NextRequest, NextResponse } from 'next/server';
import { regOtpStore } from '@/lib/regOtpStore';
import { checkRateLimit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 5, 60_000)) {
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

    const key   = email.toLowerCase();
    const entry = regOtpStore.get(key);
    if (!entry)                     return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
    if (Date.now() > entry.expiry)  { regOtpStore.delete(key); return NextResponse.json({ error: 'Code has expired. Please go back and request a new one.' }, { status: 400 }); }
    if (entry.otp !== otp)          return NextResponse.json({ error: 'Incorrect code. Please check your email and try again.' }, { status: 400 });

    regOtpStore.delete(key);

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
    await supabaseServer.from('profiles').upsert({
      id: created.user.id, email, username, role: 'authenticated',
    }, { onConflict: 'id' });

    // Store tourist profile (fire-and-forget)
    void supabaseServer.from('tourist_profiles').upsert(
      { email: key, username, full_name: fullName, user_type: userType || null },
      { onConflict: 'email' },
    );

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
