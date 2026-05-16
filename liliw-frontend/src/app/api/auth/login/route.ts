import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: { message: 'Too many attempts. Try again in 1 minute.' } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const res = await fetch(`${STRAPI}/api/auth/local`, {
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

    // users/me?populate=role sometimes doesn't return the role field —
    // fall back to fetching the user by ID with the full-access API token
    if (!user.role && user.id) {
      const byIdRes = await fetch(`${STRAPI}/api/users/${user.id}?populate=role`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (byIdRes.ok) {
        const full = await byIdRes.json();
        user.role = full.role ?? null;
      }
    }

    return NextResponse.json({ jwt: data.jwt, user });
  } catch {
    return NextResponse.json(
      { error: { message: 'Login failed. Please try again.' } },
      { status: 500 },
    );
  }
}
