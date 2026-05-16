'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Layers, Star, Search, X, Utensils } from 'lucide-react';
import { logger } from '@/lib/logger';
import { searchAlgolia } from '@/lib/algolia';
import FavoriteButton from '@/components/FavoriteButton';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];

function Bunting({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="126" height="36" viewBox="0 0 126 36" style={{ transform: flip ? 'scaleX(-1)' : undefined, display:'inline-block', verticalAlign:'middle' }}>
      <line x1="0" y1="5" x2="126" y2="5" stroke="#6B7280" strokeWidth="1.5" />
      {PENNANT.map((c, i) => {
        const cx = 10 + i * 15;
        return <polygon key={i} points={`${cx-6},6 ${cx+6},6 ${cx},20`} fill={c} />;
      })}
    </svg>
  );
}

function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ lineHeight: 0, backgroundColor: from }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:'100%', height:60, display:'block' }}>
        <path d="M0,0 C480,60 960,0 1440,60 L1440,60 L0,60 Z" fill={to} />
      </svg>
    </div>
  );
}

interface Attraction {
  id: string | number;
  attributes: { name: string; description?: string; location?: string; category?: string; is_featured?: boolean; rating?: number; photos?: Array<{ url: string; formats?: any }>; };
  type: 'heritage' | 'spot' | 'dining';
}

const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage', spot: 'Tourist Spot', dining: 'Dining' };
const TYPE_COLORS: Record<string, string> = { heritage: '#EF4444', spot: '#22C55E', dining: '#F97316' };

function coverUrl(photos: any[] = []): string | null {
  const p = photos[0];
  if (!p) return null;
  const url = p?.formats?.medium?.url || p?.formats?.small?.url || p?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

function OverlayCard({ attraction }: { attraction: Attraction }) {
  const photo = coverUrl(attraction.attributes?.photos ?? []);
  const rating = attraction.attributes?.rating ?? 0;
  const badgeColor = TYPE_COLORS[attraction.type] ?? '#1565C0';
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="h-full">
      <Link href={`/attractions/${attraction.id}`} className="block h-full">
        <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group"
          style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#1E3A8A,#1565C0)' }}>
          {photo
            ? <img src={photo} alt={attraction.attributes?.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Layers className="w-20 h-20 text-white" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <FavoriteButton attractionId={String(attraction.id)} attractionName={attraction.attributes?.name || ''} attractionType={attraction.type} attractionCategory={attraction.attributes?.category} className="absolute top-3 right-3 z-20" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2"
              style={{ backgroundColor: badgeColor, fontFamily: HL }}>
              {TYPE_LABELS[attraction.type] ?? attraction.type}
            </span>
            <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1" style={{ fontFamily: HL }}>
              {attraction.attributes?.name || 'Unnamed Attraction'}
            </h3>
            {attraction.attributes?.location && (
              <div className="flex items-center gap-1 text-white/70 text-xs" style={{ fontFamily: BL }}>
                <MapPin className="w-3 h-3 shrink-0" />{attraction.attributes.location}
              </div>
            )}
            {rating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3" fill={i < Math.round(rating) ? '#EAB308' : 'none'} stroke={i < Math.round(rating) ? '#EAB308' : 'rgba(255,255,255,0.4)'} />)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
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
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#1565C0 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>
                Attractions
              </h1>
              <Bunting flip />
            </div>
            <p className="text-center text-white/70 text-base mt-2" style={{ fontFamily: BL }}>
              Discover all the amazing places to visit and explore in Liliw
            </p>
          </motion.div>
        </div>
      </div>
      <WaveDown from="#1565C0" to="#ffffff" />

      {/* Search + Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search attractions by name or location..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm bg-white shadow-sm" />
            {searching && <span className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />}
            {query && !searching && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-gray-700 text-sm">
              <option value="all">All Types</option>
              <option value="heritage">Heritage Sites</option>
              <option value="spot">Tourist Spots</option>
              <option value="dining">Dining &amp; Food</option>
            </select>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-gray-700 text-sm">
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
              {searching ? 'Searching…' : `${results.length} of ${all.length} attractions`}
            </span>
          </div>
        </motion.div>

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio:'3/4' }} />)}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
            <p className="text-red-700 font-semibold" style={{ fontFamily: HL }}>Error loading attractions</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <motion.div initial="hidden" animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {results.map((attraction, idx) => (
              <motion.div key={`${attraction.id}-${idx}`}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } }}>
                <OverlayCard attraction={attraction} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && !error && all.length > 0 && results.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6 bg-blue-50">
              <MapPin className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: HL }}>No attractions match your search</p>
            <p className="text-gray-400 mb-6 text-sm" style={{ fontFamily: BL }}>Try different keywords or clear the filters</p>
            <button onClick={clearAll} className="px-6 py-2.5 text-white rounded-xl font-semibold transition hover:opacity-90"
              style={{ backgroundColor: '#1565C0' }}>
              Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && all.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full mb-6 bg-blue-50">
              <MapPin className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-xl font-semibold mb-2 text-gray-800" style={{ fontFamily: HL }}>No attractions found</p>
            <p className="text-gray-400 text-sm" style={{ fontFamily: BL }}>Check back soon for amazing places to explore!</p>
          </div>
        )}
      </div>
    </div>
  );
}
