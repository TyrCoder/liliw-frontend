import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

/**
 * Has this account earned a visit to one particular attraction?
 *
 * Its own endpoint rather than a reuse of /api/user/visited-attractions,
 * because that one lists only QR-confirmed visits for the passport, while a
 * review needs any credited visit. Asking it instead would have hidden the
 * review form from people the ratings route accepts — a form that appears and
 * disappears on a rule nobody can see is worse than no form.
 *
 * The rule lives in exactly two places now, and they read the same row.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ visited: false }, { status: 401 });

  const url = new URL(req.url);
  const one = url.searchParams.get('attractionId');
  // A checklist asks about a whole itinerary at once; asking per stop would be
  // six requests for a six-stop day, each re-reading the same table.
  const many = (url.searchParams.get('attractionIds') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const ids = many.length ? many : one ? [one] : [];
  if (!ids.length) {
    return NextResponse.json({ error: 'attractionId or attractionIds is required' }, { status: 400 });
  }

  const { data } = await supabaseServer
    .from('user_points')
    .select('reference_id, created_at')
    .eq('user_id', auth.userId)
    .eq('action', 'attraction_visit')
    .in('reference_id', ids);

  const visited: Record<string, string> = {};
  for (const row of data ?? []) visited[String(row.reference_id)] = row.created_at;

  // The single-id form keeps its original shape, so the review form is
  // unaffected by the checklist being added.
  if (!many.length) {
    const at = visited[ids[0]] ?? null;
    return NextResponse.json({ visited: !!at, visitedAt: at });
  }

  return NextResponse.json({
    visited: Object.fromEntries(ids.map(id => [id, !!visited[id]])),
    visitedAt: visited,
  });
}
