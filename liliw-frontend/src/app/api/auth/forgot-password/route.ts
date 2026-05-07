import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '@/lib/ratelimit';

// In-memory OTP store: email → { otp, expiry }
export const otpStore = new Map<string, { otp: string; expiry: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Try again in 1 minute.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Verify the email exists in Strapi
    const usersRes = await fetch(
      `${STRAPI}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
    );
    const users = await usersRes.json();
    if (!Array.isArray(users) || users.length === 0) {
      // Don't reveal whether the email exists — return success anyway
      return NextResponse.json({ success: true });
    }

    const otp = generateOtp();
    otpStore.set(email.toLowerCase(), { otp, expiry: Date.now() + 10 * 60 * 1000 }); // 10 min

    await transporter.sendMail({
      from: `"Liliw Tourism" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Liliw password reset code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
          <div style="background:linear-gradient(135deg,#0F1F3C,#1a3a5c);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:#00BFB3;margin:0;font-size:28px;letter-spacing:2px">LILIW</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">Tourism Portal</p>
          </div>
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px">Password Reset</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px">Enter this code to reset your password. It expires in 10 minutes.</p>
          <div style="background:#fff;border:2px solid #00BFB3;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0F1F3C">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }
}
