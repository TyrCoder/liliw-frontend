import { NextResponse } from 'next/server';

const STRAPI      = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI}/api/submissions?sort=createdAt:desc&pagination[limit]=100&populate=*`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('Strapi error');
    const data = await res.json();
    return NextResponse.json({ success: true, data: data.data || [] });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
