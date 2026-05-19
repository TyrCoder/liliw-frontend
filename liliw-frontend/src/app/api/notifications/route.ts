import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

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

  const headers = { Authorization: `Bearer ${TOKEN}` };

  const [eventsRes, newsRes] = await Promise.allSettled([
    fetch(`${STRAPI}/api/events?sort=createdAt:desc&pagination[limit]=8&fields[0]=title&fields[1]=createdAt&fields[2]=date`, { headers }),
    fetch(`${STRAPI}/api/news?sort=createdAt:desc&pagination[limit]=8&fields[0]=title&fields[1]=createdAt`, { headers }),
  ]);

  const items: PublicNotifItem[] = [];

  if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
    const d = await eventsRes.value.json();
    const entries: any[] = d.data || [];
    for (const e of entries) {
      const attrs = e.attributes || e;
      items.push({
        id: `event-${e.id || e.documentId}`,
        type: 'event',
        title: attrs.title || 'New Event',
        subtitle: attrs.date ? `Happening ${new Date(attrs.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Upcoming event in Liliw',
        createdAt: attrs.createdAt || new Date().toISOString(),
      });
    }
  }

  if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
    const d = await newsRes.value.json();
    const entries: any[] = d.data || [];
    for (const e of entries) {
      const attrs = e.attributes || e;
      items.push({
        id: `news-${e.id || e.documentId}`,
        type: 'news',
        title: attrs.title || 'News Update',
        subtitle: 'Liliw Tourism News',
        createdAt: attrs.createdAt || new Date().toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ success: true, data: items.slice(0, 15) });
}
