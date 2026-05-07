import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${STRAPI}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${data.jwt}` },
  });
  const user = await meRes.json();

  return NextResponse.json({ jwt: data.jwt, user });
}
