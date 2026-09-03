import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { cmsAttractionId } from '@/lib/content';

const RANGES: Record<string, number> = { '7': 7, '30': 30, '90': 90, '365': 365 };

type Row = { path: string; session_id: string | null; device: string | null;
             entity_type: string | null; entity_id: string | null; created_at: string };

const dayKey = (iso: string) => iso.slice(0, 10);

/** Internal screens are traffic, but not the kind a tourism report is about. */
const isPublic = (path: string) =>
  !/^\/(admin|cms|lbo|api|_next)/.test(path);

/**
 * Visitor analytics over a window, with the previous equal window alongside so
 * a change can be stated rather than guessed at.
 *
 * Every figure here comes from page_views. Where something genuinely cannot be
 * derived — session duration, which is not recorded — it is returned as null
 * rather than filled with a plausible number.
 */
export async function GET(req: NextRequest) {
  if (!await requireStaffAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = RANGES[url.searchParams.get('range') ?? '30'] ?? 30;

  const now = Date.now();
  const start = new Date(now - days * 86_400_000);
  const prevStart = new Date(now - days * 2 * 86_400_000);

  // PostgREST caps a response at 1000 rows. Asked for ascending from the start
  // of the *previous* window, that silently returned the oldest 1000 rows and
  // nothing else: with 3,552 rows in range the totals came out at 854 instead
  // of 1,651, and as the table grows the whole current window eventually falls
  // outside the slice and the dashboard reports a site nobody visits. Paged
  // through instead, with a ceiling so one query cannot pull an unbounded table
  // into memory.
  const PAGE = 1000;
  const MAX_ROWS = 100_000;
  let data: Row[] = [];
  let error: { message: string } | null = null;

  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const res = await supabaseServer
      .from('page_views')
      .select('path, session_id, device, entity_type, entity_id, created_at')
      .gte('created_at', prevStart.toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);

    if (res.error) { error = res.error; break; }
    const batch = (res.data ?? []) as Row[];
    data = data.concat(batch);
    if (batch.length < PAGE) break;
  }

  if (error) {
    // Almost always the migration not having been run. Say so rather than
    // returning zeros that look like a site nobody visits.
    return NextResponse.json(
      { error: error.message, needsMigration: /page_views/.test(error.message) },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as Row[];
  const current = rows.filter(r => new Date(r.created_at) >= start);
  const previous = rows.filter(r => new Date(r.created_at) < start);

  const uniques = (rs: Row[]) => new Set(rs.map(r => r.session_id).filter(Boolean)).size;
  const change = (nowV: number, thenV: number): number | null =>
    thenV === 0 ? null : Math.round(((nowV - thenV) / thenV) * 1000) / 10;

  // One point per day across the whole window, including days with no traffic
  // so the line shows a quiet Tuesday rather than skipping it.
  const byDay = new Map<string, { views: number; sessions: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(dayKey(new Date(now - i * 86_400_000).toISOString()), { views: 0, sessions: new Set() });
  }
  for (const r of current) {
    const bucket = byDay.get(dayKey(r.created_at));
    if (!bucket) continue;
    bucket.views++;
    if (r.session_id) bucket.sessions.add(r.session_id);
  }

  const tally = <T>(rs: Row[], key: (r: Row) => T | null) => {
    const m = new Map<T, number>();
    for (const r of rs) {
      const k = key(r);
      if (k === null || k === undefined || k === '') continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const publicViews = current.filter(r => isPublic(r.path));

  // A visit that never went beyond one page. Real, because every view is a row.
  const perSession = new Map<string, number>();
  current.forEach(r => { if (r.session_id) perSession.set(r.session_id, (perSession.get(r.session_id) ?? 0) + 1); });
  const single = [...perSession.values()].filter(n => n === 1).length;
  const bounceRate = perSession.size ? Math.round((single / perSession.size) * 100) : null;

  const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 } as Record<string, number>;
  current.forEach(r => { if (r.device && r.device in deviceCounts) deviceCounts[r.device]++; });
  const deviceTotal = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;

  /**
   * Names for the ranked list, resolved here rather than in the browser.
   *
   * The dashboard used to look them up against /api/content/attractions, which
   * returns approved content only — so an archived attraction appeared in
   * "Most Visited" as a raw 'spot-<uuid>', linking to a page that 404s. Two of
   * the top three were in that state, including the most-viewed page on the
   * site. Read straight from the table, which still has the row, and flagged
   * so the dashboard can label it instead of offering a dead link.
   */
  const topAttractionIds = tally(
    current.filter(r => r.entity_type === 'attraction'), r => r.entity_id,
  ).slice(0, 5).map(([id, views]) => ({ id: String(id), views }));

  const attractionMeta = new Map<string, { name: string; archived: boolean }>();
  if (topAttractionIds.length) {
    const { data: rows } = await supabaseServer
      .from('cms_attractions')
      .select('id, name, status')
      .in('id', topAttractionIds.map(t => cmsAttractionId(t.id)));

    for (const row of rows ?? []) {
      attractionMeta.set(row.id, { name: row.name, archived: row.status !== 'approved' });
    }
  }

  return NextResponse.json({
    range: days,
    // Enough traffic to draw conclusions from? The dashboard uses this to show
    // a "still collecting" state instead of a confident-looking empty chart.
    hasData: current.length > 0,
    totals: {
      pageViews:      current.length,
      uniqueVisitors: uniques(current),
      publicViews:    publicViews.length,
      bounceRate,
      avgSessionTime: null,   // not recorded — deliberately not invented
    },
    trends: {
      pageViews:      change(current.length, previous.length),
      uniqueVisitors: change(uniques(current), uniques(previous)),
    },
    series: [...byDay.entries()].map(([date, v]) => ({
      date, views: v.views, visitors: v.sessions.size,
    })),
    topPages: tally(publicViews, r => r.path).slice(0, 8)
      .map(([path, views]) => ({ path, views })),
    topAttractions: topAttractionIds.map(({ id, views }) => {
      const meta = attractionMeta.get(cmsAttractionId(id));
      return { id, views, name: meta?.name ?? null, archived: meta?.archived ?? true };
    }),
    devices: Object.fromEntries(
      Object.entries(deviceCounts).map(([k, n]) => [k, { count: n, pct: Math.round((n / deviceTotal) * 100) }]),
    ),
  });
}
