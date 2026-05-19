import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { profileOtpStore, emailChangeVerified } from '@/lib/profileOtpStore';
import { getStrapiAdminJwt, getStrapiUserByEmail, updateStrapiUser } from '@/lib/strapi-admin';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

async function getMe(token: string) {
  const r = await fetch(`${STRAPI}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const me    = await getMe(token);
  if (!me) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { phase, otp, newEmail } = await req.json();

  // Phase 1: verify current email OTP
  if (phase === 'verify_old') {
    const key   = `${me.id}-email_old`;
    const entry = profileOtpStore.get(key);
    if (!entry)                    return NextResponse.json({ error: 'No code found. Please request one first.' }, { status: 400 });
    if (Date.now() > entry.expiry) { profileOtpStore.delete(key); return NextResponse.json({ error: 'Code expired.' }, { status: 400 }); }
    if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
    profileOtpStore.delete(key);
    emailChangeVerified.set(String(me.id), { expiry: Date.now() + 15 * 60 * 1000 });
    return NextResponse.json({ success: true, verified: true });
  }

  // Phase 2: verify new email OTP and apply change
  if (phase === 'verify_new') {
    const verified = emailChangeVerified.get(String(me.id));
    if (!verified || Date.now() > verified.expiry) {
      emailChangeVerified.delete(String(me.id));
      return NextResponse.json({ error: 'Session expired. Please start the email change again.' }, { status: 400 });
    }

    const key   = `${me.id}-email_new`;
    const entry = profileOtpStore.get(key);
    if (!entry)                    return NextResponse.json({ error: 'No code found for the new email.' }, { status: 400 });
    if (Date.now() > entry.expiry) { profileOtpStore.delete(key); return NextResponse.json({ error: 'Code expired.' }, { status: 400 }); }
    if (entry.otp !== otp)         return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });

    profileOtpStore.delete(key);
    emailChangeVerified.delete(String(me.id));

    const jwt = await getStrapiAdminJwt();
    if (!jwt) return NextResponse.json({ error: 'Admin service unavailable.' }, { status: 503 });

    const strapiUser = await getStrapiUserByEmail(me.email, jwt);
    if (!strapiUser) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const ok = await updateStrapiUser(strapiUser.documentId, { email: newEmail }, jwt);
    if (!ok) return NextResponse.json({ error: 'Failed to update email. The new email may already be in use.' }, { status: 500 });

    // Update Supabase tourist_profiles
    await supabaseServer
      .from('tourist_profiles')
      .update({ email: newEmail.toLowerCase() })
      .eq('email', me.email.toLowerCase());

    return NextResponse.json({ success: true, emailChanged: true });
  }

  return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
}
