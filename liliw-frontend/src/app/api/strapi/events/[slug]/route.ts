import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ data: [] });
    const res = await fetch(
      `${STRAPI}/api/events?filters[slug][$eq]=${slug}&populate=cover_image,photos&status=published`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 60 } },
    );
    if (!res.ok) return NextResponse.json({ data: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [] });
  }
}
