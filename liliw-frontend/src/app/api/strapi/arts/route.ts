import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  const h = { Authorization: `Bearer ${TOKEN}` };

  const [artFormsRes, artisansRes] = await Promise.allSettled([
    fetch(`${STRAPI}/api/art-forms?populate=*&sort=sort_order:asc`, { headers: h }),
    fetch(`${STRAPI}/api/artisans?populate=*`, { headers: h }),
  ]);

  const artForms  = artFormsRes.status  === 'fulfilled' && artFormsRes.value.ok  ? await artFormsRes.value.json()  : null;
  const artisans  = artisansRes.status  === 'fulfilled' && artisansRes.value.ok  ? await artisansRes.value.json()  : null;

  return NextResponse.json({ artForms, artisans });
}
