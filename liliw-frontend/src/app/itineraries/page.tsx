'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Users, X, MapPin, ChevronDown, ChevronUp, Star, Navigation } from 'lucide-react';
import { getItineraries } from '@/lib/strapi';
import BookingForm from '@/components/BookingForm';

/* ── helpers ─────────────────────────────────────────────── */

function blocksToText(blocks: any): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .flatMap((block: any) =>
      Array.isArray(block.children) ? block.children.map((c: any) => c.text || '') : []
    )
    .join(' ')
    .trim();
}

function normaliseStops(raw: any): { label: string; detail?: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s: any) =>
      typeof s === 'string'
        ? { label: s }
        : { label: s.activity || s.name || s.title || String(s), detail: s.time || s.location || s.description || undefined }
    );
  }
  return [];
}

/* ── config ──────────────────────────────────────────────── */

const DURATION_LABEL: Record<string, string> = {
  'half-day': '4 hours', 'one-day': '8 hours', 'two-day': '2 days',
  'heritage': 'Heritage Tour', 'foodie': 'Food Tour', 'family': 'Family Tour',
};
const FILTER_TABS = [
  { key: 'all', label: 'All' }, { key: 'half-day', label: 'Half-Day' },
  { key: 'one-day', label: 'Full Day' }, { key: 'two-day', label: '2 Days' },
  { key: 'heritage', label: 'Heritage' }, { key: 'foodie', label: 'Foodie' },
  { key: 'family', label: 'Family' },
];
const DIFFICULTY: Record<string, { label: string; cls: string; star: string }> = {
  easy:      { label: 'Easy',      cls: 'bg-green-100 text-green-700',  star: 'text-green-500' },
  moderate:  { label: 'Moderate',  cls: 'bg-yellow-100 text-yellow-700', star: 'text-yellow-500' },
  difficult: { label: 'Difficult', cls: 'bg-red-100 text-red-700',      star: 'text-red-500' },
};

interface Stop { label: string; detail?: string }
interface Itinerary {
  id: string; title: string; duration: string; difficulty: string;
  highlights: string[]; stops: Stop[]; description: string;
  price?: number; max_participants?: number; cover_photo?: string | null;
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35 } },
};

/* ── page ────────────────────────────────────────────────── */

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Itinerary | null>(null);

  useEffect(() => {
    getItineraries().then((data: any[]) => {
      setItineraries(
        data.map((item: any) => {
          const a = item.attributes || item;
          const photoUrl =
            a.cover_photo?.url ||
            a.cover_photo?.data?.attributes?.url ||
            null;
          return {
            id:              String(item.id || item.documentId || Math.random()),
            title:           a.title,
            duration:        a.duration   || 'half-day',
            difficulty:      a.difficulty || 'easy',
            highlights:      Array.isArray(a.highlights) ? a.highlights : [],
            stops:           normaliseStops(a.stops),
            description:     blocksToText(a.description),
            price:           a.price           || undefined,
            max_participants:a.max_participants || undefined,
            cover_photo:     photoUrl,
          };
        })
      );
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? itineraries : itineraries.filter(i => i.duration === filter);

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
            <p className="text-lg text-gray-300">Curated tour experiences — book your spot in seconds</p>
          </motion.div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filter === key ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === key ? { backgroundColor: '#00BFB3' } : {}}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MapPin className="w-14 h-14 mb-4 opacity-30" style={{ color: '#00BFB3' }} />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              {itineraries.length === 0 ? 'No itineraries yet' : 'No matches for this filter'}
            </h3>
            <p className="text-gray-400 max-w-sm text-sm">
              {itineraries.length === 0
                ? 'Tour packages will appear here once published in Strapi admin.'
                : 'Try selecting a different duration above.'}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-6"
          >
            {filtered.map((itin) => {
              const diff       = DIFFICULTY[itin.difficulty] || { label: itin.difficulty, cls: 'bg-gray-100 text-gray-600', star: 'text-gray-400' };
              const isExpanded = expanded === itin.id;
              const hasDetails = itin.highlights.length > 0 || itin.stops.length > 0 || itin.description;

              return (
                <motion.div
                  key={itin.id}
                  variants={cardVariants}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Cover photo */}
                  {itin.cover_photo && (
                    <div className="relative h-44 w-full">
                      <Image src={itin.cover_photo} alt={itin.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Top row: title + Book Now */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{itin.title}</h3>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <Clock className="w-4 h-4" style={{ color: '#00BFB3' }} />
                            {DURATION_LABEL[itin.duration] || itin.duration}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${diff.cls}`}>
                            <Star className={`w-3 h-3 ${diff.star}`} />
                            {diff.label}
                          </span>
                          {itin.max_participants && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                              <Users className="w-3.5 h-3.5" /> Max {itin.max_participants} pax
                            </span>
                          )}
                        </div>

                        {/* Description excerpt */}
                        {itin.description && (
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{itin.description}</p>
                        )}
                      </div>

                      {/* Price + Book button */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0">
                        {itin.price ? (
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-medium">per person</p>
                            <p className="text-2xl font-bold" style={{ color: '#00BFB3' }}>
                              ₱{Number(itin.price).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Contact for price</p>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setBookingTarget(itin)}
                          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold whitespace-nowrap"
                          style={{ background: 'linear-gradient(135deg,#00BFB3,#00A39E)', boxShadow: '0 4px 14px rgba(0,191,179,.32)' }}
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    {hasDetails && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : itin.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors mt-1"
                        style={{ color: '#00BFB3' }}
                      >
                        {isExpanded
                          ? <><ChevronUp className="w-4 h-4" /> Hide details</>
                          : <><ChevronDown className="w-4 h-4" /> View full details</>}
                      </button>
                    )}
                  </div>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-6 space-y-6">

                          {/* Full description */}
                          {itin.description && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">About this tour</h4>
                              <p className="text-gray-700 text-sm leading-relaxed">{itin.description}</p>
                            </div>
                          )}

                          {/* Stops — numbered timeline */}
                          {itin.stops.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <Navigation className="w-4 h-4" style={{ color: '#00BFB3' }} /> Itinerary Stops
                              </h4>
                              <ol className="space-y-3">
                                {itin.stops.map((s, i) => (
                                  <li key={i} className="flex gap-3">
                                    <span
                                      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                                      style={{ backgroundColor: '#00BFB3' }}
                                    >{i + 1}</span>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                                      {s.detail && <p className="text-xs text-gray-500 mt-0.5">{s.detail}</p>}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Highlights */}
                          {itin.highlights.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Highlights</h4>
                              <ul className="space-y-2">
                                {itin.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: '#00BFB3' }}>✓</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* CTA inside panel */}
                          <div className="pt-2 flex items-center justify-between">
                            <div>
                              {itin.price && (
                                <p className="text-base font-bold text-gray-800">
                                  ₱{Number(itin.price).toLocaleString()}
                                  <span className="text-xs font-normal text-gray-400 ml-1">/ person</span>
                                </p>
                              )}
                              {itin.max_participants && (
                                <p className="text-xs text-gray-400">Max {itin.max_participants} participants</p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setBookingTarget(itin)}
                              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                              style={{ background: 'linear-gradient(135deg,#00BFB3,#00A39E)', boxShadow: '0 4px 14px rgba(0,191,179,.32)' }}
                            >
                              Book This Tour
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Travel tips */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
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
          <motion.div
            key="booking-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingTarget(null)} />
            <motion.div
              initial={{ y: 64, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 64, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] overflow-y-auto z-10"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
