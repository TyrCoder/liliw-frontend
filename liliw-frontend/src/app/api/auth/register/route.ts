import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Try again in 1 minute.' } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const res = await fetch(`${STRAPI}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Server is starting up, please try again in a moment.' } },
        { status: 503 },
      );
    }

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const user = await meRes.json();

    return NextResponse.json({ jwt: data.jwt, user });
  } catch {
    return NextResponse.json(
      { error: { message: 'Registration failed. Please try again.' } },
      { status: 500 },
    );
  }
}
