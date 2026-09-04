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

  const attractionId = new URL(req.url).searchParams.get('attractionId');
  if (!attractionId) {
    return NextResponse.json({ error: 'attractionId is required' }, { status: 400 });
  }

  const { data } = await supabaseServer
    .from('user_points')
    .select('created_at')
    .eq('user_id', auth.userId)
    .eq('action', 'attraction_visit')
    .eq('reference_id', attractionId)
    .maybeSingle();

  return NextResponse.json({ visited: !!data, visitedAt: data?.created_at ?? null });
}
