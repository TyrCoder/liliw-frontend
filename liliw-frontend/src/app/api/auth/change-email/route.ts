import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { profileOtpStore, emailChangeVerified } from '@/lib/profileOtpStore';
import { consumeOtp } from '@/lib/otp';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { phase, otp, newEmail } = await req.json();

  if (phase === 'verify_old') {
    const result = consumeOtp(profileOtpStore, `${user.id}-email_old`, otp);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    emailChangeVerified.set(user.id, { expiry: Date.now() + 15 * 60 * 1000 });
    return NextResponse.json({ success: true, verified: true });
  }

  if (phase === 'verify_new') {
    const verified = emailChangeVerified.get(user.id);
    if (!verified || Date.now() > verified.expiry) {
      emailChangeVerified.delete(user.id);
      return NextResponse.json({ error: 'Session expired. Please start the email change again.' }, { status: 400 });
    }

    const result = consumeOtp(profileOtpStore, `${user.id}-email_new`, otp);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    emailChangeVerified.delete(user.id);

    // Update email in Supabase Auth
    const { error } = await supabaseServer.auth.admin.updateUserById(user.id, { email: newEmail });
    if (error) return NextResponse.json({ error: 'Failed to update email. The new email may already be in use.' }, { status: 500 });

    // These two carry the address everything else looks the account up by, and
    // the auth record has already moved. If either is left behind, the profile
    // is orphaned: /api/user/profile searches tourist_profiles by the new email
    // and finds nothing, so the name, visitor type and avatar all read as gone.
    // Failing loudly here is the difference between a retryable error and a
    // profile that has silently emptied itself.
    const lower = newEmail.toLowerCase();
    const { error: pErr } = await supabaseServer
      .from('profiles').update({ email: lower }).eq('id', user.id);
    const { error: tErr } = await supabaseServer
      .from('tourist_profiles').update({ email: lower }).eq('email', user.email!.toLowerCase());

    if (pErr || tErr) {
      return NextResponse.json({
        error: 'Your sign-in email was changed, but your profile could not be moved across. ' +
               'Contact the Tourism Office before signing out.',
        detail: (pErr ?? tErr)!.message,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailChanged: true });
  }

  return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
}
