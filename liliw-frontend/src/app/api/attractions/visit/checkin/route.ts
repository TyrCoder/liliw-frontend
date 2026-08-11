import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/verifyToken';
import { supabaseServer } from '@/lib/supabase-server';
import { distanceMeters, toCoords, QR_PROXIMITY_METERS } from '@/lib/geo';
import { cmsAttractionId } from '@/lib/content';
import { awardPoints } from '@/lib/achievements';

// Fired as soon as an attraction detail page loads (while logged in) so the
// server has an authoritative start time to check the dwell requirement
// against in POST /api/attractions/visit — see phase8-visit-checkins.sql.
export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  // Guests can read the page but can't be credited with anything. Said
  // explicitly so a QR scan can prompt them to sign in rather than appearing
  // to work and quietly awarding nothing.
  if (!auth) return NextResponse.json({ success: true, authenticated: false });

  const { attractionId, attractionName, via, lat, lng } = await request.json();
  if (!attractionId) return NextResponse.json({ error: 'attractionId required' }, { status: 400 });

  // A place only counts once. user_points already refuses a duplicate
  // (user_id, action, reference_id) row, so re-scanning could never award
  // twice — but without checking here the page would restart the dwell timer
  // and tell the visitor their scan was confirmed, implying points they will
  // not get. Look it up so the UI can say "already collected" instead.
  const { data: prior } = await supabaseServer
    .from('user_points')
    .select('created_at')
    .eq('user_id', auth.userId)
    .eq('action', 'attraction_visit')
    .eq('reference_id', String(attractionId))
    .maybeSingle();

  if (prior) {
    return NextResponse.json({
      success: true,
      authenticated: true,
      alreadyVisited: true,
      visitedAt: prior.created_at,
    });
  }

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

  // Never downgrade a scan that was already verified.
  //
  // This is why a genuine scan produced no stamp. The scanner posts via 'qr'
  // and then sends the visitor to the attraction page, which posts its own
  // check-in as 'web' — and the upsert below is keyed on
  // (user_id, attraction_id), so the second write replaced the first and the
  // verified scan became an ordinary page view seconds after it happened.
  // Today's row for Esmeris Farm reads 'web' for exactly that reason.
  const RANK = { web: 0, qr_unverified: 1, qr: 2 } as const;
  const { data: existing } = await supabaseServer
    .from('attraction_visit_checkins')
    .select('via, distance_m, started_at')
    .eq('user_id', auth.userId)
    .eq('attraction_id', String(attractionId))
    .maybeSingle();

  const prevVia = (existing?.via ?? 'web') as keyof typeof RANK;
  if (existing && RANK[prevVia] > RANK[source]) {
    source = prevVia;
    distance = existing.distance_m ?? distance;
  }

  const row = {
    user_id: auth.userId,
    attraction_id: String(attractionId),
    // Keep the original arrival time too: the dwell window is measured from
    // it, and restarting the clock on every page load would mean a visitor who
    // reloads never accrues the 2.5 minutes.
    started_at: existing?.started_at ?? new Date().toISOString(),
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

  // A confirmed on-site scan earns the visit there and then.
  //
  // The 2.5-minute dwell rule exists to prove someone actually engaged with a
  // place rather than clicking through — but standing within 150m of it with
  // its poster in the camera is stronger evidence than any amount of time on a
  // web page. Requiring both meant a visitor scanned at the gate, pocketed
  // their phone, and earned nothing; and since the passport now stamps only
  // verified scans, they got no stamp either.
  //
  // Page visits still go through the dwell path in /api/attractions/visit.
  let unlockedAchievements: Awaited<ReturnType<typeof awardPoints>> = [];
  let awarded = false;
  if (source === 'qr') {
    unlockedAchievements = await awardPoints(
      auth.userId, 'attraction_visit', String(attractionId), attractionName || 'Attraction',
    ).catch(() => []);
    awarded = true;
  }

  // Reported back so the page can tell the visitor what happened rather than
  // silently downgrading an unverified scan. authenticated/alreadyVisited let
  // the caller tell a fresh check-in from a repeat or a signed-out scan.
  return NextResponse.json({
    success: true,
    authenticated: true,
    alreadyVisited: false,
    via: source,
    distanceMeters: distance,
    verified: source === 'qr',
    awarded,
    unlockedAchievements,
  });
}
