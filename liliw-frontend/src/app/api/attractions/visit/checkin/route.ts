import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { supabaseServer } from '@/lib/supabase-server';

// Fired as soon as an attraction detail page loads (while logged in) so the
// server has an authoritative start time to check the dwell requirement
// against in POST /api/attractions/visit — see phase8-visit-checkins.sql.
export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true }); // guests just don't earn points

  const { attractionId, via } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  // 'qr' when the visitor arrived by scanning the attraction's QR code on site
  // (the code encodes ?src=qr), 'web' for ordinary browsing. Whitelisted rather
  // than stored raw so a client can't write arbitrary values into the column.
  const source = via === 'qr' ? 'qr' : 'web';

  const row = { user_id: auth.userId, attraction_id: String(attractionId), started_at: new Date().toISOString() };

  const { error } = await supabaseServer
    .from('attraction_visit_checkins')
    .upsert({ ...row, via: source }, { onConflict: 'user_id,attraction_id' });

  // If phase9-qr-and-social.sql hasn't been run yet the `via` column doesn't
  // exist. Fall back to a check-in without it rather than failing outright —
  // losing the QR attribution is better than blocking visit tracking entirely.
  if (error?.code === '42703') {
    await supabaseServer
      .from('attraction_visit_checkins')
      .upsert(row, { onConflict: 'user_id,attraction_id' });
  }

  return NextResponse.json({ success: true });
}
