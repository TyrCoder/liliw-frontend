import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '../forgot-password/route';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/ratelimit';
import { consumeOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
  // This endpoint takes over an account on success, so it needs both an IP
  // throttle and the per-code attempt cap in consumeOtp — without either, a
  // six-digit code is guessable inside its ten-minute window.
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`reset-pw:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 });
  }

  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const key    = email.toLowerCase();
    const result = consumeOtp(otpStore, key, otp);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    // Look up Supabase user by email via the profiles table
    const { data: profile } = await supabaseServer.from('profiles').select('id').eq('email', key).single();
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { error } = await supabaseServer.auth.admin.updateUserById(profile.id, { password: newPassword });
    if (error) {
      logger.error('reset-password Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true }); // code already consumed above
  } catch (err) {
    logger.error('reset-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
