'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Phone, Clock, Globe, Users } from 'lucide-react';
import { getAllAttractions } from '@/lib/strapi';

interface Attraction {
  id: number;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    is_featured?: boolean;
    rating?: number;
    phone?: string;
    hours?: string;
    website?: string;
    best_for?: string;
  };
  type: 'heritage' | 'spot';
}

export default function AttractionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [attractionId, setAttractionId] = useState<string | null>(null);
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedAttractions, setRelatedAttractions] = useState<Attraction[]>([]);

  useEffect(() => {
    // Unwrap the params promise
    Promise.resolve(params).then(async (resolvedParams) => {
      setAttractionId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!attractionId) return;

    const fetchData = async () => {
      try {
        const allAttractions = await getAllAttractions();
        const current = allAttractions.find(a => String(a.id) === attractionId);
        
        if (!current) {
          setError('Attraction not found');
          return;
        }

        setAttraction(current);

        // Get related attractions (same category, different ID)
        const related = allAttractions
          .filter(
            a => 
              a.attributes.category === current.attributes.category && 
              a.id !== current.id
          )
          .slice(0, 3);
        
        setRelatedAttractions(related);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attraction');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attractionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-2xl mb-8" />
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-2 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-white" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/attractions" className="inline-flex items-center font-semibold" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Attractions
          </Link>
          <div className="mt-8 text-center">
            <p className="text-red-600 font-semibold">{error || 'Attraction not found'}</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Liliw</h1>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/attractions"
            className="inline-flex items-center font-semibold group text-sm sm:text-base"
            style={{ color: '#00BFB3' }}
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Attractions
          </Link>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-12"
        >
          {/* Category Badge */}
          <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-full font-semibold text-xs sm:text-sm" style={{ backgroundColor: '#00BFB3' }}>
            {attraction.type === 'heritage' ? '🏛️ Heritage Site' : '🏞️ Tourist Spot'} {attraction.attributes.category && `• ${attraction.attributes.category}`}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ color: '#0F1F3C' }}>{attraction.attributes.name}</h1>

          {/* Location & Rating */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            {attraction.attributes.location && (
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 text-sm sm:text-base">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00BFB3' }} />
                <span>{attraction.attributes.location}</span>
              </div>
            )}

            {attraction.attributes.rating && (
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-2xl ${i < Math.round(attraction.attributes.rating!) ? '⭐' : '☆'}`} />
                ))}
                <span className="text-lg font-semibold text-gray-600">{attraction.attributes.rating}/5</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description */}
        {attraction.attributes.description && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 sm:mb-12 text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed p-4 sm:p-6 rounded-lg border-l-4"
            style={{ backgroundColor: 'rgba(0, 191, 179, 0.05)', borderLeftColor: '#00BFB3' }}
          >
            {attraction.attributes.description}
          </motion.div>
        )}

        {/* Info Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-12"
        >
          {/* Contact Info */}
          {attraction.attributes.phone && (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00BFB3' }} />
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Phone</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700">{attraction.attributes.phone}</p>
            </div>
          )}

          {/* Hours */}
          {attraction.attributes.hours && (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00BFB3' }} />
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Hours</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700">{attraction.attributes.hours}</p>
            </div>
          )}

          {/* Website */}
          {attraction.attributes.website && (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00BFB3' }} />
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Website</h3>
              </div>
              <a
                href={attraction.attributes.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold break-all text-xs sm:text-sm"
                style={{ color: '#00BFB3' }}
              >
                {attraction.attributes.website}
              </a>
            </div>
          )}

          {/* Best For */}
          {attraction.attributes.best_for && (
            <div className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00BFB3' }} />
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Best For</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700">{attraction.attributes.best_for}</p>
            </div>
          )}
        </motion.div>

        {/* Related Attractions */}
        {relatedAttractions.length > 0 && (
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#0F1F3C' }}>Similar Attractions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedAttractions.map((related, idx) => (
                <motion.div
                  key={`${related.id}-${idx}`}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Link href={`/attractions/${related.id}`}>
                    <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition cursor-pointer h-full">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 transition" style={{ color: 'inherit' }}>
                        {related.attributes.name}
                      </h3>
                      {related.attributes.location && (
                        <p className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" style={{ color: '#00BFB3' }} />
                          {related.attributes.location}
                        </p>
                      )}
                      {related.attributes.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {related.attributes.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex gap-4 justify-center"
        >
          <Link
            href="/attractions"
            className="px-8 py-3 text-white font-semibold rounded-lg transition" style={{ backgroundColor: '#00BFB3' }}
          >
            Explore More Attractions
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Discover the Beauty of Liliw.</p>
        </div>
      </motion.footer>
    </div>
  );
}
