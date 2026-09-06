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

/**
 * Whether Algolia gets asked first. Off unless someone deliberately turns it
 * on, because being configured is not the same as being correct — see
 * searchAlgolia below.
 */
const ALGOLIA_PRIMARY = process.env.NEXT_PUBLIC_ALGOLIA_PRIMARY === 'true';

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
 * Search. The database answers it.
 *
 * Algolia is configured in production and was being asked every query, which
 * is why searching for a specific attraction returned nothing: the index is a
 * stale snapshot. It holds 36 records of heritage and FAQ content and none of
 * the attractions people actually search for — "Kilangin" and "Bubble Chix"
 * both return zero, and "Casita" returns "The Slipper Capital of the
 * Philippines", which is not what was asked for.
 *
 * It is stale because it is filled by hand: /api/algolia/index rebuilds it,
 * an admin has to press the button, and nothing re-runs it when content
 * changes. A search box that is only correct until the next CMS edit is not a
 * search box, so it is no longer what answers.
 *
 * The database search reads the approved content directly — no keys, no index,
 * nothing to keep in step, and correct the moment something is published. It
 * finds every one of the names above.
 *
 * Algolia is not deleted, and the sync route still works. Setting
 * NEXT_PUBLIC_ALGOLIA_PRIMARY=true puts it back in front, and even then a
 * query it cannot answer falls through to the database rather than reporting
 * an empty site.
 */
export async function searchAlgolia(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  if (!ALGOLIA_PRIMARY || !ALGOLIA_CONFIGURED) return searchDatabase(query);

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

    // An empty answer from a stale index is indistinguishable from a genuine
    // miss, and the database can tell the difference.
    if (!hits.length) return searchDatabase(query);
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
