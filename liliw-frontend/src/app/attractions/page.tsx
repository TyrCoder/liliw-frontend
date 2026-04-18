'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Layers, Star } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';
import SearchBar from '@/components/SearchBar';

interface Attraction {
  id: number;
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
      className="p-6 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 h-80"
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter attractions based on search, category, and type
  useEffect(() => {
    let filtered = attractions;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        a =>
          a.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.attributes.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 shadow-lg"
        style={{ backgroundColor: '#0F1F3C' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white">
            Liliw
          </h1>
          <div className="flex items-center gap-6 flex-wrap">
            <Link href="/" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Home
            </Link>
            <Link href="/about" className="text-white hover:opacity-80 font-semibold transition text-sm">
              About
            </Link>
            <Link href="/attractions" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Attractions
            </Link>
            <Link href="/culture" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Culture
            </Link>
            <Link href="/itineraries" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Tours
            </Link>
            <Link href="/news" className="text-white hover:opacity-80 font-semibold transition text-sm">
              News
            </Link>
            <Link href="/faq" className="text-white hover:opacity-80 font-semibold transition text-sm">
              FAQ
            </Link>
            <Link href="/community" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Community
            </Link>
          </div>
        </div>
      </motion.nav>

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
            {filteredAttractions.map((attraction, idx) => (
              <motion.div
                key={`${attraction.id}-${idx}`}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group h-full"
              >
                <Link href={`/attractions/${attraction.id}`}>
                  <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col relative overflow-hidden cursor-pointer">

                    <div className="relative z-10 flex-1">
                      {/* Category Badge */}
                      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#00BFB3' }}>
                        <Layers className="w-4 h-4" />
                        {attraction.type === 'heritage' ? 'Heritage' : 'Tourist Spot'} {attraction.attributes?.category && `• ${attraction.attributes.category}`}
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 transition-colors" style={{ color: 'inherit' }}>
                        {attraction.attributes?.name || 'Unnamed Attraction'}
                      </h2>

                      {/* Location */}
                      {attraction.attributes?.location && (
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{attraction.attributes.location}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {attraction.attributes?.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(attraction.attributes?.rating!)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {attraction.attributes?.description && (
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                          {attraction.attributes.description}
                        </p>
                      )}
                    </div>

                    {/* Learn More Link */}
                    <motion.div
                      whileHover="hover"
                      className="inline-flex items-center font-semibold group/link"
                      style={{ color: '#00BFB3' }}
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
