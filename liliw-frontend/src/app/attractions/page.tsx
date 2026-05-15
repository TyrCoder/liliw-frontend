'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Layers, Star, Search, X, Utensils } from 'lucide-react';
import { logger } from '@/lib/logger';
import { searchAlgolia } from '@/lib/algolia';
import FavoriteButton from '@/components/FavoriteButton';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface Attraction {
  id: string | number;
  attributes: { name: string; description?: string; location?: string; category?: string; is_featured?: boolean; rating?: number; photos?: Array<{ url: string; formats?: any }>; };
  type: 'heritage' | 'spot' | 'dining';
}

const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage', spot: 'Tourist Spot', dining: 'Dining' };
const TYPE_ICONS: Record<string, React.ReactNode> = {
  heritage: <Layers className="w-3 h-3" />,
  spot: <MapPin className="w-3 h-3" />,
  dining: <Utensils className="w-3 h-3" />,
};

function coverUrl(photos: any[] = []): string | null {
  const p = photos[0];
  if (!p) return null;
  const url = p?.formats?.medium?.url || p?.formats?.small?.url || p?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

export default function AttractionsPage() {
  const [all, setAll]         = useState<Attraction[]>([]);
  const [results, setResults] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError]     = useState('');
  const [query, setQuery]     = useState('');
  const [selectedType, setSelectedType]         = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetch('/api/strapi/attractions')
      .then(r => r.json())
      .then(json => { const data: Attraction[] = json.data ?? []; setAll(data); setResults(data); })
      .catch(err => { logger.error('Failed to load attractions:', err); setError('Failed to load attractions'); })
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = useCallback(
    (base: Attraction[], type: string, cat: string) =>
      base.filter(a => (type === 'all' || a.type === type) && (cat === 'all' || a.attributes.category === cat)),
    [],
  );

  useEffect(() => {
    if (!query.trim()) { setResults(applyFilters(all, selectedType, selectedCategory)); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await searchAlgolia(query);
        if (cancelled) return;
        if (hits.length > 0) {
          const hitIds = new Set(hits.map(h => String(h.objectID)));
          const matched = all.filter(a => hitIds.has(String(a.id)));
          const local = matched.length > 0 ? matched : all.filter(a =>
            a.attributes.name.toLowerCase().includes(query.toLowerCase()) ||
            (a.attributes.description ?? '').toLowerCase().includes(query.toLowerCase())
          );
          setResults(applyFilters(local, selectedType, selectedCategory));
        } else {
          const fallback = all.filter(a =>
            a.attributes.name.toLowerCase().includes(query.toLowerCase()) ||
            (a.attributes.description ?? '').toLowerCase().includes(query.toLowerCase()) ||
            (a.attributes.location ?? '').toLowerCase().includes(query.toLowerCase())
          );
          setResults(applyFilters(fallback, selectedType, selectedCategory));
        }
      } catch {
        setResults(applyFilters(all.filter(a => a.attributes.name.toLowerCase().includes(query.toLowerCase())), selectedType, selectedCategory));
      } finally { if (!cancelled) setSearching(false); }
    }, 280);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, selectedType, selectedCategory, all, applyFilters]);

  const clearAll = () => { setQuery(''); setSelectedType('all'); setSelectedCategory('all'); };
  const hasFilters = query || selectedType !== 'all' || selectedCategory !== 'all';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Discover</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Attractions in Liliw</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>Discover all the amazing places to visit and explore</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {/* Search + Filters */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0B3D91', opacity: 0.5 }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search attractions by name or location..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm bg-white shadow-sm"
              style={{ '--tw-ring-color': '#0B3D91' } as any} />
            {searching && <span className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(11,61,145,0.3)', borderTopColor: '#0B3D91' }} />}
            {query && !searching && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 font-semibold text-gray-700 text-sm"
              style={{ '--tw-ring-color': '#0B3D91' } as any}>
              <option value="all">All Types</option>
              <option value="heritage">Heritage Sites</option>
              <option value="spot">Tourist Spots</option>
              <option value="dining">Dining &amp; Food</option>
            </select>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 font-semibold text-gray-700 text-sm"
              style={{ '--tw-ring-color': '#0B3D91' } as any}>
              <option value="all">All Categories</option>
              <option value="historical">Historical</option>
              <option value="cultural">Cultural</option>
              <option value="natural">Natural</option>
              <option value="religious">Religious</option>
              <option value="scenic">Scenic</option>
            </select>
            {hasFilters && (
              <button onClick={clearAll} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <span className="text-sm text-gray-400 ml-auto" style={{ fontFamily: BL }}>
              {searching ? 'Searching…' : `Showing ${results.length} of ${all.length} attractions`}
            </span>
          </div>
        </motion.div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-white animate-pulse h-80 border border-gray-100" />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
            <p className="text-red-700 font-semibold" style={{ fontFamily: HL }}>Error loading attractions</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && results.length > 0 && (
          <motion.div initial="hidden" animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((attraction, idx) => {
              const photo = coverUrl(attraction.attributes?.photos ?? []);
              const rating = attraction.attributes?.rating ?? 0;
              return (
                <motion.div key={`${attraction.id}-${idx}`}
                  variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }} className="group h-full">
                  <Link href={`/attractions/${attraction.id}`}>
                    <div className="rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer editorial-card">
                      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #1A1A2E, #0B3D91)' }}>
                        {photo
                          ? <img src={photo} alt={attraction.attributes?.name} className="w-full h-full object-cover card-img" />
                          : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Layers className="w-16 h-16 text-white" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                          {TYPE_ICONS[attraction.type]} {TYPE_LABELS[attraction.type] ?? attraction.type}
                        </div>
                        <FavoriteButton attractionId={String(attraction.id)} attractionName={attraction.attributes?.name || ''} attractionType={attraction.type} attractionCategory={attraction.attributes?.category} className="absolute top-3 right-3 z-20" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="section-label mb-1" style={{ color: '#1565C0', fontSize: 11 }}>{TYPE_LABELS[attraction.type]}</p>
                        <h2 className="font-bold mb-1.5 line-clamp-2 leading-snug text-base" style={{ color: '#1A1A2E', fontFamily: HL }}>{attraction.attributes?.name || 'Unnamed Attraction'}</h2>
                        {attraction.attributes?.location && (
                          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs truncate" style={{ fontFamily: BL }}>{attraction.attributes.location}</span>
                          </div>
                        )}
                        {rating > 0 && (
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? '#F5C518' : 'none'} stroke={i < Math.round(rating) ? '#F5C518' : '#d1d5db'} />)}
                          </div>
                        )}
                        {attraction.attributes?.description && <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4" style={{ fontFamily: BL }}>{attraction.attributes.description}</p>}
                        <div className="inline-flex items-center font-semibold text-sm gap-1" style={{ color: '#1565C0', fontFamily: BL }}>
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

        {/* No results */}
        {!loading && !error && all.length > 0 && results.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#0B3D91' }} />
            </div>
            <p className="text-xl font-semibold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>No attractions match your search</p>
            <p className="text-gray-400 mb-6 text-sm" style={{ fontFamily: BL }}>Try different keywords or clear the filters</p>
            <button onClick={clearAll} className="px-6 py-2.5 text-white rounded-xl font-semibold transition hover:opacity-90"
              style={{ backgroundColor: '#0B3D91' }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Empty data */}
        {!loading && !error && all.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>
              <MapPin className="w-12 h-12" style={{ color: '#0B3D91' }} />
            </div>
            <p className="text-xl font-semibold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>No attractions found</p>
            <p className="text-gray-400 text-sm" style={{ fontFamily: BL }}>Check back soon for amazing places to explore!</p>
          </div>
        )}
      </div>
    </div>
  );
}
