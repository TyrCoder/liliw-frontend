import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json(null, { status: 401 });

  const meRes = await fetch(`${STRAPI}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!meRes.ok) return NextResponse.json(null, { status: 401 });

  const user = await meRes.json();

  // Fall back to API token fetch if role not populated
  if (!user.role && user.id) {
    const byIdRes = await fetch(`${STRAPI}/api/users/${user.id}?populate=role`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (byIdRes.ok) {
      const full = await byIdRes.json();
      user.role = full.role ?? null;
    }
  }

  return NextResponse.json(user);
}
