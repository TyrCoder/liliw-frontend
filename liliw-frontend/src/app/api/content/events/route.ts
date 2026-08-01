import { NextResponse } from 'next/server';
import { fetchApproved } from '@/lib/supabase-cms';

export async function GET() {
  try {
    // Returns every approved event. is_joinable means "accepts public sign-ups",
    // not "exists" — filtering on it here made an event nobody can sign up for
    // invisible everywhere, so the calendar showed nothing while three approved
    // festivals sat in the CMS. Callers that specifically want joinable events
    // (the community page's "Join an Upcoming Event" section, the admin picker)
    // already filter on the flag themselves.
    const data = await fetchApproved(
      'cms_events',
      q => q.order('date_start', { ascending: true }),
    );
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
