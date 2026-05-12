import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  const res = await fetch(
    `${STRAPI}/api/events?filters[is_joinable][$eq]=true&populate=cover_image&publicationState=live&sort=date_start:asc`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 60 } },
  );
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json(), {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
  });
}
