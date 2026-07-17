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

export async function GET() {
  try {
    // Pull all media whose parent content is approved
    const { data: media } = await supabaseServer
      .from('cms_media')
      .select('*')
      .order('sort_order', { ascending: true });

    const data = (media ?? []).map((m: any, i: number) => ({
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
