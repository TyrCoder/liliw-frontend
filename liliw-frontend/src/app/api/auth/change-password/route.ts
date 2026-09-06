import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { consumeOtpDb } from '@/lib/otpDb';
import { supabaseServer } from '@/lib/supabase-server';
import { passwordProblem } from '@/lib/credentials';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { otp, newPassword, confirmPassword } = await req.json();
  if (!otp || !newPassword || !confirmPassword) return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  if (newPassword !== confirmPassword)          return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  // The same rule registration and reset apply. This route kept the old
  // six-character floor, so the policy could be walked around from the profile
  // page: register with a strong password, then change it to anything.
  const pwProblem = passwordProblem(newPassword);
  if (pwProblem) return NextResponse.json({ error: pwProblem }, { status: 400 });

  const result = await consumeOtpDb('profile', `${user.id}-password`, otp);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { error } = await supabaseServer.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });

  return NextResponse.json({ success: true });
}
