import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

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

    // Upsert live session into Supabase (fire-and-forget)
    if (sessionId) {
      const d: Device = ['desktop', 'mobile', 'tablet'].includes(device) ? device : 'desktop';
      void supabaseServer.from('active_sessions').upsert({
        session_id: sessionId,
        page: path,
        device: d,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

export async function GET() {
  try {
    // ── Unique visitors from Supabase active_sessions (persistent) ────────
    const { data: sessionRows, error: sessionErr } = await supabaseServer
      .from('active_sessions')
      .select('session_id, device', { count: 'exact' });

    const rows = sessionErr ? [] : (sessionRows ?? []);
    const uniqueVisitors = rows.length;

    // Bounce rate: sessions with only 1 page view (use in-memory fallback if available)
    const inMemSessions = Array.from(sessionStore.values());
    const bounceCount   = inMemSessions.filter(s => s.pageViews <= 1).length;
    const bounceBase    = inMemSessions.length || uniqueVisitors;
    const bounceRate    = bounceBase > 0 ? `${Math.round((bounceCount / bounceBase) * 100)}%` : '—';

    // Device breakdown from Supabase rows
    const dc = { desktop: 0, mobile: 0, tablet: 0 };
    rows.forEach((r: any) => {
      const d = r.device as Device;
      if (d in dc) dc[d]++;
    });
    const total = dc.desktop + dc.mobile + dc.tablet || 1;
    const devices = {
      desktop: { count: dc.desktop, pct: Math.round((dc.desktop / total) * 100) },
      mobile:  { count: dc.mobile,  pct: Math.round((dc.mobile  / total) * 100) },
      tablet:  { count: dc.tablet,  pct: Math.round((dc.tablet  / total) * 100) },
    };

    const topPages: { path: string; views: number }[] = [];
    const totalViews = uniqueVisitors;
    return NextResponse.json({ pageViews: totalViews, uniqueVisitors, bounceRate, avgSessionTime: '—', topPages, devices });
  } catch {
    return NextResponse.json({ pageViews: 0, uniqueVisitors: 0, bounceRate: '—', avgSessionTime: '—', topPages: [], devices: { desktop: { count: 0, pct: 0 }, mobile: { count: 0, pct: 0 }, tablet: { count: 0, pct: 0 } } });
  }
}
