import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Save to Strapi
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

    if (!strapiUrl || !strapiToken) {
      throw new Error('Missing Strapi configuration');
    }

    const response = await fetch(`${strapiUrl}/api/newsletter-subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${strapiToken}`,
      },
      body: JSON.stringify({
        data: {
          email,
          subscribedAt: new Date(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi error:', errorText);
      throw new Error('Failed to save subscription');
    }

    return NextResponse.json(
      { success: true, message: 'Subscribed successfully' },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Newsletter error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Subscription failed' },
      { status: 500 }
    );
  }
}
