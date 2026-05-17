import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM   = `"Liliw Tourism" <${process.env.EMAIL_USER}>`;
const ADMIN  = process.env.ADMIN_EMAIL || process.env.BOOKING_NOTIFY_EMAIL || process.env.EMAIL_USER || '';
const SITE   = (process.env.NEXT_PUBLIC_SITE_URL || 'https://liliw-frontend-prod.vercel.app').replace(/\/$/, '');
const LOGO   = `${SITE}/icon-192x192.png`;

// ── helpers ────────────────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#EFF6FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px">

    <!-- Card -->
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(11,61,145,.14)">

      <!-- Header -->
      <div style="background:linear-gradient(145deg,#0B3D91 0%,#1565C0 55%,#1976D2 100%);padding:36px 40px 32px">

        <!-- Logo row -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td style="vertical-align:middle;padding-right:14px">
              <img src="${LOGO}" alt="Liliw Tourism Logo"
                width="52" height="52"
                style="border-radius:14px;border:2px solid rgba(245,197,24,.5);display:block" />
            </td>
            <td style="vertical-align:middle">
              <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#F5C518">Liliw Tourism</p>
              <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,.45)">Laguna, Philippines</p>
            </td>
          </tr>
        </table>

        <!-- Title -->
        <h1 style="margin:0 0 0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.3;letter-spacing:-.3px">${title}</h1>

        <!-- Gold accent bar -->
        <div style="margin-top:20px;height:3px;border-radius:2px;background:linear-gradient(90deg,#F5C518 0%,rgba(245,197,24,.1) 100%)"></div>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px 32px">
        ${body}
      </div>

      <!-- Footer -->
      <div style="padding:20px 40px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:10px">
          <tr>
            <td style="vertical-align:middle;padding-right:8px">
              <img src="${LOGO}" alt="" width="22" height="22"
                style="border-radius:5px;display:block;opacity:.55" />
            </td>
            <td style="vertical-align:middle">
              <p style="margin:0;font-size:12px;font-weight:700;color:#64748B">Liliw Tourism</p>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.7">
          This is an automated message. Please do not reply to this email.<br>
          &copy; ${new Date().getFullYear()} Liliw Tourism &mdash; Laguna, Philippines
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

function field(label: string, value: string) {
  return `
  <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #F1F5F9">
    <p style="margin:0;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em">${label}</p>
    <p style="margin:5px 0 0;font-size:15px;color:#1E293B;font-weight:500">${value || '&mdash;'}</p>
  </div>`;
}

function btn(label: string, url: string, color = '#1565C0') {
  const shadow = color === '#1565C0' ? 'rgba(21,101,192,.3)' : color === '#10B981' ? 'rgba(16,185,129,.3)' : 'rgba(0,0,0,.15)';
  return `<a href="${url}"
    style="display:inline-block;margin-top:24px;padding:14px 28px;background:${color};color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;letter-spacing:.01em;box-shadow:0 4px 14px ${shadow}"
    >${label} &rarr;</a>`;
}

function otpBox(code: string) {
  return `
  <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:2px solid #1565C0;border-radius:16px;padding:28px 20px;text-align:center;margin:24px 0">
    <p style="margin:0 0 10px;font-size:10px;font-weight:800;color:#1565C0;text-transform:uppercase;letter-spacing:.18em">Your Verification Code</p>
    <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;color:#0B3D91;font-variant-numeric:tabular-nums;line-height:1">${code}</p>
    <p style="margin:12px 0 0;font-size:12px;color:#64748B">Expires in <strong style="color:#1565C0">10 minutes</strong></p>
  </div>`;
}

function infoBox(content: string, variant: 'green' | 'amber' | 'blue' = 'blue') {
  const map = {
    green: { bg: '#F0FDF4', border: '#86EFAC', titleColor: '#166534', textColor: '#14532D' },
    amber: { bg: '#FFFBEB', border: '#FCD34D', titleColor: '#92400E', textColor: '#78350F' },
    blue:  { bg: '#EFF6FF', border: '#93C5FD', titleColor: '#1E40AF', textColor: '#1E3A8A' },
  };
  const c = map[variant];
  return `<div style="background:${c.bg};border:1.5px solid ${c.border};border-radius:14px;padding:20px 24px;margin:20px 0">${content}</div>`;
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
      'New Business Application',
      `<p style="color:#475569;font-size:15px;margin:0 0 6px">A new <strong>Local Business Owner</strong> application has been submitted and is awaiting your review.</p>
      <p style="color:#94A3B8;font-size:13px;margin:0 0 24px">Please log in to the admin dashboard to review and take action.</p>
      <div style="background:#F8FAFC;border-radius:14px;padding:20px 24px;margin-bottom:8px">
        ${field('Business Name', app.business_name)}
        ${field('Owner / Representative', app.owner_name)}
        ${field('Email Address', app.email)}
        ${field('Contact Number', app.phone)}
        ${field('Business Address', app.address)}
        ${field('Business Type', app.business_type || '—')}
        ${field("Mayor's Permit / DTI No.", app.permit_number || '—')}
        ${field('Attraction / Listing Name', app.attraction_name || '—')}
      </div>
      ${btn('Review in Admin Dashboard', `${SITE}/admin`)}`,
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
      'Application Approved!',
      `<p style="color:#475569;font-size:15px;margin:0 0 20px">
        Congratulations, <strong>${app.owner_name}</strong>! Your Local Business Owner application for
        <strong>${app.business_name}</strong> has been <strong style="color:#16A34A">approved</strong>.
      </p>
      <p style="color:#475569;font-size:15px;margin:0 0 4px">Here are your account credentials to access the LBO Dashboard:</p>
      ${infoBox(`
        ${field('Username', app.username)}
        ${field('Temporary Password', app.password)}
        ${field('Login URL', `${SITE}/lbo`)}
      `, 'green')}
      <p style="color:#64748B;font-size:13px;margin:4px 0 0;padding:12px 16px;background:#FFFBEB;border-radius:10px;border-left:3px solid #F5C518">
        &#9888;&#65039; Please change your password immediately after your first login.
      </p>
      ${btn('Go to LBO Dashboard', `${SITE}/lbo`, '#10B981')}`,
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
      `<p style="color:#475569;font-size:15px;margin:0 0 20px">Dear <strong>${app.owner_name}</strong>,</p>
      <p style="color:#475569;font-size:15px;margin:0 0 20px">
        Thank you for your interest in joining Liliw Tourism as a Local Business Owner. After reviewing your application for
        <strong>${app.business_name}</strong>, we are unable to approve it at this time.
      </p>
      ${app.notes ? infoBox(`
        <p style="margin:0;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.08em">Reason</p>
        <p style="margin:6px 0 0;color:#78350F;font-size:15px">${app.notes}</p>
      `, 'amber') : ''}
      <p style="color:#475569;font-size:15px;margin:0 0 4px">
        You are welcome to reapply after addressing the concerns above.
        If you have questions, please contact us through the website.
      </p>
      ${btn('Visit Liliw Tourism', SITE, '#64748B')}`,
    ),
  });
}

export async function sendChangeRequestUpdate(data: {
  lbo_name: string; lbo_email: string; attraction_name: string;
  field_to_change: string; requested_value: string;
  status: 'done' | 'rejected'; editor_notes?: string;
}) {
  const isDone = data.status === 'done';
  await transporter.sendMail({
    from: FROM,
    to: data.lbo_email,
    subject: `Change Request ${isDone ? 'Approved' : 'Update'} — ${data.attraction_name}`,
    html: base(
      isDone ? 'Change Request Approved' : 'Change Request Update',
      `<p style="color:#475569;font-size:15px;margin:0 0 20px">Dear <strong>${data.lbo_name}</strong>,</p>
      <p style="color:#475569;font-size:15px;margin:0 0 4px">
        Your change request for <strong>${data.attraction_name}</strong> has been
        <strong style="color:${isDone ? '#16A34A' : '#DC2626'}">${isDone ? 'approved' : 'reviewed'}</strong>.
      </p>
      <div style="background:#F8FAFC;border-radius:14px;padding:20px 24px;margin:20px 0">
        ${field('Attraction', data.attraction_name)}
        ${field('Field Requested', data.field_to_change)}
        ${field('Requested Value', data.requested_value)}
        ${field('Status', isDone ? '&#9989; Approved' : '&#10060; Rejected')}
      </div>
      ${data.editor_notes ? infoBox(`
        <p style="margin:0;font-size:10px;font-weight:700;color:${isDone ? '#166534' : '#92400E'};text-transform:uppercase;letter-spacing:.08em">Editor Notes</p>
        <p style="margin:6px 0 0;font-size:15px;color:${isDone ? '#14532D' : '#78350F'}">${data.editor_notes}</p>
      `, isDone ? 'green' : 'amber') : ''}
      ${isDone
        ? `<p style="color:#475569;font-size:14px;margin:0">The change will be reflected on the website shortly.</p>${btn('View Your Dashboard', `${SITE}/lbo`, '#10B981')}`
        : `<p style="color:#475569;font-size:14px;margin:0">If you have questions, please contact us or submit a new request.</p>${btn('Visit Liliw Tourism', SITE, '#64748B')}`
      }`,
    ),
  });
}

export async function sendAttractionRequestNotification(data: {
  lbo_name: string; lbo_email: string; business_name: string;
  attraction_name: string; category?: string; description?: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `New Attraction Request — ${data.attraction_name}`,
    html: base(
      'New Attraction Listing Request',
      `<p style="color:#475569;font-size:15px;margin:0 0 6px">An LBO has submitted a request to add a new attraction to the tourism directory.</p>
      <p style="color:#94A3B8;font-size:13px;margin:0 0 24px">Please review and take action in the admin dashboard.</p>
      <div style="background:#F8FAFC;border-radius:14px;padding:20px 24px;margin-bottom:8px">
        ${field('LBO / Owner', data.lbo_name)}
        ${field('Email', data.lbo_email)}
        ${field('Business', data.business_name)}
        ${field('Attraction Name', data.attraction_name)}
        ${field('Category', data.category || '—')}
        ${field('Description', data.description || '—')}
      </div>
      ${btn('Review in Admin Dashboard', `${SITE}/admin`)}`,
    ),
  });
}

export async function sendAttractionRequestUpdate(data: {
  lbo_name: string; lbo_email: string; attraction_name: string;
  status: 'approved' | 'rejected'; notes?: string;
}) {
  const isApproved = data.status === 'approved';
  await transporter.sendMail({
    from: FROM,
    to: data.lbo_email,
    subject: `Attraction Request ${isApproved ? 'Approved' : 'Update'} — ${data.attraction_name}`,
    html: base(
      isApproved ? 'Attraction Request Approved' : 'Attraction Request Update',
      `<p style="color:#475569;font-size:15px;margin:0 0 20px">Dear <strong>${data.lbo_name}</strong>,</p>
      <p style="color:#475569;font-size:15px;margin:0 0 4px">
        Your request to add <strong>${data.attraction_name}</strong> to the Liliw Tourism directory has been
        <strong style="color:${isApproved ? '#16A34A' : '#DC2626'}">${isApproved ? 'approved' : 'reviewed'}</strong>.
      </p>
      ${data.notes ? infoBox(`
        <p style="margin:0;font-size:10px;font-weight:700;color:${isApproved ? '#166534' : '#92400E'};text-transform:uppercase;letter-spacing:.08em">Notes</p>
        <p style="margin:6px 0 0;font-size:15px;color:${isApproved ? '#14532D' : '#78350F'}">${data.notes}</p>
      `, isApproved ? 'green' : 'amber') : ''}
      ${isApproved
        ? `<p style="color:#475569;font-size:14px;margin:0">Our team will create the listing shortly. You will receive your attraction credentials soon.</p>${btn('View Your Dashboard', `${SITE}/lbo`, '#10B981')}`
        : `<p style="color:#475569;font-size:14px;margin:0">If you have questions or would like to resubmit, please contact us or use your dashboard.</p>${btn('Visit Liliw Tourism', SITE, '#64748B')}`
      }`,
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
      `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission`,
      `<p style="color:#475569;font-size:15px;margin:0 0 24px">A new message has been submitted through the Liliw Tourism website.</p>
      <div style="background:#F8FAFC;border-radius:14px;padding:20px 24px;margin-bottom:8px">
        ${field('Name', data.name)}
        ${field('Email', data.email)}
        ${field('Phone', data.phone || '—')}
        ${field('Type', data.type)}
        ${field('Message', data.message)}
      </div>
      ${btn('View in Admin Dashboard', `${SITE}/admin`)}`,
    ),
  });
}

export { otpBox };
