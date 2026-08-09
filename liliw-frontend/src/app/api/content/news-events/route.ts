import { NextRequest, NextResponse } from 'next/server';
import { fetchApprovedWithMedia } from '@/lib/supabase-cms';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(new URL(request.url).searchParams.get('limit') || '20');

    // Photos live in cms_media, not on the row, so fetching the row alone
    // returned articles with no pictures — an upload that saved correctly and
    // then simply never appeared on the published page.
    const [newsItems, eventItems] = await Promise.all([
      fetchApprovedWithMedia('cms_news', 'news',
        q => q.order('created_at', { ascending: false }).limit(limit)),
      fetchApprovedWithMedia('cms_events', 'event',
        q => q.order('date_start', { ascending: false }).limit(limit)),
    ]);

    return NextResponse.json(
      { news: { data: newsItems }, events: { data: eventItems } },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
    );
  } catch {
    return NextResponse.json({ news: null, events: null });
  }
}
