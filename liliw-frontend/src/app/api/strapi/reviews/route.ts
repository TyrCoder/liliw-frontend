import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(request: NextRequest) {
  const itemId = new URL(request.url).searchParams.get('itemId');
  const url = itemId
    ? `${STRAPI}/api/reviews?filters[item_id][$eq]=${encodeURIComponent(itemId)}&populate=*`
    : `${STRAPI}/api/reviews?populate=*&pagination[limit]=500&sort=createdAt:desc`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json());
}
