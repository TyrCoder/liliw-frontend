import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const items = await fetchApprovedWithMedia(
      'cms_attractions', 'attraction',
      q => q.eq('category', 'heritage').order('created_at', { ascending: false }),
    );

    const data = items.map((item: any) => ({
      ...item,
      title: item.name,
      images: mediaToPhotos(item._media),
    }));

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
