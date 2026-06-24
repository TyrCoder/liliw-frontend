import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { profileOtpStore, emailChangeVerified } from '@/lib/profileOtpStore';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { phase, otp, newEmail } = await req.json();

  if (phase === 'verify_old') {
    const key   = `${user.id}-email_old`;
    const entry = profileOtpStore.get(key);
    if (!entry)                    return NextResponse.json({ error: 'No code found. Please request one first.' }, { status: 400 });
    if (Date.now() > entry.expiry) { profileOtpStore.delete(key); return NextResponse.json({ error: 'Code expired.' }, { status: 400 }); }
    if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
    profileOtpStore.delete(key);
    emailChangeVerified.set(user.id, { expiry: Date.now() + 15 * 60 * 1000 });
    return NextResponse.json({ success: true, verified: true });
  }

  if (phase === 'verify_new') {
    const verified = emailChangeVerified.get(user.id);
    if (!verified || Date.now() > verified.expiry) {
      emailChangeVerified.delete(user.id);
      return NextResponse.json({ error: 'Session expired. Please start the email change again.' }, { status: 400 });
    }

    const key   = `${user.id}-email_new`;
    const entry = profileOtpStore.get(key);
    if (!entry)                    return NextResponse.json({ error: 'No code found for the new email.' }, { status: 400 });
    if (Date.now() > entry.expiry) { profileOtpStore.delete(key); return NextResponse.json({ error: 'Code expired.' }, { status: 400 }); }
    if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
    profileOtpStore.delete(key);
    emailChangeVerified.delete(user.id);

    // Update email in Supabase Auth
    const { error } = await supabaseServer.auth.admin.updateUserById(user.id, { email: newEmail });
    if (error) return NextResponse.json({ error: 'Failed to update email. The new email may already be in use.' }, { status: 500 });

    // Update profiles + tourist_profiles
    await supabaseServer.from('profiles').update({ email: newEmail.toLowerCase() }).eq('id', user.id);
    await supabaseServer.from('tourist_profiles').update({ email: newEmail.toLowerCase() }).eq('email', user.email!.toLowerCase());

    return NextResponse.json({ success: true, emailChanged: true });
  }

  return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
}
