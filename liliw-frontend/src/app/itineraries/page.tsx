'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Users, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { getItineraries } from '@/lib/strapi';
import BookingForm from '@/components/BookingForm';

const DURATION_LABEL: Record<string, string> = {
  'half-day': '4 hours',
  'one-day': '8 hours',
  'two-day': '2 days',
  'heritage': 'Heritage Tour',
  'foodie': 'Food Tour',
  'family': 'Family Tour',
};

const DURATION_FILTER_LABELS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'half-day', label: 'Half-Day' },
  { key: 'one-day', label: 'Full Day' },
  { key: 'two-day', label: '2 Days' },
  { key: 'heritage', label: 'Heritage' },
  { key: 'foodie', label: 'Foodie' },
  { key: 'family', label: 'Family' },
];

const DIFFICULTY_CONFIG: Record<string, { label: string; cls: string }> = {
  easy:     { label: 'Easy',     cls: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', cls: 'bg-yellow-100 text-yellow-700' },
  difficult:{ label: 'Difficult',cls: 'bg-red-100 text-red-700' },
};

interface Itinerary {
  id: string;
  title: string;
  duration: string;
  difficulty: string;
  highlights: string[];
  price?: number;
  max_participants?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const cardVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Itinerary | null>(null);

  useEffect(() => {
    getItineraries().then((data: any[]) => {
      setItineraries(
        data.map((item: any) => {
          const a = item.attributes || item;
          return {
            id: String(item.id || item.documentId || Math.random()),
            title: a.title,
            duration: a.duration || 'half-day',
            difficulty: a.difficulty || 'easy',
            highlights: Array.isArray(a.highlights)
              ? a.highlights
              : Array.isArray(a.stops)
              ? a.stops
              : [],
            price: a.price || undefined,
            max_participants: a.max_participants || undefined,
          };
        })
      );
    }).finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all' ? itineraries : itineraries.filter((i) => i.duration === filter);

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F1F3C 0%, #1a3a5c 100%)' }} className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <h1 className="text-5xl font-bold text-white mb-3">Suggested Itineraries</h1>
            <p className="text-lg text-gray-300">Choose a curated tour and book your spot instantly</p>
          </motion.div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {DURATION_FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filter === key
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === key ? { backgroundColor: '#00BFB3' } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MapPin className="w-14 h-14 mb-4 opacity-30" style={{ color: '#00BFB3' }} />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              {itineraries.length === 0 ? 'No itineraries yet' : 'No itineraries for this filter'}
            </h3>
            <p className="text-gray-400 max-w-sm text-sm">
              {itineraries.length === 0
                ? 'Tour packages will appear here once published in the Strapi admin.'
                : 'Try selecting a different duration above.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {filtered.map((itinerary) => {
              const diff = DIFFICULTY_CONFIG[itinerary.difficulty] || { label: itinerary.difficulty, cls: 'bg-gray-100 text-gray-600' };
              const isExpanded = expanded === itinerary.id;
              return (
                <motion.div
                  key={itinerary.id}
                  variants={cardVariants}
                  layout
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{itinerary.title}</h3>
                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <Clock className="w-4 h-4" style={{ color: '#00BFB3' }} />
                            {DURATION_LABEL[itinerary.duration] || itinerary.duration}
                          </span>
                          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold ${diff.cls}`}>
                            {diff.label}
                          </span>
                          {itinerary.max_participants && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                              <Users className="w-4 h-4" />
                              Max {itinerary.max_participants}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {itinerary.price && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-medium">per person</p>
                            <p className="text-xl font-bold" style={{ color: '#00BFB3' }}>
                              ₱{Number(itinerary.price).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setBookingTarget(itinerary)}
                          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #00BFB3, #00A39E)', boxShadow: '0 4px 12px rgba(0,191,179,0.3)' }}
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </div>

                    {/* Highlights toggle */}
                    {itinerary.highlights.length > 0 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : itinerary.id)}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                        style={{ color: '#00BFB3' }}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-4 h-4" /> Hide highlights</>
                        ) : (
                          <><ChevronDown className="w-4 h-4" /> View highlights ({itinerary.highlights.length})</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expandable highlights */}
                  <AnimatePresence>
                    {isExpanded && itinerary.highlights.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4" style={{ backgroundColor: '#f8fafc' }}>
                          <ul className="space-y-2">
                            {itinerary.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: '#00BFB3' }}>→</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Travel tips — always visible once loaded */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
              <h4 className="text-base font-bold text-blue-900 mb-3">Best Time to Visit</h4>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                <li>• <strong>Dry Season:</strong> November to May</li>
                <li>• <strong>Festival Season:</strong> Check local schedules</li>
                <li>• <strong>Early Morning:</strong> Best for tsinelas workshops</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
              <h4 className="text-base font-bold text-green-900 mb-3">What to Bring</h4>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                <li>• Comfortable walking shoes</li>
                <li>• Sun protection &amp; lightweight clothing</li>
                <li>• Camera &amp; reusable water bottle</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {bookingTarget && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setBookingTarget(null)}
            />

            {/* Drawer / modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4"
            >
              <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={() => setBookingTarget(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>

                <BookingForm
                  tourName={bookingTarget.title}
                  tourId={bookingTarget.id}
                  price={bookingTarget.price || 0}
                  maxParticipants={bookingTarget.max_participants || 20}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
