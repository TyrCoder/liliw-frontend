import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

type Device = 'desktop' | 'mobile' | 'tablet';

interface Session {
  pageViews: number;
  startTime: number;
  device: Device;
}

const sessionStore = new Map<string, Session>();
const deviceCounts: Record<Device, number> = { desktop: 0, mobile: 0, tablet: 0 };

function cleanOldSessions() {
  if (sessionStore.size < 5000) return;
  const cutoff = Date.now() - 7_200_000; // 2 hours
  sessionStore.forEach((v, k) => { if (v.startTime < cutoff) sessionStore.delete(k); });
}

export async function POST(request: NextRequest) {
  try {
    const { path, sessionId, device = 'desktop' } = await request.json();
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    if (sessionId) {
      const existing = sessionStore.get(sessionId);
      if (existing) {
        existing.pageViews++;
      } else {
        const d: Device = ['desktop', 'mobile', 'tablet'].includes(device) ? device : 'desktop';
        sessionStore.set(sessionId, { pageViews: 1, startTime: Date.now(), device: d });
        deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        cleanOldSessions();
      }
    }

    // Persist page view to Strapi (fire-and-forget)
    fetch(`${STRAPI}/api/page-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ data: { path } }),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `${STRAPI}/api/page-views?pagination[limit]=500&sort=createdAt:desc`,
      { headers: { Authorization: `Bearer ${TOKEN}` }, next: { revalidate: 0 } },
    );

    let topPages: { path: string; views: number }[] = [];
    let totalViews = 0;

    if (res.ok) {
      const data = await res.json();
      const entries: any[] = data.data || [];
      totalViews = data.meta?.pagination?.total || entries.length;

      const map: Record<string, number> = {};
      entries.forEach((e: any) => {
        const p = e.attributes?.path || e.path || '/';
        map[p] = (map[p] || 0) + 1;
      });
      topPages = Object.entries(map)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views);
    }

    const sessions = Array.from(sessionStore.values());
    const uniqueVisitors = sessions.length;
    const bounceCount = sessions.filter(s => s.pageViews <= 1).length;
    const bounceRate = uniqueVisitors > 0 ? `${Math.round((bounceCount / uniqueVisitors) * 100)}%` : '—';

    const total = deviceCounts.desktop + deviceCounts.mobile + deviceCounts.tablet || 1;
    const devices = {
      desktop: { count: deviceCounts.desktop, pct: Math.round((deviceCounts.desktop / total) * 100) },
      mobile:  { count: deviceCounts.mobile,  pct: Math.round((deviceCounts.mobile  / total) * 100) },
      tablet:  { count: deviceCounts.tablet,  pct: Math.round((deviceCounts.tablet  / total) * 100) },
    };

    return NextResponse.json({ pageViews: totalViews, uniqueVisitors, bounceRate, avgSessionTime: '—', topPages, devices });
  } catch {
    return NextResponse.json({ pageViews: 0, uniqueVisitors: 0, bounceRate: '—', avgSessionTime: '—', topPages: [], devices: { desktop: { count: 0, pct: 0 }, mobile: { count: 0, pct: 0 }, tablet: { count: 0, pct: 0 } } });
  }
}
