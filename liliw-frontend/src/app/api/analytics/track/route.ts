import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireStaffAuth } from '@/lib/auth';

type Device = 'desktop' | 'mobile' | 'tablet';
const DEVICES: Device[] = ['desktop', 'mobile', 'tablet'];

const asDevice = (v: unknown): Device =>
  DEVICES.includes(v as Device) ? (v as Device) : 'desktop';

/**
 * Attraction, story and event pages carry the entity in the path. Recording it
 * alongside the view means "most visited attractions" is a lookup rather than
 * URL parsing across the whole table on every dashboard load.
 */
function entityFromPath(path: string): { type: string | null; id: string | null } {
  const m = path.match(/^\/(attractions|stories|community\/events)\/([^/?#]+)/);
  if (!m) return { type: null, id: null };
  const type = m[1] === 'community/events' ? 'event' : m[1] === 'stories' ? 'story' : 'attraction';
  return { type, id: decodeURIComponent(m[2]) };
}

/**
 * Records a page view.
 *
 * Views used to be counted in a Map held in module scope. On Vercel that resets
 * whenever a function goes cold and is separate per instance, so the total was
 * never real — and the GET below reported unique visitors as the page-view
 * count, which is why the two dashboard cards always matched exactly. Views now
 * go to the page_views table, one row each.
 */
export async function POST(request: NextRequest) {
  try {
    const { path, sessionId, device } = await request.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const d = asDevice(device);
    const { type, id } = entityFromPath(path);

    // Tracking must never delay or break a page, so failures are swallowed
    // here deliberately — but they are the only ones in this file that are.
    const [viewResult] = await Promise.allSettled([
      supabaseServer.from('page_views').insert({
        path: path.slice(0, 400),
        session_id: sessionId ?? null,
        device: d,
        entity_type: type,
        entity_id: id,
      }),
      sessionId
        ? supabaseServer.from('active_sessions').upsert({
            session_id: sessionId,
            page: path,
            device: d,
            last_seen: new Date().toISOString(),
          }, { onConflict: 'session_id' })
        : Promise.resolve(),
    ]);

    // Surfaced only in logs: if the migration has not been run, this is the
    // one place that would otherwise be silent about it.
    if (viewResult.status === 'fulfilled' && viewResult.value?.error) {
      console.error('[analytics] page_views insert failed:', viewResult.value.error.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

/**
 * Live traffic figures — staff only.
 *
 * This was open to anyone: it answered onlineNow, viewsToday, visitorsToday
 * and the device split to an unauthenticated request, which is operational
 * data about the site rather than anything the public needs. The POST above
 * stays open, because that is the browser recording its own page view.
 */
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const since = new Date(Date.now() - 5 * 60_000).toISOString();

    const [{ data: live }, { data: today }] = await Promise.all([
      supabaseServer.from('active_sessions').select('session_id, device, page').gte('last_seen', since),
      supabaseServer.from('page_views')
        .select('session_id')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    const rows = live ?? [];
    const dc: Record<Device, number> = { desktop: 0, mobile: 0, tablet: 0 };
    rows.forEach(r => { const d = asDevice(r.device); dc[d]++; });
    const total = dc.desktop + dc.mobile + dc.tablet || 1;

    const viewsToday = today?.length ?? 0;
    const visitorsToday = new Set((today ?? []).map(r => r.session_id).filter(Boolean)).size;

    return NextResponse.json({
      onlineNow: rows.length,
      viewsToday,
      visitorsToday,
      devices: {
        desktop: { count: dc.desktop, pct: Math.round((dc.desktop / total) * 100) },
        mobile:  { count: dc.mobile,  pct: Math.round((dc.mobile  / total) * 100) },
        tablet:  { count: dc.tablet,  pct: Math.round((dc.tablet  / total) * 100) },
      },
    });
  } catch {
    return NextResponse.json({
      onlineNow: 0, viewsToday: 0, visitorsToday: 0,
      devices: { desktop: { count: 0, pct: 0 }, mobile: { count: 0, pct: 0 }, tablet: { count: 0, pct: 0 } },
    });
  }
}
