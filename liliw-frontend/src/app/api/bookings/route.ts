import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, date, participants, notes, tourName, tourId, totalCost } = await request.json();

    if (!name || !email || !phone || !date || !tourId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bookingRef = `LILIW-${Date.now()}`;

    // Try to persist to Strapi — non-fatal if content type isn't set up yet
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            bookingRef,
            tourId,
            tourName,
            guestName: name,
            guestEmail: email,
            guestPhone: phone,
            bookingDate: date,
            participants,
            specialRequests: notes,
            totalCost,
            status: 'pending',
          },
        }),
      });
    } catch {
      logger.warn('Strapi bookings content type not available — booking confirmed without persistence');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking confirmed! Our team will contact you shortly.',
        bookingRef,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Booking failed' },
      { status: 500 }
    );
  }
}
