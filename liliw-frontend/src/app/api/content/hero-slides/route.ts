import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia } from '@/lib/supabase-cms';

export async function GET() {
  try {
    const items = await fetchApprovedWithMedia(
      'cms_hero_slides', 'hero_slide',
      q => q.order('sort_order', { ascending: true }),
    );

    const data = items.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      button_text: item.button_text,
      button_link: item.button_link,
      sort_order: item.sort_order,
      image: { url: item._media[0]?.url ?? null },
    }));

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
