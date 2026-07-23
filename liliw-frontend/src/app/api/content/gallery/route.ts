import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const CONTENT_TYPE_CATEGORY: Record<string, string> = {
  attraction:  'heritage',
  art_form:    'culture',
  artisan:     'community',
  story:       'culture',
  event:       'events',
  news:        'community',
  hero_slide:  'heritage',
};

const CONTENT_TYPE_TABLE: Record<string, string> = {
  attraction:  'cms_attractions',
  art_form:    'cms_art_forms',
  artisan:     'cms_artisans',
  story:       'cms_stories',
  event:       'cms_events',
  news:        'cms_news',
  hero_slide:  'cms_hero_slides',
};

export async function GET() {
  try {
    // Pull all media whose parent content is approved
    const { data: media } = await supabaseServer
      .from('cms_media')
      .select('*')
      .order('sort_order', { ascending: true });

    const approvedIds: Record<string, Set<string>> = {};
    await Promise.all(
      Object.entries(CONTENT_TYPE_TABLE).map(async ([contentType, table]) => {
        const { data } = await supabaseServer.from(table).select('id').eq('status', 'approved');
        approvedIds[contentType] = new Set((data ?? []).map((r: any) => String(r.id)));
      }),
    );

    const approvedMedia = (media ?? []).filter((m: any) =>
      approvedIds[m.content_type]?.has(String(m.content_id)),
    );

    const data = approvedMedia.map((m: any, i: number) => ({
      id: `${m.content_type}-${m.content_id}-${i}`,
      attributes: {
        title: m.alt_text ?? '',
        description: '',
        category: CONTENT_TYPE_CATEGORY[m.content_type] ?? 'heritage',
        image: {
          data: {
            attributes: { url: m.url, formats: {} },
          },
        },
      },
    }));

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
