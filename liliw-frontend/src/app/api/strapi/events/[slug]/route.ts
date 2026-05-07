import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const res = await fetch(
    `${STRAPI}/api/events?filters[slug][$eq]=${params.slug}&populate=cover_image,photos&publicationState=live`,
    { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 60 } },
  );
  if (!res.ok) return NextResponse.json({ data: [] });
  return NextResponse.json(await res.json());
}
