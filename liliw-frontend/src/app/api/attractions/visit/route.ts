import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';
import { supabaseServer } from '@/lib/supabase-server';
import { VISIT_DWELL_MS } from '@/lib/visitDwell';

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true, unlockedAchievements: [] }); // guests just don't earn points

  const { attractionId, attractionName } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  // The 2.5-minute dwell requirement is enforced here against the server's own
  // recorded check-in time (see /api/attractions/visit/checkin), not a
  // client-supplied timestamp — a client can only trigger this by actually
  // waiting, not by fabricating an elapsed duration.
  const { data: checkin } = await supabaseServer
    .from('attraction_visit_checkins')
    .select('started_at')
    .eq('user_id', auth.userId)
    .eq('attraction_id', String(attractionId))
    .maybeSingle();

  const elapsedMs = checkin ? Date.now() - new Date(checkin.started_at).getTime() : 0;
  if (elapsedMs < VISIT_DWELL_MS) {
    return NextResponse.json({ success: false, error: 'dwell_not_met', unlockedAchievements: [] }, { status: 400 });
  }

  const unlockedAchievements = await awardPoints(auth.userId, 'attraction_visit', String(attractionId), attractionName || 'Attraction').catch(() => []);
  return NextResponse.json({ success: true, unlockedAchievements });
}
