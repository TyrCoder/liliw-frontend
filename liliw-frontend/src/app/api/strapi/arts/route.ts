import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  try {
    const h = { Authorization: `Bearer ${TOKEN}` };
    const opts = { headers: h, next: { revalidate: 300 } } as const;

    const [artFormsRes, artisansRes] = await Promise.allSettled([
      fetch(`${STRAPI}/api/art-forms?populate=*&sort=sort_order:asc`, opts),
      fetch(`${STRAPI}/api/artisans?populate=*`, opts),
    ]);

    const artForms = artFormsRes.status === 'fulfilled' && artFormsRes.value.ok ? await artFormsRes.value.json() : null;
    const artisans = artisansRes.status === 'fulfilled' && artisansRes.value.ok ? await artisansRes.value.json() : null;

    return NextResponse.json({ artForms, artisans }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ artForms: null, artisans: null });
  }
}
