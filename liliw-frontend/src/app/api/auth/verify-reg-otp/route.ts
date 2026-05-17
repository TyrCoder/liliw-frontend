import { NextRequest, NextResponse } from 'next/server';
import { regOtpStore } from '@/lib/regOtpStore';
import { checkRateLimit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  try {
    const { email, otp, username, password, userType } = await req.json();
    if (!email || !otp || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const key   = email.toLowerCase();
    const entry = regOtpStore.get(key);
    if (!entry) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
    }
    if (Date.now() > entry.expiry) {
      regOtpStore.delete(key);
      return NextResponse.json({ error: 'Code has expired. Please go back and request a new one.' }, { status: 400 });
    }
    if (entry.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect code. Please check your email and try again.' }, { status: 400 });
    }

    // OTP valid — consume it and register
    regOtpStore.delete(key);

    const regRes = await fetch(`${STRAPI}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      return NextResponse.json(
        { error: regData?.error?.message || 'Registration failed. The username or email may already be taken.' },
        { status: regRes.status }
      );
    }

    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${regData.jwt}` },
    });
    const user = await meRes.json();

    // Store user type / location in Supabase (fire-and-forget)
    void supabaseServer
      .from('tourist_profiles')
      .upsert(
        { email: key, username, user_type: userType || null },
        { onConflict: 'email' }
      );

    return NextResponse.json({ jwt: regData.jwt, user });
  } catch (err) {
    console.error('[verify-reg-otp]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
