import { NextResponse } from 'next/server';
import { fetchApprovedWithMedia } from '@/lib/supabase-cms';

/**
 * Community activities the public can join, for the Participate page.
 *
 * Events that have already finished are dropped here rather than in the page,
 * so a listing nobody can still join never reaches the browser at all. An
 * event with no end date is judged by its start; one with neither is treated
 * as open-ended and kept, since an ongoing call for volunteers is a real thing
 * the office will want to post.
 */
export async function GET() {
  try {
    const items = await fetchApprovedWithMedia(
      'cms_community_events',
      'community_event',
      q => q.order('date_start', { ascending: true }),
    );

    const now = Date.now();
    const upcoming = items.filter((e: Record<string, unknown>) => {
      const end = (e.date_end || e.date_start) as string | null;
      return !end || new Date(end).getTime() >= now;
    });

    return NextResponse.json(
      { data: upcoming },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (err) {
    console.error('[content/community-events]', err);
    return NextResponse.json({ data: [] });
  }
}
