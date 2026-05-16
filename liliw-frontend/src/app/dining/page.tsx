'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Utensils } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];

function Bunting({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="126" height="36" viewBox="0 0 126 36" style={{ transform: flip ? 'scaleX(-1)' : undefined, display:'inline-block', verticalAlign:'middle' }}>
      <line x1="0" y1="5" x2="126" y2="5" stroke="#6B7280" strokeWidth="1.5" />
      {PENNANT.map((c, i) => { const cx = 9 + i * 18; return <g key={i}><path d={`M ${cx-9},5 A 9,16 0 0,1 ${cx+9},5 Z`} fill={c} /><line x1={cx} y1="5" x2={cx} y2="21" stroke="rgba(0,0,0,0.15)" strokeWidth="0.75" /></g>; })}
    </svg>
  );
}

function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ lineHeight: 0, backgroundColor: from }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:'100%', height:60, display:'block' }}>
        <path d="M0,0 C480,60 960,0 1440,60 L1440,60 L0,60 Z" fill={to} />
      </svg>
    </div>
  );
}

interface DiningAttraction {
  id: string | number;
  attributes: { name: string; description?: string; location?: string; category?: string; rating?: number; photos?: Array<{ url: string; formats?: any }>; };
  type: 'dining';
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EF4444', cafe: '#F97316', bakery: '#EAB308',
  streetfood: '#22C55E', fastfood: '#0D9488',
};

export default function DiningPage() {
  const [places, setPlaces] = useState<DiningAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/strapi/attractions')
      .then(r => r.json())
      .then(json => setPlaces((json.data ?? []).filter((a: any) => a.type === 'dining') as DiningAttraction[]))
      .catch(() => setError('Failed to load dining places'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#1565C0 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>
                Dining &amp; Food
              </h1>
              <Bunting flip />
            </div>
            <p className="text-center text-white/70 text-base mt-2" style={{ fontFamily: BL }}>
              Taste the local flavors and culinary gems of Liliw, Laguna
            </p>
          </motion.div>
        </div>
      </div>
      <WaveDown from="#1565C0" to="#ffffff" />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio:'3/4' }} />)}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
            <p className="text-red-700 font-semibold" style={{ fontFamily: HL }}>Error loading dining places</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && places.length > 0 && (
          <motion.div initial="hidden" animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, idx) => {
              const photos = place.attributes?.photos ?? [];
              const rawUrl = photos[0]?.formats?.medium?.url || photos[0]?.formats?.small?.url || photos[0]?.url;
              const imgUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${STRAPI_BASE}${rawUrl}`) : null;
              const rating = place.attributes?.rating ?? 0;
              const catColor = CATEGORY_COLORS[place.attributes?.category ?? ''] ?? '#F97316';
              return (
                <motion.div key={`${place.id}-${idx}`}
                  variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } }}
                  whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                  <Link href={`/attractions/${place.id}`} className="block">
                    <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group"
                      style={{ aspectRatio:'3/4', background:'linear-gradient(135deg,#7B2000,#4A1000)' }}>
                      {imgUrl
                        ? <img src={imgUrl} alt={place.attributes?.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Utensils className="w-20 h-20 text-white" /></div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <FavoriteButton attractionId={String(place.id)} attractionName={place.attributes?.name || ''} attractionType="dining" attractionCategory={place.attributes?.category} className="absolute top-3 right-3 z-20" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2"
                          style={{ backgroundColor: catColor, fontFamily: HL }}>
                          {place.attributes?.category ?? 'Dining'}
                        </span>
                        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1" style={{ fontFamily: HL }}>
                          {place.attributes?.name || 'Unnamed Place'}
                        </h3>
                        {place.attributes?.location && (
                          <div className="flex items-center gap-1 text-white/70 text-xs" style={{ fontFamily: BL }}>
                            <MapPin className="w-3 h-3 shrink-0" />{place.attributes.location}
                          </div>
                        )}
                        {rating > 0 && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3" fill={i < Math.round(rating) ? '#EAB308' : 'none'} stroke={i < Math.round(rating) ? '#EAB308' : 'rgba(255,255,255,0.4)'} />)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && !error && places.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6 bg-orange-50">
              <Utensils className="w-12 h-12 text-orange-500" />
            </div>
            <p className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: HL }}>No dining places found yet</p>
            <p className="text-gray-500 text-sm" style={{ fontFamily: BL }}>Local restaurants and cafes will be added soon. Check back!</p>
          </div>
        )}
      </div>
    </div>
  );
}
