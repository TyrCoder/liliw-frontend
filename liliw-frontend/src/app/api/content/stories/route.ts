import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const items = await fetchApprovedWithMedia(
      'cms_stories', 'story',
      q => q.order('created_at', { ascending: false }),
    );

    const data = items.map((item: any) => {
      const photos = mediaToPhotos(item._media);
      const coverUrl = photos[0]?.url ?? '';
      return {
        ...item,
        _coverUrl: coverUrl,
        _allImages: photos.map((p: any) => p.url),
      };
    });

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
