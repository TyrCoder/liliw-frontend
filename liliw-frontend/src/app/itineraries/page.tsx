'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Users } from 'lucide-react';
import { getItineraries } from '@/lib/strapi';

const FALLBACK = [
  { title: 'Half-Day Tsinelas & Heritage Experience', duration: 'half-day', difficulty: 'easy', highlights: ['Visit tsinelas workshops and meet local craftspeople', 'Tour heritage church and historical district', 'Sample local snacks and refreshments', 'Browse and purchase authentic tsinelas'] },
  { title: '1-Day Cultural Immersion Tour', duration: 'one-day', difficulty: 'moderate', highlights: ['Full-day workshop experience in tsinelas-making', 'Heritage site tours (churches, old buildings)', 'Local lunch at traditional restaurant', 'Visit artisan galleries and creative spaces'] },
  { title: '2-Day Nature & Heritage Adventure', duration: 'two-day', difficulty: 'moderate', highlights: ['Day 1: Heritage tours, cultural exploration', 'Overnight stay in local accommodations', 'Day 2: Nature activities (cold springs, scenic hikes)', 'Farm tourism and agricultural activities'] },
];

const DURATION_LABEL: Record<string, string> = {
  'half-day': '4 hours', 'one-day': '8 hours', 'two-day': '2 days',
  'heritage': 'Heritage Tour', 'foodie': 'Food Tour', 'family': 'Family Tour',
};

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  difficult: 'bg-red-100 text-red-700',
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<any[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItineraries().then((data) => {
      if (data.length > 0) {
        setItineraries(data.map((item: any) => {
          const a = item.attributes || item;
          return {
            title: a.title,
            duration: a.duration || 'half-day',
            difficulty: a.difficulty || 'easy',
            highlights: Array.isArray(a.highlights) ? a.highlights : (Array.isArray(a.stops) ? a.stops : []),
            description: a.description,
          };
        }));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>Suggested Itineraries</h1>
            <p className="text-xl text-gray-600">Explore Liliw with our curated tour experiences</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-12">
            <div className="space-y-6">
              {itineraries.map((itinerary, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="p-8 rounded-2xl bg-white border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: '#00BFB3' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{itinerary.title}</h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-5 h-5" style={{ color: '#00BFB3' }} />
                          <span className="font-semibold">{DURATION_LABEL[itinerary.duration] || itinerary.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" style={{ color: '#00BFB3' }} />
                          <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${DIFFICULTY_CLASS[itinerary.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                            {itinerary.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {itinerary.highlights?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">✓ Highlights:</h4>
                      <ul className="space-y-2">
                        {itinerary.highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700">
                            <span className="font-bold mt-1" style={{ color: '#00BFB3' }}>→</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button className="mt-6 px-6 py-2 text-white font-semibold rounded-lg transition" style={{ backgroundColor: '#00BFB3' }}>
                    Learn More & Book
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-16 space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">💡 Travel Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-900 mb-3">Best Time to Visit</h4>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• <strong>Dry Season:</strong> November to May</li>
                    <li>• <strong>Festival Season:</strong> Check local schedules</li>
                    <li>• <strong>Early Morning:</strong> Best for tsinelas workshops</li>
                  </ul>
                </div>
                <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="text-lg font-bold text-green-900 mb-3">What to Bring</h4>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Comfortable walking shoes</li>
                    <li>• Sun protection</li>
                    <li>• Lightweight clothing</li>
                    <li>• Camera</li>
                    <li>• Reusable water bottle</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
