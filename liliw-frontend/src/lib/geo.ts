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
const DEFAULT_QR_PROXIMITY_METERS = 150;

/**
 * Overridable so the scan can be demonstrated away from the place itself —
 * a defence room, a laptop at home — without editing an attraction's real
 * coordinates to fake it.
 *
 * Deliberately noisy about it. This gates who earns points and a passport
 * stamp, so a widened radius left on by accident quietly turns "I was there"
 * into "I had the link". The value is logged at startup whenever it is not the
 * default, and the check-in response reports the radius it judged against, so
 * a loosened setting is visible rather than something you have to remember.
 *
 * Set QR_PROXIMITY_METERS in the environment; unset it to go back to 150.
 */
function resolveProximity(): number {
  const raw = process.env.QR_PROXIMITY_METERS;
  if (!raw) return DEFAULT_QR_PROXIMITY_METERS;

  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`[geo] QR_PROXIMITY_METERS="${raw}" is not a positive number — using ${DEFAULT_QR_PROXIMITY_METERS}m.`);
    return DEFAULT_QR_PROXIMITY_METERS;
  }
  if (n !== DEFAULT_QR_PROXIMITY_METERS) {
    console.warn(
      `[geo] QR check-in radius is ${n}m, not the usual ${DEFAULT_QR_PROXIMITY_METERS}m. ` +
      'Anyone within that distance can earn a visit — unset QR_PROXIMITY_METERS in production.',
    );
  }
  return n;
}

export const QR_PROXIMITY_METERS = resolveProximity();

/**
 * Validates a coordinate pair, returning it as a tuple or null. Returns the
 * pair rather than a boolean because a type predicate can only narrow one
 * argument, which would leave the other still possibly null at the call site.
 */
export function toCoords(lat: unknown, lng: unknown): [number, number] | null {
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  return ok(lat) && ok(lng) ? [lat, lng] : null;
}
