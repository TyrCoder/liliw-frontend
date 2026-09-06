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
  type: 'heritage' | 'spot' | 'dining' | 'faq' | 'event' | 'news' | 'itinerary';
  category?: string;
  location?: string;
  rating?: number;
  url?: string;
}

/** Algolia is optional; without an app id its client fails on every query. */
const ALGOLIA_CONFIGURED = !!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  && !!process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

/** The database search, which needs no keys and no index to rebuild. */
async function searchDatabase(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d.hits) ? d.hits : [];
  } catch (error) {
    logger.error('Search error:', error);
    return [];
  }
}

/**
 * Search, from Algolia where it is set up and from the database otherwise.
 *
 * Algolia was never configured in production, so every query went to a client
 * built with an empty app id, threw, and came back as an empty result — a
 * search box that answered "nothing found" for everything, indistinguishable
 * from a genuine miss. The fallback is not a degraded mode; it reads the same
 * content and needs nothing kept in step.
 */
export async function searchAlgolia(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  if (!ALGOLIA_CONFIGURED) return searchDatabase(query);

  try {
    const { hits } = await index.search<SearchResult>(query, {
      hitsPerPage: 10,
      attributesToHighlight: ['name', 'description'],
      attributesToSnippet: ['description:50'],
      typoTolerance: true,
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 7,
      ignorePlurals: true,
      removeStopWords: true,
    });
    
    return hits;
  } catch (error) {
    // A configured Algolia that fails is still a search box someone is using.
    logger.error('Algolia search error:', error);
    return searchDatabase(query);
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
  } catch (error) {
    logger.error('Algolia indexing error:', error);
  }
}
