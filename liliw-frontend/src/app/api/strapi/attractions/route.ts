import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const OPTS   = { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 120 } } as const;

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText.filter(Boolean)
      .map((block: any) => (block?.children ?? []).map((c: any) => c?.text ?? '').join(' '))
      .filter(Boolean).join(' ');
  }
  return '';
}

function normalizePhotos(attrs: any): any[] {
  const raw = attrs?.photos ?? attrs?.images ?? [];
  const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data.map((d: any) => d?.attributes ?? d) : [];
  return arr
    .map((p: any) => ({ id: p?.id, name: p?.name, url: p?.url, width: p?.width, height: p?.height, formats: p?.formats, mime: p?.mime }))
    .filter((p: any) => p?.url);
}

function transform(item: any, type: 'heritage' | 'spot' | 'dining') {
  if (!item) return null;
  const a = item.attributes ?? item;
  return {
    id: `${type}-${item.id}`,
    strapiId: item.documentId ?? item.id,
    attributes: {
      name: a.name || 'Unnamed',
      description: extractText(a.description),
      location: a.location || '',
      category: a.category || type,
      rating: a.rating || 0,
      phone: a.phone || '',
      hours: a.hours || '',
      website: a.website || '',
      best_for: a.best_for || '',
      google_place_id: a.google_place_id ?? undefined,
      coordinates: a.coordinates ?? undefined,
      has_virtual_tour: a.has_virtual_tour || false,
      hotspots: a.hotspots || [],
      virtual_tour_photos: a.virtual_tour_photos || [],
      photos: normalizePhotos(a),
    },
    type,
  };
}

export async function GET() {
  const [hRes, sRes, dRes] = await Promise.allSettled([
    fetch(`${STRAPI}/api/heritage-sites?populate=*&pagination[pageSize]=100`, OPTS),
    fetch(`${STRAPI}/api/tourist-spots?populate=*&pagination[pageSize]=100`, OPTS),
    fetch(`${STRAPI}/api/dining-and-foods?populate=*&pagination[pageSize]=100`, OPTS),
  ]);

  const pick = async (r: PromiseSettledResult<Response>) =>
    r.status === 'fulfilled' && r.value.ok ? (await r.value.json()).data ?? [] : [];

  const [heritage, spots, dining] = await Promise.all([pick(hRes), pick(sRes), pick(dRes)]);

  const data = [
    ...heritage.map((h: any) => transform(h, 'heritage')).filter(Boolean),
    ...spots.map((s: any)   => transform(s, 'spot')).filter(Boolean),
    ...dining.map((d: any)  => transform(d, 'dining')).filter(Boolean),
  ];

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
  });
}
