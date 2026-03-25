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

  return [
    ...heritage.map((h: any) => ({ ...h, type: 'heritage' })),
    ...spots.map((s: any) => ({ ...s, type: 'spot' })),
  ];
};

export default strapiApi;
