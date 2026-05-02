'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Clock, Users, X, MapPin, Star,
  CheckCircle, XCircle, Navigation, ChevronRight,
  Calendar, ArrowRight,
} from 'lucide-react';
import { getItineraries } from '@/lib/strapi';
import BookingForm from '@/components/BookingForm';

/* ─────────────────────── helpers ─────────────────────────── */

function blocksToText(blocks: any): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .flatMap((b: any) =>
      Array.isArray(b.children) ? b.children.map((c: any) => c.text || '') : []
    )
    .join(' ')
    .trim();
}

function normaliseStops(raw: any): { label: string; detail?: string; time?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) =>
    typeof s === 'string'
      ? { label: s }
      : {
          label:  s.activity || s.name || s.title || String(s),
          detail: s.location || s.description || undefined,
          time:   s.time     || undefined,
        }
  );
}

function getPhotoUrl(p: any): string | null {
  if (!p) return null;
  return p.url || p.data?.attributes?.url || null;
}

/* ─────────────────────── config ──────────────────────────── */

const DURATION_LABEL: Record<string, string> = {
  'half-day': '4 hours', 'one-day': '8 hours', 'two-day': '2 days',
  heritage: 'Heritage', foodie: 'Foodie', family: 'Family',
};
const FILTER_TABS = [
  { key: 'all', label: 'All' }, { key: 'half-day', label: 'Half-Day' },
  { key: 'one-day', label: 'Full Day' }, { key: 'two-day', label: '2 Days' },
  { key: 'heritage', label: 'Heritage' }, { key: 'foodie', label: 'Foodie' },
  { key: 'family', label: 'Family' },
];
const DIFF: Record<string, { label: string; card: string; badge: string }> = {
  easy:      { label: 'Easy',      card: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  moderate:  { label: 'Moderate',  card: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  difficult: { label: 'Difficult', card: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
};

/* ─────────────────────── types ───────────────────────────── */

interface Stop { label: string; detail?: string; time?: string }
interface Itinerary {
  id: string; title: string; duration: string; difficulty: string;
  description: string; stops: Stop[]; highlights: string[];
  included: string[]; not_included: string[]; meeting_point?: string;
  price?: number; max_participants?: number;
  cover_photo?: string | null; photos: string[];
}

/* ─────────────────────── sub-components ─────────────────── */

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) return null;
  return (
    <div>
      <div className="relative aspect-video rounded-xl overflow-hidden mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            <Image src={photos[active]} alt={`${title} photo ${active + 1}`} fill className="object-cover" />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActive(p => (p - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
            ><ChevronLeft className="w-4 h-4" /></button>
            <button
              onClick={() => setActive(p => (p + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
            ><ChevronRight className="w-4 h-4" /></button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === active ? 'border-teal-400' : 'border-transparent opacity-60 hover:opacity-90'}`}>
              <Image src={src} alt="" width={56} height={56} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail modal ─────────────────────────────────────────── */

function DetailModal({ itin, onClose, onBook }: {
  itin: Itinerary; onClose: () => void; onBook: () => void;
}) {
  const diff = DIFF[itin.difficulty] || { label: itin.difficulty, card: '', badge: 'bg-gray-100 text-gray-600' };

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      key="detail-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Hero */}
        <div className="relative flex-shrink-0" style={{ height: itin.cover_photo ? 220 : 0 }}>
          {itin.cover_photo && (
            <>
              <Image src={itin.cover_photo} alt={itin.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-14">
                <h2 className="text-2xl font-bold text-white leading-tight">{itin.title}</h2>
              </div>
            </>
          )}
        </div>

        {/* Close btn */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow transition"
        ><X className="w-4 h-4 text-gray-700" /></button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-28 space-y-7">

            {/* Title (no cover photo fallback) */}
            {!itin.cover_photo && (
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{itin.title}</h2>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-sm font-semibold px-3 py-1 rounded-full border border-teal-200">
                <Clock className="w-3.5 h-3.5" />{DURATION_LABEL[itin.duration] || itin.duration}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${diff.badge}`}>
                <Star className="w-3 h-3" />{diff.label}
              </span>
              {itin.max_participants && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5" />Max {itin.max_participants} pax
                </span>
              )}
              {itin.meeting_point && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                  <MapPin className="w-3.5 h-3.5" />{itin.meeting_point}
                </span>
              )}
            </div>

            {/* Description */}
            {itin.description && (
              <div>
                <SectionLabel>About this tour</SectionLabel>
                <p className="text-gray-600 text-sm leading-relaxed">{itin.description}</p>
              </div>
            )}

            {/* Photo gallery */}
            {itin.photos.length > 0 && (
              <div>
                <SectionLabel>Photo Gallery</SectionLabel>
                <PhotoGallery photos={itin.photos} title={itin.title} />
              </div>
            )}

            {/* Stops timeline */}
            {itin.stops.length > 0 && (
              <div>
                <SectionLabel icon={<Navigation className="w-4 h-4" style={{ color: '#00BFB3' }} />}>
                  Itinerary
                </SectionLabel>
                <ol className="relative border-l-2 border-teal-100 ml-3 space-y-5">
                  {itin.stops.map((s, i) => (
                    <li key={i} className="pl-6 relative">
                      <span
                        className="absolute -left-3.5 top-0 w-7 h-7 rounded-full border-2 border-white text-white text-xs font-bold flex items-center justify-center shadow"
                        style={{ backgroundColor: '#00BFB3' }}
                      >{i + 1}</span>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                          {s.time && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />{s.time}
                            </span>
                          )}
                        </div>
                        {s.detail && <p className="text-xs text-gray-500 mt-1">{s.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Highlights */}
            {itin.highlights.length > 0 && (
              <div>
                <SectionLabel>Highlights</SectionLabel>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itin.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                        <ArrowRight className="w-3 h-3" style={{ color: '#00BFB3' }} />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Included / not included */}
            {(itin.included.length > 0 || itin.not_included.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {itin.included.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Included</p>
                    <ul className="space-y-1.5">
                      {itin.included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {itin.not_included.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Not Included</p>
                    <ul className="space-y-1.5">
                      {itin.not_included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer CTA */}
        <div
          className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,.07)' }}
        >
          <div>
            {itin.price ? (
              <>
                <p className="text-2xl font-bold text-gray-900">₱{Number(itin.price).toLocaleString()}</p>
                <p className="text-xs text-gray-400">per person</p>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">Contact for pricing</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBook}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.4)' }}
          >
            <Calendar className="w-4 h-4" /> Book This Tour
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{children}</h3>
    </div>
  );
}

/* ─────────────────────── page ────────────────────────────── */

export default function ItinerariesPage() {
  const [itineraries, setItineraries]     = useState<Itinerary[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');
  const [detail, setDetail]               = useState<Itinerary | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Itinerary | null>(null);

  useEffect(() => {
    getItineraries().then((data: any[]) => {
      setItineraries(data.map((item: any) => {
        const a = item.attributes || item;
        const rawPhotos = a.photos?.data || a.photos || [];
        const photoList: string[] = (Array.isArray(rawPhotos) ? rawPhotos : [])
          .map((p: any) => getPhotoUrl(p.attributes || p))
          .filter(Boolean) as string[];
        return {
          id:               String(item.id || item.documentId || Math.random()),
          title:            a.title,
          duration:         a.duration   || 'half-day',
          difficulty:       a.difficulty || 'easy',
          description:      blocksToText(a.description),
          stops:            normaliseStops(a.stops),
          highlights:       Array.isArray(a.highlights)    ? a.highlights    : [],
          included:         Array.isArray(a.included)      ? a.included      : [],
          not_included:     Array.isArray(a.not_included)  ? a.not_included  : [],
          meeting_point:    a.meeting_point || undefined,
          price:            a.price           || undefined,
          max_participants: a.max_participants || undefined,
          cover_photo:      getPhotoUrl(a.cover_photo?.data?.attributes || a.cover_photo),
          photos:           photoList,
        };
      }));
    }).finally(() => setLoading(false));
  }, []);

  const handleBook = useCallback(() => {
    if (detail) { setBookingTarget(detail); setDetail(null); }
  }, [detail]);

  const filtered = filter === 'all' ? itineraries : itineraries.filter(i => i.duration === filter);

  return (
    <div className="min-h-screen bg-[#f8fafc]" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <h1 className="text-5xl font-bold text-white mb-2">Suggested Itineraries</h1>
            <p className="text-lg text-gray-300">Curated experiences — pick one and book instantly</p>
          </motion.div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {FILTER_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filter === key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === key ? { backgroundColor: '#00BFB3' } : {}}
              >{label}</button>
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
          <div className="flex flex-col items-center py-24 text-center">
            <MapPin className="w-14 h-14 mb-4 opacity-25" style={{ color: '#00BFB3' }} />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              {itineraries.length === 0 ? 'No itineraries yet' : 'No matches for this filter'}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm">
              {itineraries.length === 0
                ? 'Publish tour packages in Strapi admin and they will appear here.'
                : 'Try a different duration filter above.'}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {filtered.map(itin => {
              const diff = DIFF[itin.difficulty] || { label: itin.difficulty, card: '', badge: 'bg-gray-100 text-gray-600' };
              return (
                <motion.div
                  key={itin.id}
                  variants={{ hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.38 } } }}
                  className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => setDetail(itin)}
                >
                  {/* Cover photo */}
                  <div className="relative h-44 bg-gradient-to-br from-teal-100 to-cyan-50 flex-shrink-0">
                    {itin.cover_photo ? (
                      <Image src={itin.cover_photo} alt={itin.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <MapPin className="w-16 h-16" style={{ color: '#00BFB3' }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Floating price */}
                    {itin.price && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow">
                        <p className="text-xs text-gray-400 leading-none">from</p>
                        <p className="text-base font-bold leading-tight" style={{ color: '#00BFB3' }}>
                          ₱{Number(itin.price).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Photo count badge */}
                    {itin.photos.length > 0 && (
                      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-lg">
                        {itin.photos.length} photos
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-teal-600 transition-colors">
                      {itin.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                        <Clock className="w-3.5 h-3.5" style={{ color: '#00BFB3' }} />
                        {DURATION_LABEL[itin.duration] || itin.duration}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${diff.badge}`}>
                        {diff.label}
                      </span>
                      {itin.stops.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Navigation className="w-3 h-3" />{itin.stops.length} stops
                        </span>
                      )}
                    </div>

                    {itin.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">{itin.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 font-medium">
                        {itin.max_participants ? `Max ${itin.max_participants} pax` : 'Open group'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#00BFB3' }}>
                        View details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
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
              <h4 className="text-sm font-bold text-blue-900 mb-3">Best Time to Visit</h4>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                <li>• <strong>Dry Season:</strong> November to May</li>
                <li>• <strong>Festival Season:</strong> Check local schedules</li>
                <li>• <strong>Early Morning:</strong> Best for tsinelas workshops</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
              <h4 className="text-sm font-bold text-green-900 mb-3">What to Bring</h4>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                <li>• Comfortable walking shoes</li>
                <li>• Sun protection &amp; light clothing</li>
                <li>• Camera &amp; reusable water bottle</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <DetailModal
            itin={detail}
            onClose={() => setDetail(null)}
            onBook={handleBook}
          />
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {bookingTarget && (
          <motion.div
            key="booking-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBookingTarget(null)} />
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
              ><X className="w-4 h-4 text-gray-600" /></button>
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
