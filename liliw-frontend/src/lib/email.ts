import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"Liliw Tourism" <${process.env.EMAIL_USER}>`;
const ADMIN = process.env.ADMIN_EMAIL || process.env.BOOKING_NOTIFY_EMAIL || process.env.EMAIL_USER || '';

// ── helpers ────────────────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#0B3D91,#1565C0);padding:32px 36px">
      <p style="margin:0;color:#93C5FD;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Liliw Tourism</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3">${title}</h1>
    </div>
    <div style="padding:32px 36px">
      ${body}
    </div>
    <div style="padding:20px 36px;background:#f1f5f9;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:12px">This is an automated message from the Liliw Tourism website. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

function field(label: string, value: string) {
  return `
  <div style="margin-bottom:14px">
    <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">${label}</p>
    <p style="margin:4px 0 0;font-size:15px;color:#1e293b">${value || '—'}</p>
  </div>`;
}

function btn(label: string, url: string, color = '#1565C0') {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${color};color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">${label}</a>`;
}

// ── email senders ───────────────────────────────────────────────────────────

export async function sendNewApplicationNotification(app: {
  business_name: string; owner_name: string; email: string;
  phone: string; address: string; business_type?: string;
  permit_number?: string; attraction_name?: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `New LBO Application — ${app.business_name}`,
    html: base(
      '📋 New Business Application',
      `<p style="color:#475569;margin:0 0 24px">A new Local Business Owner application has been submitted and is waiting for your review.</p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px">
        ${field('Business Name', app.business_name)}
        ${field('Owner / Representative', app.owner_name)}
        ${field('Email', app.email)}
        ${field('Contact Number', app.phone)}
        ${field('Business Address', app.address)}
        ${field('Business Type', app.business_type || '—')}
        ${field("Mayor's Permit / DTI No.", app.permit_number || '—')}
        ${field('Attraction / Listing Name', app.attraction_name || '—')}
      </div>
      ${btn('Review in Admin Dashboard', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'}/admin`)}`,
    ),
  });
}

export async function sendApprovalEmail(app: {
  owner_name: string; email: string; business_name: string;
  username: string; password: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: app.email,
    subject: `Your LBO Application is Approved — ${app.business_name}`,
    html: base(
      '🎉 Application Approved!',
      `<p style="color:#475569;margin:0 0 20px">Congratulations, <strong>${app.owner_name}</strong>! Your Local Business Owner application for <strong>${app.business_name}</strong> has been approved.</p>
      <p style="color:#475569;margin:0 0 20px">Here are your account credentials to access your LBO Dashboard:</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px">
        ${field('Username', app.username)}
        ${field('Password', app.password)}
        ${field('Login URL', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'}/login`)}
      </div>
      <p style="color:#64748b;font-size:13px;margin:0 0 4px">⚠️ Please change your password after your first login.</p>
      ${btn('Go to LBO Dashboard', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'}/lbo`, '#10B981')}`,
    ),
  });
}

export async function sendRejectionEmail(app: {
  owner_name: string; email: string; business_name: string; notes?: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: app.email,
    subject: `Update on Your LBO Application — ${app.business_name}`,
    html: base(
      'Application Update',
      `<p style="color:#475569;margin:0 0 20px">Dear <strong>${app.owner_name}</strong>,</p>
      <p style="color:#475569;margin:0 0 20px">Thank you for your interest in becoming a Local Business Owner on the Liliw Tourism website. After reviewing your application for <strong>${app.business_name}</strong>, we are unable to approve it at this time.</p>
      ${app.notes ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="margin:0;font-size:12px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:.06em">Reason</p>
        <p style="margin:8px 0 0;color:#7c2d12;font-size:15px">${app.notes}</p>
      </div>` : ''}
      <p style="color:#475569;margin:0 0 20px">You are welcome to reapply after addressing the concerns above. If you have questions, please contact us through the website.</p>
      ${btn('Visit Liliw Tourism', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'}`, '#64748B')}`,
    ),
  });
}

export async function sendContactNotification(data: {
  name: string; email: string; phone?: string; type: string; message: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `New ${data.type} submission — ${data.name}`,
    html: base(
      `📬 New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission`,
      `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px">
        ${field('Name', data.name)}
        ${field('Email', data.email)}
        ${field('Phone', data.phone || '—')}
        ${field('Type', data.type)}
        ${field('Message', data.message)}
      </div>
      ${btn('View in Admin Dashboard', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app'}/admin`)}`,
    ),
  });
}
