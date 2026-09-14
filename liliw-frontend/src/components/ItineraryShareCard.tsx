'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import {
  drawItineraryShareCard, CARD_W, CARD_H, MAP_PANEL_W, MAP_PANEL_H,
} from '@/lib/itineraryShareCanvas';
import { encodePolyline } from '@/lib/polyline';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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

interface Props {
  title: string;
  subtitle: string;
  distanceKm: number | null;
  placesCount: number;
  daysCount: number;
  /** Ordered stops across the whole trip, for the route line, the numbered pins, and the legend under the map. */
  routeStops: { name: string; coord: [number, number] }[];
  onClose: () => void;
}

export default function ItineraryShareCard({
  title, subtitle, distanceKm, placesCount, daysCount, routeStops, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      let mapImage: HTMLImageElement | null = null;
      if (routeStops.length >= 2 && MAPBOX_TOKEN) {
        const encoded = encodePolyline(routeStops.map(({ coord: [lng, lat] }) => [lat, lng] as [number, number]));
        const path = `path-4+F5C518-1(${encodeURIComponent(encoded)})`;
        // One pin per stop, numbered to match the legend drawn under the map
        // — Mapbox marker labels can only be a single digit/letter, so the
        // full name only ever appears in that legend, not on the pin itself.
        const pins = routeStops
          .map(({ coord: [lng, lat] }, i) => `pin-s-${i + 1}+ffffff(${lng},${lat})`)
          .join(',');
        const overlay = `${path},${pins}`;
        const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlay}/auto/${MAP_PANEL_W}x${MAP_PANEL_H}@2x?padding=60&access_token=${MAPBOX_TOKEN}`;
        mapImage = await loadImage(url);
      }
      const logoImage = await loadImage('/images/logo.png');
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawItineraryShareCard(ctx, {
        title, distanceKm, placesCount, daysCount, subtitle, mapImage, logoImage,
        stopNames: routeStops.map((s) => s.name),
      });
      if (cancelled) return;
      setReady(true);
      canvas.toBlob((blob) => {
        if (blob && !cancelled) setPreviewUrl(URL.createObjectURL(blob));
      }, 'image/png');
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

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
