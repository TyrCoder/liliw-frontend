import { NextRequest, NextResponse } from 'next/server';
import { distanceMeters } from '@/lib/geo';

/**
 * Road distance between the stops of an itinerary, in order.
 *
 * A straight line between two pins is not the distance anyone travels. Liliw's
 * centre is one-way in places and the roads bend around the church block, so a
 * pair that measures 900 m apart can be a 1.6 km drive. Mapbox Directions is
 * asked instead, which follows the actual road network — one-way streets, turn
 * restrictions and no-entry are all part of the routing graph, so the number
 * matches what a driver would see.
 *
 * The profile matters and is not cosmetic:
 *   driving  obeys one-ways and turn restrictions
 *   walking  ignores them, correctly — someone on foot can walk up a one-way
 *
 * One request covers the whole day: Directions accepts up to 25 waypoints and
 * returns a leg per consecutive pair, so a five-stop plan costs one call rather
 * than four. Straight-line distance is returned for any leg it cannot answer,
 * labelled as such, so the itinerary always has a number to show.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAX_WAYPOINTS = 25;

type Coord = [number, number]; // [lng, lat], the order Mapbox uses

/** Cached per coordinate list — a plan is re-rendered far more often than it changes. */
const cache = new Map<string, { legs: number[]; source: string; at: number }>();
const CACHE_MS = 30 * 60 * 1000;

const isCoord = (c: unknown): c is Coord =>
  Array.isArray(c) && c.length === 2 &&
  typeof c[0] === 'number' && typeof c[1] === 'number' &&
  Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const coords: unknown = body?.coords;
  const profile = body?.profile === 'walking' ? 'walking' : 'driving';

  if (!Array.isArray(coords) || coords.length < 2 || !coords.every(isCoord)) {
    return NextResponse.json({ error: 'coords must be two or more [lng, lat] pairs' }, { status: 400 });
  }
  if (coords.length > MAX_WAYPOINTS) {
    return NextResponse.json(
      { error: `Up to ${MAX_WAYPOINTS} stops can be measured in one request.` },
      { status: 400 },
    );
  }

  const list = coords as Coord[];

  /** What to fall back to, per leg, when the road network cannot be consulted. */
  const straightLegs = () =>
    list.slice(0, -1).map((c, i) =>
      distanceMeters(c[1], c[0], list[i + 1][1], list[i + 1][0]),
    );

  const key = `${profile}:${list.map(c => c.map(n => n.toFixed(5)).join(',')).join(';')}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json({ legs: hit.legs, source: hit.source, cached: true });
  }

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ legs: straightLegs(), source: 'straight-line', reason: 'no map token' });
  }

  try {
    const path = list.map(c => `${c[0]},${c[1]}`).join(';');
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${path}` +
      `?overview=false&steps=false&access_token=${MAPBOX_TOKEN}`;

    // Directions is a third party on the path of a page render; a slow answer
    // should cost a straight-line number, not a hung itinerary.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    const data = await res.json().catch(() => null);
    const legs = data?.routes?.[0]?.legs;

    if (!res.ok || !Array.isArray(legs) || legs.length !== list.length - 1) {
      // A stop with no road access — a falls or a farm reached on foot — makes
      // Mapbox return NoRoute rather than an error, and the itinerary should
      // still show something.
      return NextResponse.json({
        legs: straightLegs(),
        source: 'straight-line',
        reason: data?.message || data?.code || `directions ${res.status}`,
      });
    }

    const meters = legs.map((l: { distance?: number }, i: number) =>
      typeof l.distance === 'number' ? l.distance : straightLegs()[i],
    );

    cache.set(key, { legs: meters, source: 'road', at: Date.now() });
    return NextResponse.json({ legs: meters, source: 'road', profile });
  } catch (err) {
    return NextResponse.json({
      legs: straightLegs(),
      source: 'straight-line',
      reason: err instanceof Error ? err.message : 'directions unavailable',
    });
  }
}
