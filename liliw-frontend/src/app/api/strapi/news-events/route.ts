import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    const limit = new URL(request.url).searchParams.get('limit') || '20';
    const h = { Authorization: `Bearer ${TOKEN}` };
    const opts = { headers: h, next: { revalidate: 300 } } as const;

    const [newsRes, eventsRes] = await Promise.allSettled([
      fetch(`${STRAPI}/api/newses?populate=*&sort=createdAt:desc&pagination[limit]=${limit}`, opts),
      fetch(`${STRAPI}/api/events?populate=*&status=published&sort=date_start:desc&pagination[limit]=${limit}`, opts),
    ]);

    const news   = newsRes.status   === 'fulfilled' && newsRes.value.ok   ? await newsRes.value.json()   : null;
    const events = eventsRes.status === 'fulfilled' && eventsRes.value.ok ? await eventsRes.value.json() : null;

    return NextResponse.json({ news, events }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ news: null, events: null });
  }
}
