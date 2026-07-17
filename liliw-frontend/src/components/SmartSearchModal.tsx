'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star, ChevronRight, Utensils, Landmark, CalendarDays, BookOpen, Newspaper, Map } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAlgolia, SearchResult } from '@/lib/algolia';
import { stripHtml } from '@/lib/text';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const QUICK_LINKS = [
  { href: '/attractions', icon: MapPin,       label: 'Attractions',  color: '#1565C0' },
  { href: '/dining',      icon: Utensils,     label: 'Dining',       color: '#F97316' },
  { href: '/heritage',    icon: Landmark,     label: 'Heritage',     color: '#8B5CF6' },
  { href: '/news',        icon: Newspaper,    label: 'News',         color: '#EAB308' },
  { href: '/itineraries', icon: CalendarDays, label: 'Itineraries',  color: '#22C55E' },
  { href: '/stories',     icon: BookOpen,     label: 'Stories',      color: '#EC4899' },
  { href: '/map',         icon: Map,          label: 'Map',          color: '#0D9488' },
];

const TYPE_META: Record<string, { label: string; bg: string; text: string }> = {
  heritage: { label: 'Heritage',   bg: '#EDE9FE', text: '#6D28D9' },
  spot:     { label: 'Attraction', bg: '#DBEAFE', text: '#1D4ED8' },
  dining:   { label: 'Dining',     bg: '#FFEDD5', text: '#C2410C' },
  faq:      { label: 'FAQ',        bg: '#F3E8FF', text: '#7C3AED' },
  event:    { label: 'Event',      bg: '#FEE2E2', text: '#B91C1C' },
  news:     { label: 'News',       bg: '#FEF9C3', text: '#A16207' },
  itinerary:{ label: 'Itinerary',  bg: '#DCFCE7', text: '#15803D' },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-3 h-3" fill={i <= rating ? '#F5C518' : 'none'} stroke={i <= rating ? '#F5C518' : '#D1D5DB'} />
      ))}
      <span className="text-xs ml-1" style={{ color: '#6B7280', fontFamily: BL }}>{rating}/5</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, bg: '#F3F4F6', text: '#374151' };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.text, fontFamily: HL }}>
      {meta.label}
    </span>
  );
}

interface Props { onClose?: () => void; }

export default function SmartSearchModal({ onClose }: Props) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen]   = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        setResults(await searchAlgolia(query));
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => { setIsOpen(false); onClose?.(); };

  const attractions = results.filter(r => r.type === 'spot' || r.type === 'heritage');
  const others      = results.filter(r => r.type !== 'spot' && r.type !== 'heritage');
  const hasResults  = results.length > 0;
  const searched    = query.trim().length > 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}>

          <motion.div initial={{ scale: 0.96, opacity: 0, y: -16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -16 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 80px)' }}>

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <Search className="w-5 h-5 shrink-0" style={{ color: '#1565C0' }} />
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search heritage sites, spots, dining, events, FAQs..."
                className="flex-1 outline-none text-base text-gray-800"
                style={{ fontFamily: BL }} />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-gray-100 transition shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition shrink-0">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px - 56px - 40px)' }}>

              {/* Loading */}
              {loading && (
                <div className="py-10 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400" style={{ fontFamily: BL }}>Searching...</p>
                </div>
              )}

              {/* No results */}
              {!loading && searched && !hasResults && (
                <div className="py-12 text-center">
                  <p className="font-semibold text-gray-700 mb-1" style={{ fontFamily: HL }}>No results for "{query}"</p>
                  <p className="text-sm text-gray-400" style={{ fontFamily: BL }}>Try different keywords or browse below</p>
                </div>
              )}

              {/* Search results: Attractions first */}
              {!loading && hasResults && (
                <div className="pb-4">

                  {/* Attractions section */}
                  {attractions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#1565C0' }} />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1565C0', fontFamily: HL }}>
                          Attractions
                        </span>
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontFamily: HL }}>
                          {attractions.length}
                        </span>
                      </div>
                      <div className="px-3 space-y-1.5">
                        {attractions.map((r, idx) => (
                          <motion.div key={r.objectID} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                            <Link href={r.url || '/attractions'} onClick={handleClose}>
                              <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                                  <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 truncate" style={{ fontFamily: HL }}>{r.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {r.location && (
                                      <span className="text-xs text-gray-400 flex items-center gap-0.5" style={{ fontFamily: BL }}>
                                        <MapPin className="w-2.5 h-2.5" />{r.location}
                                      </span>
                                    )}
                                    {r.rating ? <StarRow rating={r.rating} /> : null}
                                  </div>
                                </div>
                                <TypeBadge type={r.type} />
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other results section */}
                  {others.length > 0 && (
                    <div className={attractions.length > 0 ? 'mt-4 border-t border-gray-100 pt-2' : ''}>
                      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
                        <Search className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: HL }}>
                          Other Results
                        </span>
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500" style={{ fontFamily: HL }}>
                          {others.length}
                        </span>
                      </div>
                      <div className="px-3 space-y-1">
                        {others.map((r, idx) => (
                          <motion.div key={r.objectID} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                            <Link href={r.url || '/'} onClick={handleClose}>
                              <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                                <div className="mt-0.5">
                                  <TypeBadge type={r.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 truncate text-sm" style={{ fontFamily: HL }}>{r.name}</p>
                                  {r.description && (
                                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5" style={{ fontFamily: BL }}>{stripHtml(r.description)}</p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors mt-0.5" />
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Idle state — quick links */}
              {!loading && !searched && (
                <div className="px-4 py-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: HL }}>Quick Access</p>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_LINKS.map(link => {
                      const Icon = link.icon;
                      return (
                        <Link key={link.href} href={link.href} onClick={handleClose}>
                          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 text-center group">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: link.color + '18' }}>
                              <Icon className="w-4 h-4" style={{ color: link.color }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700 transition-colors leading-tight" style={{ fontFamily: BL }}>
                              {link.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-5" style={{ fontFamily: BL }}>Type at least 3 characters to search</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400" style={{ fontFamily: BL }}>
                Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">ESC</kbd> to close
              </p>
              {hasResults && (
                <p className="text-xs text-gray-400" style={{ fontFamily: BL }}>{results.length} result{results.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
