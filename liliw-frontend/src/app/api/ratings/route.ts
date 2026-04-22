import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { itemId, itemName, author, rating, comment } = await request.json();

    if (!itemId || !author || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Save to Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/reviews`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            itemId,
            itemName,
            author,
            rating,
            comment,
            createdAt: new Date(),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save rating');
    }

    return NextResponse.json(
      { success: true, message: 'Rating saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Ratings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save rating' },
      { status: 500 }
    );
  }
}
