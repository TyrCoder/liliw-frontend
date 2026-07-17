import { NextRequest, NextResponse } from 'next/server';
import { fetchApproved } from '@/lib/supabase-cms';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(new URL(request.url).searchParams.get('limit') || '20');

    const [newsItems, eventItems] = await Promise.all([
      fetchApproved('cms_news', q => q.order('created_at', { ascending: false }).limit(limit)),
      fetchApproved('cms_events', q => q.order('date_start', { ascending: false }).limit(limit)),
    ]);

    return NextResponse.json(
      { news: { data: newsItems }, events: { data: eventItems } },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
    );
  } catch {
    return NextResponse.json({ news: null, events: null });
  }
}
