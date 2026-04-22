'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Layers, Star } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import { logger } from '@/lib/logger';

interface Attraction {
  id: string | number;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    is_featured?: boolean;
    rating?: number;
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

export default function HeritageHeritagePages() {
  const [heritage, setHeritage] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllAttractions();
        const heritageData = data.filter(a => a.type === 'heritage');
        setHeritage(heritageData);
      } catch (err) {
        setError('Failed to load heritage sites');
        logger.error('Failed to load heritage sites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Navigation */}
      {/* Removed - now in layout */}

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
            className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>🏛️ Heritage Sites</h1>
          <p className="text-xl text-gray-600">
            Discover the historical treasures and cultural landmarks of Liliw
          </p>
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
            <p className="text-red-700 font-semibold">Error loading heritage sites</p>
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Heritage Sites Grid */}
        {!loading && !error && heritage.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {heritage.map((site) => (
              <motion.div
                key={site.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group h-full"
              >
                <Link href={`/attractions/${site.id}`}>
                  <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col relative overflow-hidden cursor-pointer">

                    <div className="relative z-10 flex-1">
                      {/* Category Badge */}
                      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                        <Layers className="w-4 h-4" />
                        Heritage {site.attributes.category && `• ${site.attributes.category}`}
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-bold mb-2 transition-colors" style={{ color: '#00BFB3' }}>
                        {site.attributes.name}
                      </h2>

                      {/* Location */}
                      {site.attributes.location && (
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{site.attributes.location}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {site.attributes.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(site.attributes.rating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {site.attributes.description && (
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                          {site.attributes.description}
                        </p>
                      )}
                    </div>

                    {/* View Details Link */}
                    <motion.div
                      whileHover="hover"
                      className="inline-flex items-center font-semibold group/link" style={{ color: '#00BFB3' }}
                    >
                      <span>View Details</span>
                      <motion.span
                        variants={{
                          hover: { x: 5 },
                        }}
                        className="ml-2"
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && heritage.length === 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#00BFB3' }} />
            </div>
            <p className="text-xl text-gray-600 font-semibold mb-2">No heritage sites found yet</p>
            <p className="text-gray-500">
              Check back soon! Heritage sites will be added to showcase Liliw's rich cultural history.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gray-900 text-white py-12"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Discover the Beauty of Liliw.</p>
        </div>
      </motion.footer>
    </div>
  );
}
