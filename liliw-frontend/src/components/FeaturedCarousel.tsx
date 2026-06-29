'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Star, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const TYPE_COLORS: Record<string, string> = {
  heritage: '#F59E0B',
  spot:     '#3B82F6',
  dining:   '#EF4444',
};
const TYPE_LABELS: Record<string, string> = {
  heritage: 'Heritage',
  spot:     'Tourist Spot',
  dining:   'Dining & Food',
};
const TYPE_GRADIENTS: Record<string, string> = {
  heritage: 'from-amber-700 to-amber-900',
  spot:     'from-blue-700 to-blue-900',
  dining:   'from-red-700 to-red-900',
};

interface Props {
  attractions: any[];
}

export default function FeaturedCarousel({ attractions }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(p => (p + 1) % attractions.length), [attractions.length]);
  const prev = useCallback(() => setCurrent(p => (p - 1 + attractions.length) % attractions.length), [attractions.length]);

  useEffect(() => {
    if (paused || attractions.length <= 1) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next, paused, attractions.length]);

  if (!attractions.length) return null;

  const a = attractions[current];
  const attrs = a?.attributes ?? {};
  const photos: any[] = attrs.photos ?? [];
  const coverUrl = photos[0]?.url
    ? (photos[0].url.startsWith('http') ? photos[0].url : `${STRAPI_BASE}${photos[0].url}`)
    : null;
  const color = TYPE_COLORS[a.type] ?? '#1565C0';
  const label = TYPE_LABELS[a.type] ?? a.type;
  const gradient = TYPE_GRADIENTS[a.type] ?? 'from-blue-700 to-blue-900';

  return (
    <div
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl"
      style={{ height: 'clamp(320px, 50vw, 520px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        >
          {coverUrl && (
            <img src={coverUrl} alt={attrs.name} className="w-full h-full object-cover" />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 pb-10 sm:pb-14 z-10">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              {/* Type badge */}
              <div
                className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                <Layers className="w-3.5 h-3.5" /> {label}
              </div>

              {/* Name */}
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
                {attrs.name ?? 'Attraction'}
              </h3>

              {/* Location */}
              {attrs.location && (
                <p className="flex items-center gap-1.5 text-white/80 text-sm sm:text-base mb-3">
                  <MapPin className="w-4 h-4 shrink-0" /> {attrs.location}
                </p>
              )}

              {/* Rating */}
              {attrs.rating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" fill={i < attrs.rating ? '#F59E0B' : 'none'} stroke={i < attrs.rating ? '#F59E0B' : 'rgba(255,255,255,0.4)'} />
                  ))}
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/attractions/${a.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90 group"
                style={{ backgroundColor: color }}
              >
                View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {attractions.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/25 hover:bg-white/40 backdrop-blur-sm p-2.5 rounded-full transition shadow-lg"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/25 hover:bg-white/40 backdrop-blur-sm p-2.5 rounded-full transition shadow-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {attractions.length > 1 && (
        <div className="absolute bottom-4 right-6 z-20 flex gap-2">
          {attractions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Go to ${idx + 1}`}
              className={`rounded-full transition-all duration-300 ${
                idx === current ? 'bg-white w-7 h-2.5' : 'bg-white/50 hover:bg-white/70 w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
        {current + 1} / {attractions.length}
      </div>
    </div>
  );
}
