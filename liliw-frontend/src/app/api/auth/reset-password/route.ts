import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '../forgot-password/route';
import { logger } from '@/lib/logger';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const entry = otpStore.get(email.toLowerCase());
    if (!entry) return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 });
    if (Date.now() > entry.expiry) {
      otpStore.delete(email.toLowerCase());
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }
    if (entry.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Find user by email
    const usersRes = await fetch(
      `${STRAPI}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
    );
    const users = await usersRes.json();
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const updateRes = await fetch(`${STRAPI}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      logger.error('Strapi update error:', text);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    otpStore.delete(email.toLowerCase());
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('reset-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
