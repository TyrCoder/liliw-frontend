import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia, mediaToPhotos } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const [artFormItems, artisanItems] = await Promise.all([
      fetchApprovedWithMedia('cms_art_forms', 'art_form', q => q.order('sort_order', { ascending: true })),
      fetchApprovedWithMedia('cms_artisans', 'artisan'),
    ]);

    const artForms = {
      data: artFormItems.map((item: any) => ({
        ...item,
        photos: mediaToPhotos(item._media),
      })),
    };
    const artisans = {
      data: artisanItems.map((item: any) => ({
        ...item,
        photos: mediaToPhotos(item._media),
      })),
    };

    return NextResponse.json({ artForms, artisans }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ artForms: null, artisans: null });
  }
}
