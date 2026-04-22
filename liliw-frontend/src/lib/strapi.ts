import axios from 'axios';
import { logger } from './logger';
import type {
  StrapiResponse,
  HeritageSite,
  TouristSpot,
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

const strapiApi = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    Authorization: `Bearer ${strapiToken}`,
  },
});

// Fetch all heritage sites
export const getHeritageSites = async (): Promise<HeritageSite[]> => {
  try {
    const response = await strapiApi.get<StrapiResponse<HeritageSite[]>>('/heritage-sites?populate=*');
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching heritage sites:', error);
    return [];
  }
};

// Fetch all tourist spots
export const getTouristSpots = async (): Promise<TouristSpot[]> => {
  try {
    const response = await strapiApi.get<StrapiResponse<TouristSpot[]>>('/tourist-spots?populate=*');
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching tourist spots:', error);
    return [];
  }
};

// Fetch all events
export const getEvents = async (): Promise<Event[]> => {
  try {
    const response = await strapiApi.get<StrapiResponse<Event[]>>('/events?populate=*');
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching events:', error);
    return [];
  }
};

// Fetch all FAQs
export const getFaqs = async (): Promise<FAQ[]> => {
  try {
    const response = await strapiApi.get<StrapiResponse<FAQ[]>>('/faqs?populate=*');
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    return [];
  }
};

// Fetch all itineraries
export const getItineraries = async (): Promise<Itinerary[]> => {
  try {
    const response = await strapiApi.get<StrapiResponse<Itinerary[]>>('/itineraries?populate=*');
    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching itineraries:', error);
    return [];
  }
};

// Fetch all attractions (heritage + tourist spots combined)
export const getAllAttractions = async () => {
  const [heritage, spots] = await Promise.all([
    getHeritageSites(),
    getTouristSpots(),
  ]);

  // Extract text from rich text blocks
  const extractText = (richText: StrapiBlocksContent | string | null | undefined): string => {
    if (!richText) return '';
    if (typeof richText === 'string') return richText;
    if (Array.isArray(richText)) {
      return richText
        .map((block: any) =>
          block.children?.map((child: any) => child.text).join(' ') || ''
        )
        .join(' ');
    }
    return '';
  };

  // Transform Strapi data to match frontend expectations
  const transformAttraction = (item: HeritageSite | TouristSpot, type: 'heritage' | 'spot') => {
    const attrs = item.attributes;
    const photos = (attrs.images || []) as StrapiImageAttribute[];

    return {
      id: type === 'heritage' ? `heritage-${item.id}` : `spot-${item.id}`,
      attributes: {
        name: attrs.name || 'Unnamed Attraction',
        description: extractText(attrs.description as StrapiBlocksContent | string),
        location: 'location' in attrs ? attrs.location : '',
        category: 'category' in attrs ? (attrs.category as any) || 'uncategorized' : 'heritage',
        rating: attrs.rating || 0,
        photos: photos.map((photo) => ({
          id: photo.id,
          name: photo.name,
          url: photo.url,
          width: photo.width,
          height: photo.height,
          formats: photo.formats,
          mime: photo.mime,
        })),
      },
      type,
    };
  };

  return [
    ...heritage.map((h) => transformAttraction(h, 'heritage')),
    ...spots.map((s) => transformAttraction(s, 'spot')),
  ];
};

export default strapiApi;
