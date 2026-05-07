'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Star, Utensils } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import { logger } from '@/lib/logger';
import FavoriteButton from '@/components/FavoriteButton';
import { COLORS } from '@/lib/constants';

interface DiningAttraction {
  id: string | number;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    rating?: number;
  };
  type: 'dining';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

export default function DiningPage() {
  const [places, setPlaces] = useState<DiningAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllAttractions()
      .then(data => setPlaces(data.filter((a: any) => a.type === 'dining') as DiningAttraction[]))
      .catch(err => {
        setError('Failed to load dining places');
        logger.error('Failed to load dining places:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-8">
          <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: COLORS.primary }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>🍽️ Dining</h1>
          <p className="text-xl text-gray-600">Taste the local flavors and culinary gems of Liliw, Laguna</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <motion.div key={i} variants={itemVariants}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 h-80 animate-pulse" />
            ))}
          </motion.div>
        )}

        {error && !loading && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <p className="text-red-700 font-semibold">Error loading dining places</p>
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {!loading && !error && places.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map(place => (
              <motion.div key={place.id} variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }} className="group h-full">
                <Link href={`/attractions/${place.id}`}>
                  <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col relative overflow-hidden cursor-pointer">
                    <FavoriteButton
                      attractionId={String(place.id)}
                      attractionName={place.attributes?.name || ''}
                      attractionType="dining"
                      attractionCategory={place.attributes?.category}
                      className="absolute top-4 right-4 z-20"
                    />
                    <div className="relative z-10 flex-1">
                      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        <Utensils className="w-4 h-4" />
                        Dining {place.attributes.category && `• ${place.attributes.category}`}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{place.attributes.name}</h2>
                      {place.attributes.location && (
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{place.attributes.location}</span>
                        </div>
                      )}
                      {place.attributes.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${
                              i < Math.round(place.attributes.rating!)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`} />
                          ))}
                        </div>
                      )}
                      {place.attributes.description && (
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                          {place.attributes.description}
                        </p>
                      )}
                    </div>
                    <motion.div whileHover="hover" className="inline-flex items-center font-semibold group/link" style={{ color: '#00BFB3' }}>
                      <span>View Details</span>
                      <motion.span variants={{ hover: { x: 5 } }} className="ml-2">→</motion.span>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && places.length === 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
              <Utensils className="w-12 h-12" style={{ color: '#00BFB3' }} />
            </div>
            <p className="text-xl text-gray-600 font-semibold mb-2">No dining places found yet</p>
            <p className="text-gray-500">Local restaurants and cafes will be added soon. Check back!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
