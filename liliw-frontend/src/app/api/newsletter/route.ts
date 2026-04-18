import { NextRequest, NextResponse } from 'next/server';

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/newsletter-subscribers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            email,
            subscribedAt: new Date(),
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Strapi error:', await response.text());
      throw new Error('Failed to save subscription');
    }

    return NextResponse.json(
      { success: true, message: 'Subscribed successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Subscription failed' },
      { status: 500 }
    );
  }
}
