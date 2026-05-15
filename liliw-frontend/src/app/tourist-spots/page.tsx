'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Layers, Star } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import { COLORS } from '@/lib/constants';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

interface Attraction {
  id: string | number;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    is_featured?: boolean;
    rating?: number;
    photos?: Array<{ url: string; formats?: any }>;
  };
  type: 'heritage' | 'spot';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

export default function TouristSpotsPage() {
  const [spots, setSpots] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/strapi/attractions');
        const json = await res.json();
        setSpots((json.data ?? []).filter((a: any) => a.type === 'spot'));
      } catch (err) {
        setError('Failed to load tourist spots');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center font-semibold mb-6 group" style={{ color: COLORS.primary }}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>Tourist Spots</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Explore the natural beauty and scenic destinations in Liliw</p>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Loading State */}
        {loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 h-80 animate-pulse"
              />
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg"
          >
            <p className="text-red-700 font-semibold">Error loading tourist spots</p>
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Tourist Spots Grid */}
        {!loading && !error && spots.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {spots.map((spot) => {
              const rawUrl = spot.attributes?.photos?.[0]?.formats?.medium?.url || spot.attributes?.photos?.[0]?.formats?.small?.url || spot.attributes?.photos?.[0]?.url;
              const coverUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${STRAPI_BASE}${rawUrl}`) : null;
              const rating = spot.attributes?.rating ?? 0;
              return (
                <motion.div
                  key={spot.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group h-full"
                >
                  <Link href={`/attractions/${spot.id}`}>
                    <div className="rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
                        {coverUrl ? (
                          <img src={coverUrl} alt={spot.attributes?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Layers className="w-16 h-16 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-blue-500">
                          <Layers className="w-3 h-3" /> Tourist Spot
                        </div>
                        <FavoriteButton attractionId={String(spot.id)} attractionName={spot.attributes?.name || ''} attractionType="spot" attractionCategory={spot.attributes?.category} className="absolute top-3 right-3 z-20" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h2 className="text-lg font-bold mb-1.5 line-clamp-2 leading-snug" style={{ color: '#0F1F3C' }}>{spot.attributes.name}</h2>
                        {spot.attributes.location && (
                          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="text-xs truncate">{spot.attributes.location}</span>
                          </div>
                        )}
                        {rating > 0 && (
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? '#F59E0B' : 'none'} stroke={i < Math.round(rating) ? '#F59E0B' : '#d1d5db'} />)}
                          </div>
                        )}
                        {spot.attributes.description && (
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">{spot.attributes.description}</p>
                        )}
                        <div className="inline-flex items-center font-semibold text-sm gap-1" style={{ color: '#00BFB3' }}>
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

        {/* Empty State */}
        {!loading && !error && spots.length === 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#00BFB3' }} />
            </div>
            <p className="text-xl text-gray-600 font-semibold mb-2">No tourist spots found yet</p>
            <p className="text-gray-500">
              Check back soon! Tourist spots featuring natural beauty will be added soon.
            </p>
          </motion.div>
        )}
      </div>

    </div>
  );
}
