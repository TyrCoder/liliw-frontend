import { NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
const OPTS   = { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 120 } } as const;

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .flatMap((b: any) => b?.children ?? [])
      .map((c: any) => c?.text ?? '')
      .join(' ')
      .slice(0, 300);
  }
  return '';
}

function firstImageUrl(attrs: any): string {
  // Try cover_image, image, images, photos in order
  const candidates = [
    attrs?.cover_image?.data?.attributes,
    attrs?.cover_image,
    attrs?.image?.data?.attributes,
    attrs?.image,
    ...(Array.isArray(attrs?.images) ? attrs.images : Array.isArray(attrs?.images?.data) ? attrs.images.data.map((d: any) => d?.attributes) : []),
    ...(Array.isArray(attrs?.photos) ? attrs.photos : Array.isArray(attrs?.photos?.data) ? attrs.photos.data.map((d: any) => d?.attributes) : []),
  ];
  for (const c of candidates) {
    const url = c?.url ?? c?.formats?.large?.url ?? c?.formats?.medium?.url;
    if (url) return url;
  }
  return '';
}

function toStory(item: any, prefix: string, category: string, titleField = 'title') {
  const a = item?.attributes ?? item;
  const title = a?.[titleField] || a?.title || a?.name || '';
  const description = a?.description || a?.excerpt || '';
  const content = a?.content || a?.body || (description ? [{ type: 'paragraph', children: [{ text: description }] }] : []);
  return {
    id: `${prefix}-${item.id}`,
    attributes: {
      title,
      slug: `${prefix}-${item.documentId ?? item.id}`,
      excerpt: typeof description === 'string' ? description.slice(0, 200) : extractText(description),
      content: Array.isArray(content) ? content : [{ type: 'paragraph', children: [{ text: extractText(content) }] }],
      category,
      author: a?.author || 'Liliw Tourism Office',
      featured: a?.featured ?? false,
      cover_image: { data: { attributes: { url: firstImageUrl(a), formats: {} } } },
      publishedAt: a?.publishedAt || a?.createdAt || new Date().toISOString(),
    },
  };
}

async function pickData(r: PromiseSettledResult<Response>): Promise<any[]> {
  if (r.status !== 'fulfilled' || !r.value.ok) return [];
  return (await r.value.json())?.data ?? [];
}

export async function GET() {
  try {
    const [storiesRes, cultureRes, heritageRes] = await Promise.allSettled([
      fetch(`${STRAPI}/api/stories?populate=*&sort=createdAt:desc&pagination[pageSize]=50`, OPTS),
      fetch(`${STRAPI}/api/culture-heritages?populate=*&sort=createdAt:desc&pagination[pageSize]=50`, OPTS),
      fetch(`${STRAPI}/api/heritage-sites?populate=photos&sort=createdAt:desc&pagination[pageSize]=50`, OPTS),
    ]);

    const [strapiStories, cultureItems, heritageItems] = await Promise.all([
      pickData(storiesRes),
      pickData(cultureRes),
      pickData(heritageRes),
    ]);

    const syntheticStories = [
      ...cultureItems.map((item: any) => toStory(item, 'culture', 'culture')),
      ...heritageItems.map((item: any) => toStory(item, 'heritage', 'history', 'name')),
    ];

    const data = [...strapiStories, ...syntheticStories];

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
