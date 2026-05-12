import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  const res = await fetch(
    `${STRAPI}/api/hero-slides?populate=*&sort=sort_order:asc&filters[is_active][$eq]=true`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 300 } },
  );
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json(), {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
