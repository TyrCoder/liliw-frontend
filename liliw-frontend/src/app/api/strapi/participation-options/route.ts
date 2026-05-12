import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI}/api/participation-options?sort=display_order:asc`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 300 } },
    );
    if (!res.ok) return NextResponse.json({ data: [] });
    return NextResponse.json(await res.json(), {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
