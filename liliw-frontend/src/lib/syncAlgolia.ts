import algoliasearch from 'algoliasearch';
import {
  getHeritageSites,
  getTouristSpots,
  getDiningPlaces,
  getEvents,
  getFaqs,
  getNews,
} from '@/lib/strapi';

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((block: any) =>
        (block?.children ?? []).map((c: any) => c?.text ?? '').join(' ')
      )
      .join(' ');
  }
  return '';
}

function attrs(item: any): any {
  return item?.attributes ?? item;
}

export async function syncAlgolia(): Promise<number> {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'liliw-items';

  if (!appId || !adminKey) {
    throw new Error('Algolia admin credentials not configured');
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(indexName);

  const [heritage, spots, dining, events, faqs, news] = await Promise.all([
    getHeritageSites(),
    getTouristSpots(),
    getDiningPlaces(),
    getEvents(),
    getFaqs(),
    getNews(),
  ]);

  const objects = [
    ...heritage.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `heritage-${item.id}`,
        name: a.name ?? '',
        description: extractText(a.description),
        type: 'heritage',
        category: a.category ?? '',
        location: a.location ?? '',
        rating: a.rating ?? null,
        url: `/attractions/heritage-${item.id}`,
      };
    }),
    ...spots.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `spot-${item.id}`,
        name: a.name ?? '',
        description: extractText(a.description),
        type: 'spot',
        category: a.category ?? '',
        location: a.location ?? '',
        rating: a.rating ?? null,
        url: `/attractions/spot-${item.id}`,
      };
    }),
    ...dining.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `dining-${item.id}`,
        name: a.name ?? '',
        description: extractText(a.description),
        type: 'dining',
        category: a.cuisine_type ?? '',
        location: a.location ?? '',
        rating: a.rating ?? null,
        url: `/attractions/dining-${item.id}`,
      };
    }),
    ...events.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `event-${item.id}`,
        name: a.title ?? '',
        description: extractText(a.description),
        type: 'event',
        category: a.category ?? '',
        location: a.venue ?? '',
        url: `/news`,
      };
    }),
    ...faqs.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `faq-${item.id}`,
        name: a.question ?? '',
        description: extractText(a.answer),
        type: 'faq',
        category: a.category ?? '',
        url: `/faq`,
      };
    }),
    ...news.map((item: any) => {
      const a = attrs(item);
      return {
        objectID: `news-${item.id}`,
        name: a.title ?? '',
        description: extractText(a.content),
        type: 'news',
        category: a.category ?? '',
        url: `/news`,
      };
    }),
  ];

  await index.saveObjects(objects);
  return objects.length;
}
