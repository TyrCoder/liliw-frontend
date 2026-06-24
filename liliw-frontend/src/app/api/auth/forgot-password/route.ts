import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabase-server';

export const otpStore = new Map<string, { otp: string; expiry: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
const LOGO = `${SITE}/icon-192x192.png`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Try again in 1 minute.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Check if email exists in profiles — don't reveal whether it does
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!profile) return NextResponse.json({ success: true }); // silent — don't reveal

    const otp = generateOtp();
    otpStore.set(email.toLowerCase(), { otp, expiry: Date.now() + 10 * 60 * 1000 });

    await transporter.sendMail({
      from: `"Liliw Tourism" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Liliw Tourism password reset code',
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#EFF6FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(11,61,145,.14)">
      <div style="background:linear-gradient(145deg,#0B3D91,#1565C0);padding:36px 40px 32px">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr>
          <td style="padding-right:14px"><img src="${LOGO}" alt="Liliw Tourism" width="52" height="52" style="border-radius:14px;border:2px solid rgba(245,197,24,.5);display:block"/></td>
          <td><p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#F5C518">Liliw Tourism</p><p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,.45)">Laguna, Philippines</p></td>
        </tr></table>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.3">Password Reset</h1>
        <div style="margin-top:20px;height:3px;border-radius:2px;background:linear-gradient(90deg,#F5C518,rgba(245,197,24,.1))"></div>
      </div>
      <div style="padding:36px 40px 32px">
        <p style="color:#475569;font-size:15px;margin:0 0 6px">We received a request to reset your Liliw Tourism account password.</p>
        <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:2px solid #1565C0;border-radius:16px;padding:28px 20px;text-align:center;margin:24px 0">
          <p style="margin:0 0 10px;font-size:10px;font-weight:800;color:#1565C0;text-transform:uppercase;letter-spacing:.18em">Your Reset Code</p>
          <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;color:#0B3D91;font-variant-numeric:tabular-nums;line-height:1">${otp}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#64748B">Expires in <strong style="color:#1565C0">10 minutes</strong></p>
        </div>
        <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0">If you didn&rsquo;t request a password reset, you can safely ignore this email.</p>
      </div>
      <div style="padding:20px 40px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0">
        <p style="margin:0;font-size:11px;color:#94A3B8">&copy; ${new Date().getFullYear()} Liliw Tourism &mdash; Laguna, Philippines</p>
      </div>
    </div>
  </div>
</body></html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }
}
