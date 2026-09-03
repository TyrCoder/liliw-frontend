import { supabaseServer } from './supabase-server';
import { fetchApprovedWithMedia, mediaToPhotos } from './supabase-cms';

/**
 * Public attraction ids are '<type>-<uuid>' (built below in getAllAttractions),
 * while cms_attractions and cms_media are keyed on the bare uuid. Lives next to
 * the code that composes the id so the two can't drift apart.
 */
export const cmsAttractionId = (publicId: string) =>
  publicId.replace(/^(heritage|spot|dining)-/, '');

/**
 * The other direction: a cms_attractions row to the id its public page uses.
 *
 * Anything building a link to an attraction from raw database rows — rather
 * than from getAllAttractions, which composes the id already — needs this. The
 * search index built its URLs from the bare uuid and every result led to
 * "attraction not found", because the page looks up '<type>-<uuid>'.
 */
export const publicAttractionId = (category: string, uuid: string) =>
  `${CAT_MAP[category] ?? 'spot'}-${uuid}`;

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

// Average visitor rating per attraction, keyed by the composite id reviews are
// filed under ('<type>-<uuid>'). cms_attractions has a `rating` column, but
// nothing ever writes to it — it isn't editable in the CMS and isn't derived
// from anything — so every attraction reported 0 and the stars on the Tourism
// listing never rendered. Deriving it from the reviews table makes the listing
// agree with the average already shown on the detail page.
async function getRatingsByItemId(): Promise<Record<string, number>> {
  const { data, error } = await supabaseServer.from('reviews').select('item_id, rating');
  if (error || !data) return {};
  const sums: Record<string, { total: number; n: number }> = {};
  for (const r of data) {
    if (!r.item_id || typeof r.rating !== 'number') continue;
    const acc = sums[r.item_id] ?? (sums[r.item_id] = { total: 0, n: 0 });
    acc.total += r.rating; acc.n += 1;
  }
  return Object.fromEntries(
    Object.entries(sums).map(([id, { total, n }]) => [id, total / n]),
  );
}

export const getAllAttractions = async () => {
  const cached = getCached('all-attractions');
  if (cached) return cached;
  try {
    const [items, ratings] = await Promise.all([
      fetchApprovedWithMedia('cms_attractions', 'attraction',
        (q: any) => q.order('sort_order', { ascending: true }),
      ),
      getRatingsByItemId(),
    ]);
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
          // Visitor-practical notes an editor writes in the CMS: best time to
          // visit, entrance fee, opening hours, what to bring. 38 of 40
          // attractions have this filled in, and none of it reached the site
          // because it was never mapped here.
          features:           item.features ?? '',
          location:           item.location ?? '',
          // Visitor info. `hours` keeps the name the attraction page's info
          // grid already expects, so filling opening_hours in the CMS is all
          // that's needed to light that card up.
          hours:              item.opening_hours ?? '',
          best_time:          item.best_time ?? '',
          visitor_tips:       item.visitor_tips ?? '',
          entrance_fee:       item.entrance_fee ?? '',
          price_level:        item.price_level ?? '',
          phone:              item.phone ?? '',
          website:            item.website ?? '',
          best_for:           item.best_for ?? '',
          category:           item.category,
          // Visitor-review average, falling back to the stored column if a
          // rating was ever seeded there directly.
          rating:             ratings[`${type}-${item.id}`] ?? item.rating ?? 0,
          coordinates:        (item.map_lat != null && item.map_lng != null)
                                ? { latitude: Number(item.map_lat), longitude: Number(item.map_lng) }
                                : undefined,
          has_virtual_tour:   vtPhotos.length > 0,
          hotspots:           Array.isArray(item.hotspots) ? item.hotspots : [],
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
export const getCultureHeritages = async () => [];

export default null;
