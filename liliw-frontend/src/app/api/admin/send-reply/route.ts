import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireStaffAuth } from '@/lib/auth';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
const LOGO = `${SITE}/icon-192x192.png`;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req: NextRequest) {
  const ok = await requireStaffAuth(req);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { to, name, subject, message } = await req.json();
    if (!to || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeName    = String(name || 'there').slice(0, 100);
    const safeSubject = String(subject || 'Reply from Liliw CHATO Office').slice(0, 200);
    const safeMessage = String(message).slice(0, 5000);

    // Convert newlines to <br> for HTML
    const messageHtml = safeMessage.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"Liliw CHATO Office" <${process.env.EMAIL_USER}>`,
      to,
      subject: safeSubject,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeSubject}</title></head>
<body style="margin:0;padding:0;background:#F0F9FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.10)">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%);padding:32px 40px 28px">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr>
            <td style="vertical-align:middle;padding-right:14px">
              <img src="${LOGO}" alt="Liliw Tourism" width="48" height="48"
                style="border-radius:12px;border:2px solid rgba(0,191,179,.4);display:block" />
            </td>
            <td style="vertical-align:middle">
              <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#00BFB3">Liliw Tourism</p>
              <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,.4)">CHATO Office · Laguna, Philippines</p>
            </td>
          </tr>
        </table>
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3">${safeSubject}</h1>
        <div style="margin-top:16px;height:2px;border-radius:2px;background:linear-gradient(90deg,#00BFB3 0%,rgba(0,191,179,.1) 100%)"></div>
      </div>

      <!-- Body -->
      <div style="padding:32px 40px 28px">
        <p style="color:#374151;font-size:15px;margin:0 0 20px">Dear <strong>${safeName}</strong>,</p>
        <div style="color:#4B5563;font-size:14px;line-height:1.75;background:#F8FAFC;border-left:3px solid #00BFB3;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 24px">
          ${messageHtml}
        </div>
        <p style="color:#94A3B8;font-size:13px;margin:0">
          Best regards,<br>
          <strong style="color:#374151">CHATO Office</strong><br>
          <span style="color:#6B7280">Liliw Tourism &mdash; Laguna, Philippines</span>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:18px 40px 22px;background:#F8FAFC;border-top:1px solid #E5E7EB">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:8px">
          <tr>
            <td style="vertical-align:middle;padding-right:8px">
              <img src="${LOGO}" alt="" width="20" height="20" style="border-radius:4px;display:block;opacity:.5" />
            </td>
            <td style="vertical-align:middle">
              <p style="margin:0;font-size:11px;font-weight:700;color:#6B7280">Liliw Tourism</p>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.7">
          This email was sent in response to your inquiry submitted through the Liliw Tourism website.<br>
          &copy; ${new Date().getFullYear()} Liliw Tourism &mdash; Laguna, Philippines
        </p>
      </div>

    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-reply]', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }
}
