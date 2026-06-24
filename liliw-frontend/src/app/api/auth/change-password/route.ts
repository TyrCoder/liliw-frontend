import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { profileOtpStore } from '@/lib/profileOtpStore';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { otp, newPassword, confirmPassword } = await req.json();
  if (!otp || !newPassword || !confirmPassword) return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  if (newPassword !== confirmPassword)          return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  if (newPassword.length < 6)                  return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const key   = `${user.id}-password`;
  const entry = profileOtpStore.get(key);
  if (!entry)                    return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
  if (Date.now() > entry.expiry) { profileOtpStore.delete(key); return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 }); }
  if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
  profileOtpStore.delete(key);

  const { error } = await supabaseServer.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });

  return NextResponse.json({ success: true });
}
