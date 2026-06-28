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

    // Upsert live session into Supabase — must await before returning or Vercel kills the write
    if (sessionId) {
      const d: Device = ['desktop', 'mobile', 'tablet'].includes(device) ? device : 'desktop';
      await supabaseServer.from('active_sessions').upsert({
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

    return NextResponse.json({ pageViews: uniqueVisitors, uniqueVisitors, bounceRate, avgSessionTime: '—', topPages: [], devices });
  } catch {
    return NextResponse.json({ pageViews: 0, uniqueVisitors: 0, bounceRate: '—', avgSessionTime: '—', topPages: [], devices: { desktop: { count: 0, pct: 0 }, mobile: { count: 0, pct: 0 }, tablet: { count: 0, pct: 0 } } });
  }
}
