import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

// In-memory fallback for session stats (resets on deploy)
const sessionStore = new Map<string, { pageViews: number; startTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, sessionId } = body;

    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    // Track session in memory
    if (sessionId) {
      const s = sessionStore.get(sessionId) || { pageViews: 0, startTime: Date.now() };
      s.pageViews++;
      sessionStore.set(sessionId, s);
      // Clean old sessions (>2 hours)
      if (sessionStore.size > 5000) {
        const cutoff = Date.now() - 7200000;
        sessionStore.forEach((v, k) => { if (v.startTime < cutoff) sessionStore.delete(k); });
      }
    }

    // Persist to Strapi
    await fetch(`${STRAPI}/api/page-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ data: { path } }),
    }).catch(() => {}); // fire-and-forget; don't fail the request if Strapi is down

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

export async function GET() {
  try {
    // Fetch page views from Strapi (last 500)
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

    const uniqueSessions = sessionStore.size;
    const bounceCount = Array.from(sessionStore.values()).filter(s => s.pageViews <= 1).length;
    const bounceRate = uniqueSessions > 0 ? `${Math.round((bounceCount / uniqueSessions) * 100)}%` : '—';

    return NextResponse.json({
      pageViews: totalViews,
      uniqueVisitors: uniqueSessions,
      bounceRate,
      avgSessionTime: '—',
      topPages,
    });
  } catch {
    return NextResponse.json({
      pageViews: 0, uniqueVisitors: 0, bounceRate: '—', avgSessionTime: '—', topPages: [],
    });
  }
}
