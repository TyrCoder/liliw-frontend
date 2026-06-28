import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export type PublicNotifItem = {
  id: string;
  type: 'event' | 'news';
  title: string;
  subtitle: string;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  if (!await requireAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [eventsRes, newsRes] = await Promise.allSettled([
    supabaseServer.from('cms_events').select('id, title, date_start, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
    supabaseServer.from('cms_news').select('id, title, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(8),
  ]);

  const items: PublicNotifItem[] = [];

  if (eventsRes.status === 'fulfilled' && !eventsRes.value.error) {
    for (const e of eventsRes.value.data ?? []) {
      items.push({
        id: `event-${e.id}`,
        type: 'event',
        title: e.title || 'New Event',
        subtitle: e.date_start ? `Happening ${new Date(e.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Upcoming event in Liliw',
        createdAt: e.created_at || new Date().toISOString(),
      });
    }
  }

  if (newsRes.status === 'fulfilled' && !newsRes.value.error) {
    for (const e of newsRes.value.data ?? []) {
      items.push({
        id: `news-${e.id}`,
        type: 'news',
        title: e.title || 'News Update',
        subtitle: 'Liliw Tourism News',
        createdAt: e.created_at || new Date().toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ success: true, data: items.slice(0, 15) });
}
