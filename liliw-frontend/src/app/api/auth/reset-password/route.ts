import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '../forgot-password/route';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const key   = email.toLowerCase();
    const entry = otpStore.get(key);
    if (!entry)                    return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 });
    if (Date.now() > entry.expiry) { otpStore.delete(key); return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 }); }
    if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });

    // Look up Supabase user by email via the profiles table
    const { data: profile } = await supabaseServer.from('profiles').select('id').eq('email', key).single();
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { error } = await supabaseServer.auth.admin.updateUserById(profile.id, { password: newPassword });
    if (error) {
      logger.error('reset-password Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    otpStore.delete(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('reset-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
