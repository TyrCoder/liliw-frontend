import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, date, participants, notes, tourName, tourId, totalCost } = await request.json();

    if (!name || !email || !phone || !date || !tourId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/bookings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
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
            createdAt: new Date(),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save booking');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Booking confirmed! Check your email for confirmation details.',
        bookingRef: `LILIW-${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Booking failed' },
      { status: 500 }
    );
  }
}
