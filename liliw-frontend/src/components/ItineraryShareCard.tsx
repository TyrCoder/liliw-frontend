'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import {
  drawItineraryShareCard, measureShareCard, dayColorHex, CARD_W, CARD_H,
} from '@/lib/itineraryShareCanvas';
import { encodePolyline } from '@/lib/polyline';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** The box the itinerary's own map geocodes inside, so both resolve a name to the same place. */
const LILIW_BBOX = '121.40,14.10,121.47,14.16';

/** Mapbox rejects a static request much over 8KB, so overlays get simpler as this is approached. */
const MAX_URL = 8000;

interface RouteStop {
  name: string;
  /** 1-based day number — colours this stop's pin and its legend badge. */
  day: number;
  /** Resolved from site content, or null when only Mapbox can place it. */
  coord: [number, number] | null;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** A filename-safe slug from the trip title, falling back when it's empty or all punctuation. */
function fileSlug(title: string): string {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'liliw-itinerary';
}

/** The same bbox-bounded lookup the itinerary map falls back to for a stop the site can't place itself. */
async function geocodeInLiliw(name: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${name}, Liliw, Laguna, Philippines`);
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&limit=1&bbox=${LILIW_BBOX}&country=ph`,
    );
    const d = await r.json();
    const c = d?.features?.[0]?.center;
    return Array.isArray(c) && c.length === 2 ? [c[0], c[1]] : null;
  } catch {
    return null;
  }
}

/**
 * The day's route as an encoded polyline that follows actual roads — the same
 * driving directions the itinerary's own map draws, rather than a straight
 * line cutting across town between stops. Falls back to the straight line if
 * Directions can't route it.
 */
async function drivingPolyline(coords: [number, number][]): Promise<string> {
  const straight = () => encodePolyline(coords.map(([lng, lat]) => [lat, lng] as [number, number]));
  if (coords.length > 25) return straight();
  try {
    const waypoints = coords.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const r = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=polyline&overview=simplified&access_token=${MAPBOX_TOKEN}`,
    );
    const d = await r.json();
    if (d?.code === 'Ok' && typeof d?.routes?.[0]?.geometry === 'string') return d.routes[0].geometry;
  } catch {
    // Falls through to the straight line, same as the itinerary map does.
  }
  return straight();
}

/** Spreads pins that land on near-identical coordinates, the way the itinerary map spreads its markers. */
function makeNudger() {
  const used: Record<string, number> = {};
  return ([lng, lat]: [number, number]): [number, number] => {
    const key = `${lng.toFixed(4)},${lat.toFixed(4)}`;
    const count = used[key] || 0;
    used[key] = count + 1;
    if (count === 0) return [lng, lat];
    const angle = count * 137.5 * (Math.PI / 180);
    const radius = 0.00028 * count;
    return [lng + Math.cos(angle) * radius, lat + Math.sin(angle) * radius];
  };
}

interface Props {
  title: string;
  subtitle: string;
  distanceKm: number | null;
  placesCount: number;
  daysCount: number;
  /** Every stop in itinerary order — its position here is its number on the map and in the legend. */
  routeStops: RouteStop[];
  onClose: () => void;
}

export default function ItineraryShareCard({
  title, subtitle, distanceKm, placesCount, daysCount, routeStops, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    // A capability check, not a browser sniff — Web Share's file support is
    // what decides whether Instagram/Facebook show up as targets at all, and
    // that varies by OS and browser version in a way no user-agent string does.
    setCanShareFiles(
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] }),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Measuring against fallback metrics would wrap the title differently
      // from how it finally draws, so wait for the real fonts first.
      try { await document.fonts?.ready; } catch { /* system-font metrics will do */ }
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stops = routeStops.map(({ name, day }) => ({ name, day }));
      // The map has to be requested at the size the layout gives it, so
      // measuring has to happen before anything is fetched.
      const layout = measureShareCard(ctx, { title, subtitle, stops });

      const located = await Promise.all(routeStops.map(async (stop) => ({
        ...stop,
        coord: stop.coord ?? (MAPBOX_TOKEN ? await geocodeInLiliw(stop.name) : null),
      })));
      if (cancelled) return;

      const nudge = makeNudger();
      const pins: string[] = [];
      const byDay = new Map<number, [number, number][]>();
      located.forEach((stop, i) => {
        if (!stop.coord) return;
        const [lng, lat] = nudge(stop.coord);
        pins.push(`pin-m-${i + 1}+${dayColorHex(stop.day).slice(1)}(${lng.toFixed(5)},${lat.toFixed(5)})`);
        if (!byDay.has(stop.day)) byDay.set(stop.day, []);
        byDay.get(stop.day)!.push(stop.coord);
      });

      const days = Array.from(byDay.entries())
        .filter(([, coords]) => coords.length >= 2)
        .sort((a, b) => a[0] - b[0]);
      const roads = await Promise.all(days.map(async ([day, coords]) => ({
        color: dayColorHex(day).slice(1),
        road: await drivingPolyline(coords),
        straight: encodePolyline(coords.map(([lng, lat]) => [lat, lng] as [number, number])),
      })));
      if (cancelled) return;

      // Casings first, then the coloured routes, then the pins on top — the
      // same stacking the itinerary map uses.
      const buildUrl = (useRoads: boolean, casing: boolean) => {
        const overlays: string[] = [];
        for (const { color, road, straight } of roads) {
          const line = encodeURIComponent(useRoads ? road : straight);
          if (casing) overlays.push(`path-9+ffffff-0.9(${line})`);
          overlays.push(`path-5+${color}-1(${line})`);
        }
        overlays.push(...pins);
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays.join(',')}/auto/${layout.mapW}x${layout.mapH}@2x?padding=60&access_token=${MAPBOX_TOKEN}`;
      };

      let mapImage: HTMLImageElement | null = null;
      if (pins.length > 0 && MAPBOX_TOKEN) {
        let url = buildUrl(true, true);
        if (url.length > MAX_URL) url = buildUrl(true, false);
        if (url.length > MAX_URL) url = buildUrl(false, false);
        mapImage = await loadImage(url);
      }
      const logoImage = await loadImage('/images/logo.png');
      if (cancelled) return;

      drawItineraryShareCard(ctx, {
        title, subtitle, stops, distanceKm, placesCount, daysCount, mapImage, logoImage,
      });
      setReady(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) { resolve(null); return; }
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

  const download = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${fileSlug(title)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const share = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], `${fileSlug(title)}.png`, { type: 'image/png' });
    setSharing(true);
    try {
      await navigator.share({
        files: [file],
        title,
        text: `My ${title} itinerary in Liliw, Laguna 🇵🇭`,
      });
    } catch {
      // Cancelled, or the share sheet itself failed — either way there's
      // nothing to recover from mid-share; the download button is still there.
    } finally {
      setSharing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: 'rgba(10,20,50,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
          style={{ maxHeight: '92vh' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <p className="font-bold text-gray-900" style={{ fontFamily: HL }}>Share Your Trip</p>
            <button onClick={onClose} aria-label="Close"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="relative mx-auto rounded-2xl overflow-hidden bg-gray-100 shadow-sm"
              style={{ maxWidth: 280, aspectRatio: `${CARD_W} / ${CARD_H}` }}>
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              )}
              <canvas ref={canvasRef} className="w-full h-full" style={{ opacity: ready ? 1 : 0 }} />
            </div>

            <p className="text-xs text-gray-400 text-center mt-4" style={{ fontFamily: BL }}>
              {canShareFiles
                ? 'Share straight to Instagram, Facebook, or wherever you post trips.'
                : 'Download the image, then post it on Instagram or Facebook.'}
            </p>
          </div>

          <div className="px-5 pb-5 pt-1 shrink-0 flex gap-2">
            <button onClick={download} disabled={!ready}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-40"
              style={{ fontFamily: BL }}>
              <Download className="w-4 h-4" /> Save Image
            </button>
            {canShareFiles && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={share} disabled={!ready || sharing}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition disabled:opacity-50"
                style={{ backgroundColor: '#1565C0', color: '#F5C518', fontFamily: BL, boxShadow: '0 6px 20px rgba(11,61,145,0.25)' }}>
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Share
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
