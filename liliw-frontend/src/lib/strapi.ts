import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

const strapiApi = axios.create({
  baseURL: `${strapiUrl}/api`,
  headers: {
    Authorization: `Bearer ${strapiToken}`,
  },
});

// Fetch all heritage sites
export const getHeritageSites = async () => {
  try {
    const response = await strapiApi.get('/heritage-sites?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching heritage sites:', error);
    return [];
  }
};

// Fetch all tourist spots
export const getTouristSpots = async () => {
  try {
    const response = await strapiApi.get('/tourist-spots?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching tourist spots:', error);
    return [];
  }
};

// Fetch all events
export const getEvents = async () => {
  try {
    const response = await strapiApi.get('/events?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Fetch all FAQs
export const getFaqs = async () => {
  try {
    const response = await strapiApi.get('/faqs?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
};

// Fetch all itineraries
export const getItineraries = async () => {
  try {
    const response = await strapiApi.get('/itineraries?populate=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return [];
  }
};

// Fetch all attractions (heritage + tourist spots combined)
export const getAllAttractions = async () => {
  const [heritage, spots] = await Promise.all([
    getHeritageSites(),
    getTouristSpots(),
  ]);

  // Transform Strapi data to match frontend expectations
  const transformAttraction = (item: any, type: string) => {
    // Extract text from rich text blocks
    const extractText = (richText: any) => {
      if (!richText) return '';
      if (Array.isArray(richText)) {
        return richText
          .map((block: any) =>
            block.children?.map((child: any) => child.text).join(' ') || ''
          )
          .join(' ');
      }
      return richText;
    };

    return {
      id: item.id,
      attributes: {
        name: item.name || 'Unnamed Attraction',
        description: extractText(item.description),
        location: item.location || '',
        category: item.category || 'uncategorized',
        rating: item.rating || 0,
        is_featured: item.is_featured || false,
        phone: item.phone || '',
        hours: item.opening_hours || '',
        website: item.website || '',
        best_for: item.best_time_to_visit || item.tips || '',
        photos: item.photos && Array.isArray(item.photos) 
          ? item.photos.map((photo: any) => ({
              id: photo.id,
              name: photo.name,
              url: photo.url,
              width: photo.width,
              height: photo.height,
              formats: photo.formats,
              mime: photo.mime,
            }))
          : [],
      },
      type,
    };
  };

  return [
    ...heritage.map((h: any) => {
      const transformed = transformAttraction(h, 'heritage');
      transformed.id = `heritage-${h.id}`; // Make ID unique
      return transformed;
    }),
    ...spots.map((s: any) => {
      const transformed = transformAttraction(s, 'spot');
      transformed.id = `spot-${s.id}`; // Make ID unique
      return transformed;
    }),
  ];
};

export default strapiApi;
