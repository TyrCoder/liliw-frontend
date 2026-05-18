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

function allImageUrls(attrs: any): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (url: string | undefined) => {
    if (url && !seen.has(url)) { seen.add(url); urls.push(url); }
  };
  // cover image
  const ci = attrs?.cover_image?.data?.attributes ?? attrs?.cover_image;
  add(ci?.url ?? ci?.formats?.large?.url ?? ci?.formats?.medium?.url);
  // photos array
  const photos = attrs?.photos?.data ?? (Array.isArray(attrs?.photos) ? attrs.photos : []);
  photos.forEach((p: any) => {
    const a = p?.attributes ?? p;
    add(a?.url ?? a?.formats?.large?.url ?? a?.formats?.medium?.url);
  });
  // images array
  const images = attrs?.images?.data ?? (Array.isArray(attrs?.images) ? attrs.images : []);
  images.forEach((img: any) => {
    const a = img?.attributes ?? img;
    add(a?.url ?? a?.formats?.large?.url ?? a?.formats?.medium?.url);
  });
  return urls;
}

function toStory(item: any, prefix: string, category: string, titleField = 'title') {
  const a = item?.attributes ?? item;
  const title = a?.[titleField] || a?.title || a?.name || '';
  const rawDesc = a?.description || a?.excerpt || '';
  const excerptText = typeof rawDesc === 'string' ? rawDesc.slice(0, 200) : extractText(rawDesc);
  const rawContent = a?.content || a?.body;
  let content: any[];
  if (Array.isArray(rawContent) && rawContent.length > 0) {
    content = rawContent;
  } else if (rawContent && !Array.isArray(rawContent)) {
    content = [{ type: 'paragraph', children: [{ type: 'text', text: extractText(rawContent) }] }];
  } else {
    // No real content — leave empty so the excerpt block doesn't duplicate on the detail page
    content = [];
  }
  return {
    id: `${prefix}-${item.id}`,
    attributes: {
      title,
      slug: `${prefix}-${item.documentId ?? item.id}`,
      excerpt: excerptText,
      content,
      category,
      author: a?.author || 'Liliw Tourism Office',
      featured: a?.featured ?? false,
      cover_image: { data: { attributes: { url: firstImageUrl(a), formats: {} } } },
      photos: allImageUrls(a),
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
