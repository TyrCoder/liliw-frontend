'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Layers, Star } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import { logger } from '@/lib/logger';
import { fuzzyMatch } from '@/lib/fuzzySearch';
import SearchBar from '@/components/SearchBar';
import { COLORS } from '@/lib/constants';
import FavoriteButton from '@/components/FavoriteButton';

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
  type: 'heritage' | 'spot' | 'dining';
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

const skeletonVariants = {
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

function SkeletonCard() {
  return (
    <motion.div
      variants={skeletonVariants}
      animate="pulse"
      className="p-6 rounded-2xl bg-linear-to-br from-gray-200 to-gray-300 h-80"
    />
  );
}

export default function AttractionsPage() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [filteredAttractions, setFilteredAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllAttractions();
        setAttractions(data);
        setFilteredAttractions(data);
      } catch (err) {
        setError('Failed to load attractions');
        logger.error('Failed to load attractions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter attractions based on search, category, and type
  useEffect(() => {
    let filtered = attractions;

    // Search filter (fuzzy — tolerates typos)
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        a =>
          fuzzyMatch(a.attributes.name, searchQuery) ||
          fuzzyMatch(a.attributes.description ?? '', searchQuery) ||
          fuzzyMatch(a.attributes.location ?? '', searchQuery)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.attributes.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    setFilteredAttractions(filtered);
  }, [attractions, selectedCategory, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base"
            style={{ color: '#00BFB3' }}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>
            Attractions in Liliw
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Discover all the amazing places to visit and explore.
          </p>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Search & Filter Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 space-y-6"
        >
          {/* Search Input */}
          <SearchBar
            placeholder="Discover attractions by name or location..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            resultCount={filteredAttractions.length}
          />

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 font-semibold text-gray-700"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            >
              <option value="all">All Types</option>
              <option value="heritage">Heritage Sites</option>
              <option value="spot">Tourist Spots</option>
              <option value="dining">Dining & Food</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 font-semibold text-gray-700"
              style={{ '--tw-ring-color': '#00BFB3' } as any}
            >
              <option value="all">All Categories</option>
              <option value="historical">Historical</option>
              <option value="cultural">Cultural</option>
              <option value="natural">Natural</option>
              <option value="religious">Religious</option>
              <option value="scenic">Scenic</option>
            </select>

            {/* Clear Filters Button */}
            {(selectedType !== 'all' || selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-gray-600">
            Showing {filteredAttractions.length} of {attractions.length} attractions
          </p>
        </motion.div>
        {/* Loading State */}
        {loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
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
            <p className="text-red-700 font-semibold">Error loading attractions</p>
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Attractions Grid */}
        {!loading && !error && filteredAttractions.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAttractions.map((attraction, idx) => {
              const typeColors: Record<string, string> = { heritage: '#F59E0B', spot: '#3B82F6', dining: '#EF4444' };
              const typeLabels: Record<string, string> = { heritage: 'Heritage', spot: 'Tourist Spot', dining: 'Dining & Food' };
              const typeGradients: Record<string, string> = { heritage: 'from-amber-400 to-amber-600', spot: 'from-blue-400 to-blue-600', dining: 'from-red-400 to-red-600' };
              const badgeColor = typeColors[attraction.type] ?? '#00BFB3';
              const photos = attraction.attributes?.photos ?? [];
              const rawUrl = photos[0]?.formats?.medium?.url || photos[0]?.formats?.small?.url || photos[0]?.url;
              const coverUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${STRAPI_BASE}${rawUrl}`) : null;
              const rating = attraction.attributes?.rating ?? 0;

              return (
                <motion.div
                  key={`${attraction.id}-${idx}`}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group h-full"
                >
                  <Link href={`/attractions/${attraction.id}`}>
                    <div className="rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer">

                      {/* Cover image */}
                      <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${typeGradients[attraction.type] ?? 'from-teal-400 to-teal-600'}`}>
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={attraction.attributes?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Layers className="w-16 h-16 text-white" />
                          </div>
                        )}
                        {/* Dark overlay at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                        {/* Type badge bottom-left */}
                        <div
                          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: badgeColor }}
                        >
                          <Layers className="w-3 h-3" />
                          {typeLabels[attraction.type] ?? attraction.type}
                        </div>

                        {/* Favorite button top-right */}
                        <FavoriteButton
                          attractionId={String(attraction.id)}
                          attractionName={attraction.attributes?.name || ''}
                          attractionType={attraction.type}
                          attractionCategory={attraction.attributes?.category}
                          className="absolute top-3 right-3 z-20"
                        />
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h2 className="text-lg font-bold mb-1.5 line-clamp-2 leading-snug" style={{ color: '#0F1F3C' }}>
                          {attraction.attributes?.name || 'Unnamed Attraction'}
                        </h2>

                        {attraction.attributes?.location && (
                          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs truncate">{attraction.attributes.location}</span>
                          </div>
                        )}

                        {rating > 0 && (
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? '#F59E0B' : 'none'} stroke={i < Math.round(rating) ? '#F59E0B' : '#d1d5db'} />
                            ))}
                          </div>
                        )}

                        {attraction.attributes?.description && (
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
                            {attraction.attributes.description}
                          </p>
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
        {!loading && !error && attractions.length > 0 && filteredAttractions.length === 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#00BFB3' }} />
            </div>
            <p className="text-xl text-gray-600 font-semibold mb-2">No attractions match your filters</p>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-6 py-2 text-white rounded-lg font-semibold transition" style={{ backgroundColor: '#00BFB3' }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* No Data State */}
        {!loading && !error && attractions.length === 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#00BFB3' }} />
            </div>
            <p className="text-xl text-gray-600 font-semibold mb-2">No attractions found</p>
            <p className="text-gray-500">
              Check back soon for more amazing places to explore!
            </p>
          </motion.div>
        )}
      </div>

    </div>
  );
}
