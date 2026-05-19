import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI}/api/events?filters[is_joinable][$eq]=true&populate=*&status=published&sort=date_start:asc`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 60 } },
    );
    if (!res.ok) return NextResponse.json({ data: [] });
    return NextResponse.json(await res.json(), {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
