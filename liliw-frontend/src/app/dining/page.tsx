'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Star, Utensils } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface DiningAttraction {
  id: string | number;
  attributes: { name: string; description?: string; location?: string; category?: string; rating?: number; photos?: Array<{ url: string; formats?: any }>; };
  type: 'dining';
}

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
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Explore</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Dining & Food</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>Taste the local flavors and culinary gems of Liliw, Laguna</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 pb-20">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-white animate-pulse h-72 border border-gray-100" />)}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, idx) => {
              const photos = place.attributes?.photos ?? [];
              const rawUrl = photos[0]?.formats?.medium?.url || photos[0]?.formats?.small?.url || photos[0]?.url;
              const coverUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${STRAPI_BASE}${rawUrl}`) : null;
              const rating = place.attributes?.rating ?? 0;
              return (
                <motion.div key={`${place.id}-${idx}`}
                  variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }} className="group h-full">
                  <Link href={`/attractions/${place.id}`}>
                    <div className="rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer editorial-card">
                      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #7B2000, #4A1000)' }}>
                        {coverUrl
                          ? <img src={coverUrl} alt={place.attributes?.name} className="w-full h-full object-cover card-img" />
                          : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Utensils className="w-16 h-16 text-white" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                          <Utensils className="w-3 h-3" /> Dining & Food
                        </div>
                        <FavoriteButton attractionId={String(place.id)} attractionName={place.attributes?.name || ''} attractionType="dining" attractionCategory={place.attributes?.category} className="absolute top-3 right-3 z-20" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="section-label mb-1" style={{ color: '#1565C0', fontSize: 11 }}>Dining</p>
                        <h2 className="font-bold mb-1.5 line-clamp-2 leading-snug text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>{place.attributes?.name || 'Unnamed Place'}</h2>
                        {place.attributes?.location && (
                          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs truncate" style={{ fontFamily: BL }}>{place.attributes.location}</span>
                          </div>
                        )}
                        {rating > 0 && (
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? '#F5C518' : 'none'} stroke={i < Math.round(rating) ? '#F5C518' : '#d1d5db'} />)}
                          </div>
                        )}
                        {place.attributes?.description && <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4" style={{ fontFamily: BL }}>{place.attributes.description}</p>}
                        <div className="inline-flex items-center font-semibold text-sm gap-1" style={{ color: '#1565C0', fontFamily: BL }}>
                          View Details <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                        </div>
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
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
              <Utensils className="w-12 h-12" style={{ color: '#0B3D91' }} />
            </div>
            <p className="text-xl font-semibold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>No dining places found yet</p>
            <p className="text-gray-500 text-sm" style={{ fontFamily: BL }}>Local restaurants and cafes will be added soon. Check back!</p>
          </div>
        )}
      </div>
    </div>
  );
}
