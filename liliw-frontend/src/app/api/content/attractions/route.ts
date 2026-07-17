import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';

const CAT_MAP: Record<string, 'heritage' | 'spot' | 'dining'> = {
  heritage:     'heritage',
  tourist_spot: 'spot',
  dining:       'dining',
  other:        'spot',
};

export async function GET() {
  try {
    const items = await fetchApprovedWithMedia(
      'cms_attractions', 'attraction',
      q => q.order('sort_order', { ascending: true }),
    );

    const data = items.map((item: any) => {
      const type = CAT_MAP[item.category] ?? 'spot';
      const photos = mediaToPhotos(item._media);
      const vtPhotos: any[] = Array.isArray(item.virtual_tour_photos) ? item.virtual_tour_photos : [];
      const hotspots: any[] = Array.isArray(item.hotspots) ? item.hotspots : [];
      return {
        id: `${type}-${item.id}`,
        strapiId: item.id,
        attributes: {
          name: item.name,
          description: item.description ?? '',
          location: item.location ?? '',
          category: item.category,
          rating: 0,
          google_place_id: undefined,
          coordinates: (item.map_lat != null && item.map_lng != null)
            ? { latitude: Number(item.map_lat), longitude: Number(item.map_lng) }
            : undefined,
          has_virtual_tour: vtPhotos.length > 0,
          hotspots,
          virtual_tour_photos: vtPhotos,
          photos,
        },
        type,
      };
    });

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
