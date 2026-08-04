import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { cmsAttractionId } from '@/lib/content';

/**
 * The visitor's collected places — one entry per attraction they actually
 * earned a visit for.
 *
 * Sourced from user_points rather than attraction_visit_checkins: a check-in
 * row exists the moment the page loads, but only a row in user_points means
 * the dwell requirement was met and the visit counted. Check-ins are joined in
 * afterwards purely for the QR/location detail.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: earned, error } = await supabaseServer
    .from('user_points')
    .select('reference_id, reference_name, created_at')
    .eq('user_id', auth.userId)
    .eq('action', 'attraction_visit')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[visited-attractions]', error.code, error.message);
    return NextResponse.json({ visits: [] });
  }
  if (!earned?.length) return NextResponse.json({ visits: [] });

  const publicIds = earned.map(r => String(r.reference_id));
  const uuids = publicIds.map(cmsAttractionId);

  // Listing details + photos. Both are best-effort: a visit stays in the list
  // even if its attraction was since unpublished or deleted, using the name
  // snapshotted on the points row.
  const [attrRes, mediaRes, checkinRes] = await Promise.all([
    supabaseServer.from('cms_attractions').select('id, name, category, location').in('id', uuids),
    supabaseServer.from('cms_media').select('content_id, url, sort_order')
      .eq('content_type', 'attraction').in('content_id', uuids)
      .order('sort_order', { ascending: true }),
    supabaseServer.from('attraction_visit_checkins')
      .select('attraction_id, via, distance_m').eq('user_id', auth.userId),
  ]);

  const attrs = new Map((attrRes.data ?? []).map(a => [a.id, a]));
  const photo = new Map<string, string>();
  for (const m of mediaRes.data ?? []) {
    if (!photo.has(m.content_id)) photo.set(m.content_id, m.url); // first = lowest sort_order
  }
  const checkins = new Map((checkinRes.data ?? []).map(c => [c.attraction_id, c]));

  const visits = earned.map(row => {
    const publicId = String(row.reference_id);
    const uuid = cmsAttractionId(publicId);
    const attr = attrs.get(uuid);
    const chk = checkins.get(publicId);
    return {
      id:          publicId,
      name:        attr?.name ?? row.reference_name ?? 'Attraction',
      category:    attr?.category ?? null,
      location:    attr?.location ?? null,
      photo:       photo.get(uuid) ?? null,
      visitedAt:   row.created_at,
      // 'qr' only when the scan was confirmed on-site — see phase17.
      viaQr:       chk?.via === 'qr' || chk?.via === 'qr_unverified',
      verified:    chk?.via === 'qr',
      distanceM:   chk?.distance_m ?? null,
      stillListed: !!attr,
    };
  });

  return NextResponse.json({ visits, total: visits.length });
}
