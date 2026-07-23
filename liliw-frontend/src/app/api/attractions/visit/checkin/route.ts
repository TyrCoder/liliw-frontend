import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { supabaseServer } from '@/lib/supabase-server';

// Fired as soon as an attraction detail page loads (while logged in) so the
// server has an authoritative start time to check the dwell requirement
// against in POST /api/attractions/visit — see phase8-visit-checkins.sql.
export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true }); // guests just don't earn points

  const { attractionId } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  await supabaseServer.from('attraction_visit_checkins').upsert(
    { user_id: auth.userId, attraction_id: String(attractionId), started_at: new Date().toISOString() },
    { onConflict: 'user_id,attraction_id' },
  );

  return NextResponse.json({ success: true });
}
