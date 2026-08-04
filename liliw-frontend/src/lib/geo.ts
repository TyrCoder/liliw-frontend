// Distance between two lat/lng points, in metres.
//
// Used to decide whether someone who scanned an attraction's QR code was
// actually standing at it. Haversine is plenty here: the error versus a proper
// ellipsoidal model is centimetres at the ~100m scale we care about.
export function distanceMeters(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const R = 6_371_000; // mean Earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * How close a phone must be to an attraction for a QR scan to count as
 * on-site. Generous on purpose: consumer GPS is routinely off by 20-50m, and
 * a large site (a farm, a church grounds) can be a hundred metres across, so
 * a tight radius would reject genuine visitors standing at the gate.
 */
export const QR_PROXIMITY_METERS = 150;

/**
 * Validates a coordinate pair, returning it as a tuple or null. Returns the
 * pair rather than a boolean because a type predicate can only narrow one
 * argument, which would leave the other still possibly null at the call site.
 */
export function toCoords(lat: unknown, lng: unknown): [number, number] | null {
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  return ok(lat) && ok(lng) ? [lat, lng] : null;
}
