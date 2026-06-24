import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAuth } from '@/lib/auth';
import { profileOtpStore, generateOtp } from '@/lib/profileOtpStore';
import { checkRateLimit } from '@/lib/ratelimit';
import { supabaseServer } from '@/lib/supabase-server';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
const LOGO = `${SITE}/icon-192x192.png`;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 });
  }

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { purpose, newEmail } = await req.json();
  const targetEmail = purpose === 'email_new' ? (newEmail ?? '') : user.email!;
  if (!targetEmail) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const key = `${user.id}-${purpose}`;
  const otp = generateOtp();
  profileOtpStore.set(key, { otp, expiry: Date.now() + 10 * 60 * 1000 });

  const subjectMap: Record<string, string> = {
    password:  'Liliw Tourism — Verify your password change',
    email_old: 'Liliw Tourism — Verify your current email',
    email_new: 'Liliw Tourism — Verify your new email address',
  };
  const headingMap: Record<string, string> = {
    password:  'Password Change Verification',
    email_old: 'Verify Your Identity',
    email_new: 'Verify Your New Email',
  };
  const bodyMap: Record<string, string> = {
    password:  'Use the code below to confirm your password change.',
    email_old: 'Use the code below to verify you own this account before changing your email.',
    email_new: `Use the code below to confirm <strong>${targetEmail}</strong> as your new email address.`,
  };

  await transporter.sendMail({
    from: `"Liliw Tourism" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: subjectMap[purpose] ?? 'Liliw Tourism — Verification Code',
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#EFF6FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px">
    <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(11,61,145,.14)">
      <div style="background:linear-gradient(145deg,#0B3D91,#1565C0);padding:36px 40px 32px">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr>
          <td style="padding-right:14px"><img src="${LOGO}" width="52" height="52" style="border-radius:14px;border:2px solid rgba(245,197,24,.5);display:block"/></td>
          <td><p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#F5C518">Liliw Tourism</p></td>
        </tr></table>
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">${headingMap[purpose] ?? 'Verification Code'}</h1>
      </div>
      <div style="padding:36px 40px 32px">
        <p style="color:#475569;font-size:14px;margin:0 0 20px">${bodyMap[purpose] ?? 'Use the code below.'}</p>
        <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:2px solid #1565C0;border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 10px;font-size:10px;font-weight:800;color:#1565C0;text-transform:uppercase;letter-spacing:.18em">Verification Code</p>
          <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;color:#0B3D91;line-height:1">${otp}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#64748B">Expires in <strong style="color:#1565C0">10 minutes</strong></p>
        </div>
        <p style="color:#94A3B8;font-size:12px;text-align:center">If you didn&rsquo;t request this, you can safely ignore this email.</p>
      </div>
      <div style="padding:20px 40px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0">
        <p style="margin:0;font-size:11px;color:#94A3B8">&copy; ${new Date().getFullYear()} Liliw Tourism &mdash; Laguna, Philippines</p>
      </div>
    </div>
  </div>
</body></html>`,
  });

  return NextResponse.json({ success: true });
}
