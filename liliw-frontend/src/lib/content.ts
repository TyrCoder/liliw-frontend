import { supabaseServer } from './supabase-server';
import { fetchApprovedWithMedia, mediaToPhotos } from './supabase-cms';

const CAT_MAP: Record<string, 'heritage' | 'spot' | 'dining'> = {
  heritage:     'heritage',
  tourist_spot: 'spot',
  dining:       'dining',
  other:        'spot',
};

const cache = new Map<string, { data: any; at: number }>();
const TTL = 5 * 60 * 1000;

function getCached(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  return null;
}
function setCached(key: string, data: any) { cache.set(key, { data, at: Date.now() }); }

// Call after any CMS write (create/update/delete/approve/reject) so the AI
// chat and trip planner (the only consumers of this cache) don't keep
// serving stale content for up to TTL.
export function invalidateContentCache() { cache.clear(); }

export const getAllAttractions = async () => {
  const cached = getCached('all-attractions');
  if (cached) return cached;
  try {
    const items = await fetchApprovedWithMedia('cms_attractions', 'attraction',
      (q: any) => q.order('sort_order', { ascending: true }),
    );
    const data = items.map((item: any) => {
      const type = CAT_MAP[item.category] ?? 'spot';
      const photos = mediaToPhotos(item._media);
      const vtPhotos: any[] = Array.isArray(item.virtual_tour_photos) ? item.virtual_tour_photos : [];
      return {
        id: `${type}-${item.id}`,
        strapiId: item.id,
        attributes: {
          name:               item.name,
          description:        item.description ?? '',
          location:           item.location ?? '',
          category:           item.category,
          rating:             item.rating ?? 0,
          coordinates:        (item.map_lat != null && item.map_lng != null)
                                ? { latitude: Number(item.map_lat), longitude: Number(item.map_lng) }
                                : undefined,
          has_virtual_tour:   vtPhotos.length > 0,
          hotspots:           item.hotspots ?? [],
          virtual_tour_photos: vtPhotos,
          photos,
        },
        type,
      };
    });
    setCached('all-attractions', data);
    return data;
  } catch { return []; }
};

export const getHeritageSites = async () => {
  const cached = getCached('heritage');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_attractions').select('*').eq('status', 'approved').eq('category', 'heritage');
    setCached('heritage', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getTouristSpots = async () => {
  const cached = getCached('spots');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_attractions').select('*').eq('status', 'approved').eq('category', 'tourist_spot');
    setCached('spots', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getDiningPlaces = async () => {
  const cached = getCached('dining');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_attractions').select('*').eq('status', 'approved').eq('category', 'dining');
    setCached('dining', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getEvents = async () => {
  const cached = getCached('events');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_events').select('*').eq('status', 'approved').order('date_start', { ascending: true });
    setCached('events', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getFaqs = async () => {
  const cached = getCached('faqs');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_faqs').select('*').eq('status', 'approved').order('sort_order', { ascending: true });
    setCached('faqs', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getItineraries = async () => {
  const cached = getCached('itineraries');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_itineraries').select('*').eq('status', 'approved');
    setCached('itineraries', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getNews = async () => {
  const cached = getCached('news');
  if (cached) return cached;
  try {
    const { data } = await supabaseServer.from('cms_news').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    setCached('news', data ?? []);
    return data ?? [];
  } catch { return []; }
};

export const getArtForms      = async () => [];
export const getCultureAspects = async () => [];
export const getHeroSlides     = async () => [];
export const getCultureHeritages = async () => [];

export default null;
