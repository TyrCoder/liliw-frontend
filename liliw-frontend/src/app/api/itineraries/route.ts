import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, participants, itinerary, totalActivities, estimatedCost } = await request.json();

    if (!name || !email || !phone || !itinerary || itinerary.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/itineraries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            guestName: name,
            guestEmail: email,
            guestPhone: phone,
            participants,
            itineraryItems: itinerary,
            totalActivities,
            estimatedCost,
            status: 'pending',
            createdAt: new Date(),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save itinerary');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Itinerary saved! Check your email for details.',
        itineraryRef: `LILIW-ITIN-${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Itinerary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Itinerary save failed' },
      { status: 500 }
    );
  }
}
