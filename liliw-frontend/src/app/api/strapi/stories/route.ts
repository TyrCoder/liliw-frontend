import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const OPTS   = { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 120 } } as const;

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI}${url}`;
}

function coverImageUrl(a: any): string {
  const img = a?.cover_image?.data?.attributes ?? a?.cover_image ?? {};
  return mediaUrl(img?.url ?? img?.formats?.large?.url ?? img?.formats?.medium?.url);
}

function allImageUrls(a: any): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (url: string | undefined) => {
    const u = mediaUrl(url);
    if (u && !seen.has(u)) { seen.add(u); urls.push(u); }
  };
  const ci = a?.cover_image?.data?.attributes ?? a?.cover_image;
  add(ci?.url ?? ci?.formats?.large?.url ?? ci?.formats?.medium?.url);
  const photos = a?.photos?.data ?? (Array.isArray(a?.photos) ? a.photos : []);
  photos.forEach((p: any) => { const x = p?.attributes ?? p; add(x?.url ?? x?.formats?.large?.url ?? x?.formats?.medium?.url); });
  const images = a?.images?.data ?? (Array.isArray(a?.images) ? a.images : []);
  images.forEach((p: any) => { const x = p?.attributes ?? p; add(x?.url ?? x?.formats?.large?.url ?? x?.formats?.medium?.url); });
  return urls;
}

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI}/api/stories?populate=*&sort=createdAt:desc&pagination[pageSize]=100`,
      OPTS,
    );

    if (!res.ok) return NextResponse.json({ data: [] });

    const json = await res.json();
    const raw: any[] = json?.data ?? [];

    const data = raw.map((item: any) => {
      // Strapi 5 returns flat fields; Strapi 4 nests under attributes
      const a = item?.attributes ?? item;
      return {
        ...item,
        // Normalise so the detail page can always use item?.attributes ?? item
        _coverUrl:  coverImageUrl(a),
        _allImages: allImageUrls(a),
      };
    });

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
