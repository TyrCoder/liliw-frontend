'use client';

import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface MappedStop {
  /** The public attraction id, so a stop can be tied to a visit record. */
  id?: string;
  time?: string;
  place: string;
  note?: string;
  lat: number;
  lng: number;
}

/**
 * The stops of one itinerary, in order, on a map.
 *
 * Numbered to match the list beside it, and joined by a line so the shape of
 * the day reads at a glance — whether it doubles back, whether the last stop is
 * across town. The line is drawn straight between pins rather than along the
 * roads: it is there to show sequence, and the distances printed in the list
 * are the road figures.
 *
 * Renders nothing without a token or without at least one placed stop, so a
 * missing key leaves the itinerary intact rather than an empty grey box.
 */
export default function ItineraryMap({ stops, height = 260 }: { stops: MappedStop[]; height?: number }) {
  /**
   * The roads the route actually follows.
   *
   * A line drawn straight between pins cuts through the blocks between them,
   * which on a town map reads as a route nobody could take — Liliw's centre is
   * a grid and the straight line crossed four streets at an angle. Directions
   * returns the real geometry, so what is drawn is what a driver would drive,
   * one-ways and turns included.
   *
   * Falls back to the straight line while the request is in flight and if it
   * fails, so the map always shows the order of the stops.
   */
  const [road, setRoad] = useState<GeoJSON.LineString | null>(null);

  const stopKey = stops.map(s => `${s.lng.toFixed(5)},${s.lat.toFixed(5)}`).join(';');

  useEffect(() => {
    if (stops.length < 2) { setRoad(null); return; }
    let cancelled = false;

    fetch('/api/route-distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coords: stops.map(s => [s.lng, s.lat]),
        profile: 'driving',
        geometry: true,
      }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled) return;
        setRoad(d?.source === 'road' && d?.geometry?.type === 'LineString' ? d.geometry : null);
      })
      .catch(() => { if (!cancelled) setRoad(null); });

    return () => { cancelled = true; };
  }, [stopKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const bounds = useMemo(() => {
    if (!stops.length) return null;
    const lats = stops.map(s => s.lat);
    const lngs = stops.map(s => s.lng);
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude:  (Math.min(...lats) + Math.max(...lats)) / 2,
      // A single stop would otherwise be framed at world zoom; a spread-out day
      // needs to pull back far enough to hold both ends.
      zoom: stops.length === 1 ? 15
        : Math.max(...lngs) - Math.min(...lngs) > 0.05 ||
          Math.max(...lats) - Math.min(...lats) > 0.05 ? 12 : 13.5,
    };
  }, [stops]);

  const line = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: road ?? { type: 'LineString' as const, coordinates: stops.map(s => [s.lng, s.lat]) },
  }), [stops, road]);

  if (!TOKEN || !bounds) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height }}>
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={bounds}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        dragRotate={false}
      >
        {stops.length > 1 && (
          <Source id="itinerary-line" type="geojson" data={line}>
            <Layer id="itinerary-line-layer" type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={road
                // The real route: solid, so it reads as a road and not a hint.
                ? { 'line-color': '#1565C0', 'line-width': 4, 'line-opacity': 0.85 }
                // Still the straight guess: dashed, so it does not claim to be
                // a road anyone can drive.
                : { 'line-color': '#1565C0', 'line-width': 3, 'line-opacity': 0.45, 'line-dasharray': [2, 1.5] }} />
          </Source>
        )}

        {stops.map((s, i) => (
          <Marker key={`${s.place}-${i}`} longitude={s.lng} latitude={s.lat} anchor="center">
            <div
              title={`${i + 1}. ${s.place}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
              style={{ backgroundColor: '#0B3D91', border: '2px solid #F5C518' }}>
              {i + 1}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

/**
 * Turns stops that name a place into stops that can be pinned.
 *
 * Matching is by attraction name, since that is all an itinerary stores —
 * exact first, then a contains match either way round, which is what the
 * planner already does when it orders stops by proximity. A stop that matches
 * nothing is dropped from the map and left in the list, because a list with a
 * gap in it is better than a map with a pin in the wrong place.
 */
export function useMappedStops(stops: { place: string; time?: string; note?: string }[]): MappedStop[] {
  const [mapped, setMapped] = useState<MappedStop[]>([]);

  const signature = stops.map(s => s.place).join('|');

  useEffect(() => {
    if (!stops.length) { setMapped([]); return; }
    let cancelled = false;

    fetch('/api/content/attractions')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;

        const places: { id: string; name: string; lat: number; lng: number }[] = [];
        for (const a of d.data ?? []) {
          const at = a.attributes ?? {};
          // The public API nests these under `coordinates`; map_lat and map_lng
          // are the column names, which only the server sees. Reading the
          // column names here found nothing on every attraction, so no stop
          // was ever placed and the map never rendered — the schedule appeared
          // on its own and looked like the map had been left out.
          const lat = Number(at.coordinates?.latitude  ?? at.map_lat ?? at.latitude);
          const lng = Number(at.coordinates?.longitude ?? at.map_lng ?? at.longitude);
          if (at.name && Number.isFinite(lat) && Number.isFinite(lng)) {
            places.push({ id: a.id, name: String(at.name).trim().toLowerCase(), lat, lng });
          }
        }

        const find = (place: string) => {
          const key = place.trim().toLowerCase();
          return places.find(p => p.name === key)
            ?? places.find(p => p.name.includes(key) || key.includes(p.name));
        };

        setMapped(stops.flatMap(st => {
          const hit = find(st.place);
          return hit ? [{ ...st, id: hit.id, lat: hit.lat, lng: hit.lng }] : [];
        }));
      })
      .catch(() => { if (!cancelled) setMapped([]); });

    return () => { cancelled = true; };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  return mapped;
}
