import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const OPTS   = { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 120 } } as const;

type GalleryCategory = 'heritage' | 'nature' | 'food' | 'culture' | 'events' | 'community';

function extractPhotos(items: any[], category: GalleryCategory, titleField = 'name'): any[] {
  const result: any[] = [];
  items.forEach((item: any) => {
    const a = item.attributes ?? item;
    const raw = a?.photos ?? a?.images ?? a?.image ?? [];
    const photos: any[] = Array.isArray(raw) ? raw
      : Array.isArray(raw?.data) ? raw.data.map((d: any) => d?.attributes ?? d)
      : raw?.url ? [raw]
      : [];

    photos.forEach((photo: any, pi: number) => {
      const url = photo?.url ?? photo?.formats?.large?.url ?? photo?.formats?.medium?.url;
      if (!url) return;
      result.push({
        id: `${category}-${item.id ?? item.documentId}-${pi}`,
        attributes: {
          title: a?.[titleField] || a?.title || '',
          description: '',
          category,
          image: { data: { attributes: { url, formats: photo?.formats ?? {} } } },
        },
      });
    });
  });
  return result;
}

async function pickData(r: PromiseSettledResult<Response>): Promise<any[]> {
  if (r.status !== 'fulfilled' || !r.value.ok) return [];
  const json = await r.value.json();
  return json?.data ?? [];
}

export async function GET() {
  try {
    const [galleryRes, heritageRes, spotsRes, diningRes, cultureRes] = await Promise.allSettled([
      fetch(`${STRAPI}/api/gallery-items?populate=*&sort=sort_order:asc,createdAt:desc&pagination[pageSize]=100`, OPTS),
      fetch(`${STRAPI}/api/heritage-sites?populate=photos&pagination[pageSize]=100`, OPTS),
      fetch(`${STRAPI}/api/tourist-spots?populate=photos&pagination[pageSize]=100`, OPTS),
      fetch(`${STRAPI}/api/dining-and-foods?populate=photos&pagination[pageSize]=100`, OPTS),
      fetch(`${STRAPI}/api/culture-heritages?populate=images,image&pagination[pageSize]=100`, OPTS),
    ]);

    const [galleryItems, heritage, spots, dining, culture] = await Promise.all([
      pickData(galleryRes),
      pickData(heritageRes),
      pickData(spotsRes),
      pickData(diningRes),
      pickData(cultureRes),
    ]);

    const data = [
      ...galleryItems,
      ...extractPhotos(heritage, 'heritage'),
      ...extractPhotos(spots, 'nature'),
      ...extractPhotos(dining, 'food'),
      ...extractPhotos(culture, 'culture', 'title'),
    ];

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
