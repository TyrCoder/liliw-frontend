import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { supabaseServer } from '@/lib/supabase-server';
import { distanceMeters, toCoords, QR_PROXIMITY_METERS } from '@/lib/geo';
import { cmsAttractionId } from '@/lib/content';

// Fired as soon as an attraction detail page loads (while logged in) so the
// server has an authoritative start time to check the dwell requirement
// against in POST /api/attractions/visit — see phase8-visit-checkins.sql.
export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ success: true }); // guests just don't earn points

  const { attractionId, via, lat, lng } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  // A QR scan only counts as on-site if the phone is actually near the place.
  // Without this the ?src=qr flag proves nothing — anyone with the link could
  // claim a visit from home. Location is never trusted from the client beyond
  // this comparison: the attraction's own coordinates come from the database,
  // and the verdict is computed here rather than sent by the browser.
  let distance: number | null = null;
  let source: 'web' | 'qr' | 'qr_unverified' = 'web';

  if (via === 'qr') {
    source = 'qr_unverified';
    const here = toCoords(lat, lng);

    if (here) {
      const { data: attr } = await supabaseServer
        .from('cms_attractions')
        .select('map_lat, map_lng')
        .eq('id', cmsAttractionId(String(attractionId)))
        .maybeSingle();

      const there = toCoords(
        attr?.map_lat != null ? Number(attr.map_lat) : null,
        attr?.map_lng != null ? Number(attr.map_lng) : null,
      );

      if (there) {
        distance = Math.round(distanceMeters(here[0], here[1], there[0], there[1]));
        if (distance <= QR_PROXIMITY_METERS) source = 'qr';
      }
      // No coordinates on the attraction yet — nothing to compare against, so
      // it stays unverified rather than being waved through.
    }
  }

  const row = {
    user_id: auth.userId,
    attraction_id: String(attractionId),
    started_at: new Date().toISOString(),
  };

  const { error } = await supabaseServer
    .from('attraction_visit_checkins')
    .upsert({ ...row, via: source, distance_m: distance }, { onConflict: 'user_id,attraction_id' });

  // If the phase9 / phase17 columns aren't in place yet the insert fails on the
  // unknown column. Fall back to a bare check-in rather than blocking visit
  // tracking outright — losing the attribution beats losing the visit.
  if (error?.code === '42703') {
    await supabaseServer
      .from('attraction_visit_checkins')
      .upsert(row, { onConflict: 'user_id,attraction_id' });
  }

  // Reported back so the page can tell the visitor their scan was accepted —
  // silently downgrading to unverified would leave them wondering.
  return NextResponse.json({
    success: true,
    via: source,
    distanceMeters: distance,
    verified: source === 'qr',
  });
}
