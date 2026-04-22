import algoliasearch from 'algoliasearch';
import { logger } from './logger';

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ''
);

const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'liliw-items');

export interface SearchResult {
  objectID: string;
  name: string;
  description: string;
  type: 'heritage' | 'spot' | 'faq' | 'event' | 'itinerary';
  category?: string;
  location?: string;
  rating?: number;
  url?: string;
}

export async function searchAlgolia(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    const { hits } = await index.search<SearchResult>(query, {
      hitsPerPage: 10,
      attributesToHighlight: ['name', 'description'],
      attributesToSnippet: ['description:50'],
    });
    
    return hits;
  } catch (error) {
    logger.error('Algolia search error:', error);
    return [];
  }
}

export async function indexAttractions(data: any[]) {
  try {
    const objects = data.map((item) => ({
      objectID: item.id,
      name: item.attributes?.name || item.name,
      description: item.attributes?.description || item.description,
      type: item.type || 'spot',
      category: item.attributes?.category,
      location: item.attributes?.location,
      rating: item.attributes?.rating,
      url: `/attractions/${item.id}`,
    }));

    await index.saveObjects(objects);
    console.log(`✓ Indexed ${objects.length} items to Algolia`);
  } catch (error) {
    logger.error('Algolia indexing error:', error);
  }
}
