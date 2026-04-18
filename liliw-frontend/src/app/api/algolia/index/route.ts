import { NextResponse } from 'next/server';
import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_ADMIN_KEY || ''
);

const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'liliw-items');

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

async function fetchFromStrapi(endpoint: string) {
  try {
    const response = await fetch(`${STRAPI_URL}/api${endpoint}?populate=*`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { data: [] };
  }
}

export async function POST() {
  try {
    const objects: any[] = [];

    // Fetch and index heritage sites
    const heritageSites = await fetchFromStrapi('/heritage-sites');
    heritageSites.data?.forEach((item: any) => {
      objects.push({
        objectID: `heritage-${item.id}`,
        name: item.attributes?.name || 'Unknown Heritage Site',
        description: item.attributes?.description || '',
        type: 'heritage',
        category: item.attributes?.category,
        location: item.attributes?.location,
        rating: item.attributes?.rating,
        url: `/attractions/heritage-${item.id}`,
      });
    });

    // Fetch and index tourist spots
    const touristSpots = await fetchFromStrapi('/tourist-spots');
    touristSpots.data?.forEach((item: any) => {
      objects.push({
        objectID: `spot-${item.id}`,
        name: item.attributes?.name || 'Unknown Tourist Spot',
        description: item.attributes?.description || '',
        type: 'spot',
        category: item.attributes?.category,
        location: item.attributes?.location,
        rating: item.attributes?.rating,
        url: `/attractions/spot-${item.id}`,
      });
    });

    // Fetch and index FAQs
    const faqs = await fetchFromStrapi('/faqs');
    faqs.data?.forEach((item: any) => {
      objects.push({
        objectID: `faq-${item.id}`,
        name: item.attributes?.question || 'FAQ',
        description: item.attributes?.answer || '',
        type: 'faq',
        category: item.attributes?.category,
        url: `/faq#faq-${item.id}`,
      });
    });

    // Fetch and index events
    const events = await fetchFromStrapi('/events');
    events.data?.forEach((item: any) => {
      objects.push({
        objectID: `event-${item.id}`,
        name: item.attributes?.title || 'Unknown Event',
        description: item.attributes?.description || '',
        type: 'event',
        category: item.attributes?.category,
        url: `/news`,
      });
    });

    // Fetch and index itineraries
    const itineraries = await fetchFromStrapi('/itineraries');
    itineraries.data?.forEach((item: any) => {
      objects.push({
        objectID: `itinerary-${item.id}`,
        name: item.attributes?.name || 'Unknown Itinerary',
        description: item.attributes?.description || '',
        type: 'itinerary',
        url: `/itineraries`,
      });
    });

    if (objects.length === 0) {
      return NextResponse.json(
        { error: 'No data found to index', count: 0 },
        { status: 400 }
      );
    }

    // Index to Algolia
    await index.saveObjects(objects);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully indexed ${objects.length} items to Algolia`,
        count: objects.length,
        breakdown: {
          heritage: objects.filter((o) => o.type === 'heritage').length,
          spots: objects.filter((o) => o.type === 'spot').length,
          faqs: objects.filter((o) => o.type === 'faq').length,
          events: objects.filter((o) => o.type === 'event').length,
          itineraries: objects.filter((o) => o.type === 'itinerary').length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Algolia indexing error:', error);
    return NextResponse.json(
      { error: 'Failed to index to Algolia', details: String(error) },
      { status: 500 }
    );
  }
}
