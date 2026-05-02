import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.BOOKING_NOTIFY_EMAIL || 'tbalbieranvi@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, date, participants, notes, tourName, tourId, totalCost } = await request.json();

    if (!name || !email || !phone || !date || !tourId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bookingRef = `LILIW-${Date.now()}`;

    // 1. Save to Strapi (non-fatal if content type not ready)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: { bookingRef, tourId, tourName, guestName: name, guestEmail: email, guestPhone: phone, bookingDate: date, participants, specialRequests: notes, totalCost, status: 'pending' },
        }),
      });
    } catch {
      logger.warn('Strapi booking save skipped');
    }

    // 2. Send notification email to admin
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Liliw Tourism <bookings@liliw.com>',
          to: NOTIFY_EMAIL,
          subject: `New Booking: ${tourName} — ${bookingRef}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#0F1F3C,#1a3a5c);padding:24px 32px">
                <h2 style="color:#00BFB3;margin:0 0 4px">New Tour Booking</h2>
                <p style="color:#94a3b8;margin:0;font-size:13px">Ref: ${bookingRef}</p>
              </div>
              <div style="padding:28px 32px;background:#ffffff">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:140px">Tour</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${tourName}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Guest Name</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${name}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Email</td><td style="padding:8px 0;color:#0f172a"><a href="mailto:${email}" style="color:#00BFB3">${email}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Phone</td><td style="padding:8px 0;color:#0f172a">${phone}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Date</td><td style="padding:8px 0;color:#0f172a">${date}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Participants</td><td style="padding:8px 0;color:#0f172a">${participants}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Total Cost</td><td style="padding:8px 0;font-weight:700;color:#00BFB3;font-size:16px">₱${Number(totalCost).toLocaleString()}</td></tr>
                  ${notes ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;vertical-align:top">Notes</td><td style="padding:8px 0;color:#0f172a">${notes}</td></tr>` : ''}
                </table>
              </div>
              <div style="padding:16px 32px;background:#f1f5f9;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">Liliw Tourism — View all bookings in <a href="https://liliw-strapi-backend.onrender.com/admin" style="color:#00BFB3">Strapi Admin</a></p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        logger.error('Email send failed:', emailErr);
      }

      // 3. Send confirmation email to guest
      try {
        await resend.emails.send({
          from: 'Liliw Tourism <bookings@liliw.com>',
          to: email,
          subject: `Booking Confirmed — ${bookingRef}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#0F1F3C,#1a3a5c);padding:24px 32px">
                <h2 style="color:#00BFB3;margin:0 0 4px">Booking Confirmed! 🎉</h2>
                <p style="color:#94a3b8;margin:0;font-size:13px">Your booking reference: <strong style="color:white">${bookingRef}</strong></p>
              </div>
              <div style="padding:28px 32px;background:#ffffff">
                <p style="color:#374151;margin:0 0 20px">Hi <strong>${name}</strong>, thank you for booking with Liliw Tourism! Our team will contact you shortly to confirm the details.</p>
                <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px;margin-bottom:20px">
                  <p style="margin:0 0 8px;font-weight:700;color:#0F1F3C">${tourName}</p>
                  <p style="margin:0 0 4px;color:#64748b;font-size:13px">📅 ${date}</p>
                  <p style="margin:0 0 4px;color:#64748b;font-size:13px">👥 ${participants} ${Number(participants) === 1 ? 'person' : 'people'}</p>
                  <p style="margin:0;font-weight:700;color:#00BFB3;font-size:18px">₱${Number(totalCost).toLocaleString()}</p>
                </div>
                <p style="color:#64748b;font-size:13px;margin:0">Questions? Reply to this email or contact us at <a href="mailto:${NOTIFY_EMAIL}" style="color:#00BFB3">${NOTIFY_EMAIL}</a></p>
              </div>
              <div style="padding:16px 32px;background:#f1f5f9;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">Liliw, Laguna, Philippines 🇵🇭</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        logger.error('Guest confirmation email failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Booking confirmed! Check your email for details.', bookingRef }, { status: 201 });
  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Booking failed' }, { status: 500 });
  }
}
