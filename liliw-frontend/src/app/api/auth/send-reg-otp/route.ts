import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { regOtpStore } from '@/lib/regOtpStore';
import { checkRateLimit } from '@/lib/ratelimit';

const STRAPI       = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Check if email is already registered
    const usersRes = await fetch(
      `${STRAPI}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
    );
    const users = await usersRes.json();
    if (Array.isArray(users) && users.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const otp = generateOtp();
    regOtpStore.set(email.toLowerCase(), { otp, expiry: Date.now() + 10 * 60 * 1000 });

    await transporter.sendMail({
      from: `"Liliw Tourism" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your Liliw Tourism account',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#0B3D91,#1565C0);padding:32px 36px;text-align:center">
      <p style="margin:0;color:#93C5FD;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Liliw Tourism</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700">Welcome! Verify your email</h1>
    </div>
    <div style="padding:32px 36px">
      <p style="color:#475569;margin:0 0 20px;font-size:15px">Thanks for signing up! Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#f0fdf4;border:2px solid #00BFB3;border-radius:14px;padding:24px;text-align:center;margin:0 0 24px">
        <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#0B3D91;font-variant-numeric:tabular-nums">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div style="padding:16px 36px;background:#f1f5f9;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:12px">This is an automated message from Liliw Tourism. Do not reply.</p>
    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-reg-otp]', err);
    return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
  }
}
