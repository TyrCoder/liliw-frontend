'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, ZoomIn, Images } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const CATEGORIES = ['all', 'heritage', 'events', 'nature', 'culture', 'food', 'community'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All Photos', heritage: 'Heritage', events: 'Events', nature: 'Nature',
  culture: 'Culture', food: 'Food', community: 'Community',
};

const CATEGORY_COLORS: Record<Exclude<Category, 'all'>, string> = {
  heritage: '#0B3D91', events: '#F5C518', nature: '#2E7D32',
  culture:  '#8B5CF6', food: '#EF4444', community: '#1565C0',
};

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: Exclude<Category, 'all'>;
}

export default function GalleryPage() {
  const [items, setItems]     = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch('/api/strapi/gallery')
      .then(r => r.json())
      .then(json => {
        const raw: any[] = json?.data ?? [];
        setItems(raw.map(item => {
          const a = item?.attributes ?? item;
          const img = a?.image?.data?.attributes ?? a?.image ?? {};
          return {
            id: item.id,
            title: a?.title ?? '',
            description: a?.description ?? '',
            imageUrl: mediaUrl(img?.url ?? img?.formats?.large?.url ?? img?.formats?.medium?.url),
            category: a?.category ?? 'heritage',
          };
        }).filter(i => i.imageUrl));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Visuals</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Media Gallery</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>A visual journey through Liliw, Laguna</p>
          </motion.div>
        </div>
      </div>

      {/* Category filter */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={activeCategory === cat
                ? { backgroundColor: '#0B3D91', color: '#F5C518', fontFamily: HL }
                : { backgroundColor: '#fff', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.2)', fontFamily: HL }}>
              {CATEGORY_LABELS[cat]}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* Skeleton */}
        {loading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="break-inside-avoid rounded-xl overflow-hidden animate-pulse bg-gray-200"
                style={{ height: `${160 + (i % 3) * 60}px` }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: 'rgba(11,61,145,0.2)' }}>
            <Images className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: '#0B3D91' }} />
            <p className="font-semibold text-lg" style={{ color: '#1A1A2E', fontFamily: HL }}>No photos yet</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Add and publish Gallery Items in Strapi.</p>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && filtered.length > 0 && (
          <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {filtered.map((item, idx) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => setLightbox(item)}>
                <img src={item.imageUrl} alt={item.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                  <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-semibold truncate pr-2">{item.title}</span>
                      <ZoomIn className="w-4 h-4 text-white shrink-0" />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-bold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] }}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <img src={lightbox.imageUrl} alt={lightbox.title}
                className="w-full max-h-[75vh] object-contain rounded-xl" />
              {(lightbox.title || lightbox.description) && (
                <div className="mt-3 px-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-lg">{lightbox.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[lightbox.category] }}>
                      {CATEGORY_LABELS[lightbox.category]}
                    </span>
                  </div>
                  {lightbox.description && <p className="text-gray-400 text-sm">{lightbox.description}</p>}
                </div>
              )}
              <button onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
