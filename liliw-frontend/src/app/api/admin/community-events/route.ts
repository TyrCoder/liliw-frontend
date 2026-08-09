import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * Every community event with how many people have joined it.
 *
 * Drafts are included — an event still being written is exactly what an
 * organiser wants to see next to the ones already running.
 */
export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: events, error } = await supabaseServer
    .from('cms_community_events')
    .select('*')
    .neq('status', 'archived')
    .order('date_start', { ascending: false });

  if (error) {
    console.error('[admin/community-events]', error.code, error.message);
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
  }

  const rows = events || [];
  if (!rows.length) return NextResponse.json({ success: true, data: [] });

  // One query for all the counts rather than one per event.
  const { data: signups } = await supabaseServer
    .from('community_event_signups')
    .select('event_id, status')
    .in('event_id', rows.map(e => e.id));

  const tally = new Map<string, { total: number; confirmed: number; cancelled: number }>();
  for (const s of signups || []) {
    const t = tally.get(s.event_id) || { total: 0, confirmed: 0, cancelled: 0 };
    if (s.status === 'cancelled') t.cancelled++;
    else {
      t.total++;
      if (s.status === 'confirmed') t.confirmed++;
    }
    tally.set(s.event_id, t);
  }

  return NextResponse.json({
    success: true,
    data: rows.map(e => ({
      ...e,
      // total excludes cancellations, because that is the number that answers
      // "how many people are coming".
      signups: tally.get(e.id) || { total: 0, confirmed: 0, cancelled: 0 },
    })),
  });
}
