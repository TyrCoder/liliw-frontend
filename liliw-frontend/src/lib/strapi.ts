import axios from 'axios';
import { logger } from './logger';
import type {
  StrapiResponse,
  HeritageSite,
  TouristSpot,
  DiningPlace,
  Event,
  FAQ,
  Itinerary,
  StrapiBlocksContent,
  StrapiImageAttribute,
} from './types';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

// Validate required environment variables
if (!strapiUrl) {
  throw new Error('NEXT_PUBLIC_STRAPI_URL environment variable is not set');
}

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedResponse = (key: string) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.info(`Cache HIT: ${key}`);
    return cached.data;
  }
  apiCache.delete(key);
  return null;
};

const setCachedResponse = (key: string, data: any) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

const strapiApi = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    Authorization: `Bearer ${strapiToken}`,
  },
  timeout: 60000, // Render cold starts can take >10s on free tier
});

const fetchWithRetry = async <T>(path: string): Promise<T> => {
  try {
    const response = await strapiApi.get<T>(path);
    return response.data;
  } catch (error: any) {
    const isTimeout = error?.code === 'ECONNABORTED';
    if (!isTimeout) throw error;

    // Retry once after a timeout to tolerate backend cold-start wakeups.
    const retryResponse = await strapiApi.get<T>(path);
    return retryResponse.data;
  }
};

// Fetch all heritage sites
export const getHeritageSites = async (): Promise<HeritageSite[]> => {
  const cacheKey = 'heritage-sites';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry<StrapiResponse<HeritageSite[]>>('/heritage-sites?populate=*');
    const data = response.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching heritage sites:', error);
    return [];
  }
};

// Fetch all tourist spots
export const getTouristSpots = async (): Promise<TouristSpot[]> => {
  const cacheKey = 'tourist-spots';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry<StrapiResponse<TouristSpot[]>>('/tourist-spots?populate=*');
    const data = response.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching tourist spots:', error);
    return [];
  }
};

// Fetch all dining and food places
export const getDiningPlaces = async (): Promise<DiningPlace[]> => {
  const cacheKey = 'dining-places';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithRetry<StrapiResponse<DiningPlace[]>>('/dining-and-foods?populate=*');
    const data = response.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching dining places:', error);
    return [];
  }
};

// Fetch all events
export const getEvents = async (): Promise<Event[]> => {
  const cacheKey = 'events';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await strapiApi.get<StrapiResponse<Event[]>>('/events?populate=*');
    const data = response.data.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching events:', error);
    return [];
  }
};

// Fetch all FAQs
export const getFaqs = async (): Promise<FAQ[]> => {
  const cacheKey = 'faqs';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await strapiApi.get<StrapiResponse<FAQ[]>>('/faqs?populate=*');
    const data = response.data.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    return [];
  }
};

// Fetch all itineraries
export const getItineraries = async (): Promise<Itinerary[]> => {
  const cacheKey = 'itineraries';
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const response = await strapiApi.get<StrapiResponse<Itinerary[]>>('/itineraries?populate=*');
    const data = response.data.data || [];
    setCachedResponse(cacheKey, data);
    return data;
  } catch (error) {
    logger.error('Error fetching itineraries:', error);
    return [];
  }
};

// Fetch all attractions (heritage + tourist spots combined)
export const getAllAttractions = async () => {
  const [heritage, spots, dining] = await Promise.all([
    getHeritageSites(),
    getTouristSpots(),
    getDiningPlaces(),
  ]);

  // Extract text from rich text blocks
  const extractText = (richText: StrapiBlocksContent | string | null | undefined): string => {
    try {
      if (!richText) return '';
      if (typeof richText === 'string') return richText;
      if (Array.isArray(richText)) {
        return richText
          .filter(Boolean)
          .map((block: any) => {
            if (!block) return '';
            if (!block.children || !Array.isArray(block.children)) return '';
            return block.children
              .filter((child: any) => child)
              .map((child: any) => child?.text || '')
              .join(' ');
          })
          .filter(Boolean)
          .join(' ');
      }
      return '';
    } catch (error) {
      logger.error('Error extracting text:', error);
      return '';
    }
  };

  // Transform Strapi data to match frontend expectations
  const transformAttraction = (item: HeritageSite | TouristSpot | DiningPlace | null, type: 'heritage' | 'spot' | 'dining') => {
    try {
      if (!item || typeof item !== 'object') {
        return null;
      }

      // Support both Strapi nested payloads (item.attributes)
      // and flattened payloads (fields directly on item).
      const attrs = (item as any).attributes || item;
      if (!attrs || typeof attrs !== 'object') {
        return null;
      }

      let images: any[] = [];
      try {
        const rawImages = attrs.photos ?? attrs.images;
        if (Array.isArray(rawImages)) {
          images = rawImages;
        } else if (rawImages && typeof rawImages === 'object') {
          images = Object.values(rawImages);
        }
      } catch (e) {
        logger.debug('Could not parse images:', e);
      }

      const photos = Array.isArray(images) ? images : [];

      return {
        id: type === 'heritage' ? `heritage-${item.id}` : type === 'spot' ? `spot-${item.id}` : `dining-${item.id}`,
        attributes: {
          name: attrs.name || 'Unnamed Attraction',
          description: extractText(attrs.description),
          location: 'location' in attrs ? (attrs.location || '') : '',
          category: 'category' in attrs ? (attrs.category || 'uncategorized') : 'heritage',
          rating: attrs.rating || 0,
          google_place_id: attrs.google_place_id || undefined,
          coordinates: attrs.coordinates || undefined,
          has_virtual_tour: attrs.has_virtual_tour || false,
          photos: (photos || []).map((photo: any) => {
            if (!photo || typeof photo !== 'object') return null;
            return {
              id: photo?.id,
              name: photo?.name,
              url: photo?.url,
              width: photo?.width,
              height: photo?.height,
              formats: photo?.formats,
              mime: photo?.mime,
            };
          }).filter(Boolean),
        },
        type,
      };
    } catch (error) {
      logger.error(`Error transforming ${type} attraction:`, error);
      return null;
    }
  };

  const attractions = [
    ...heritage
      .map((h) => transformAttraction(h, 'heritage'))
      .filter((a) => a !== null) as any[],
    ...spots
      .map((s) => transformAttraction(s, 'spot'))
      .filter((a) => a !== null) as any[],
    ...dining
      .map((d) => transformAttraction(d, 'dining'))
      .filter((a) => a !== null) as any[],
  ];

  return attractions;
};

export default strapiApi;
