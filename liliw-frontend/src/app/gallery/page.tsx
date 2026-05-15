'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Images } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const CATEGORIES = ['all', 'heritage', 'events', 'nature', 'culture', 'food', 'community'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All Photos',
  heritage: 'Heritage',
  events: 'Events',
  nature: 'Nature',
  culture: 'Culture',
  food: 'Food',
  community: 'Community',
};

const CATEGORY_COLORS: Record<Exclude<Category, 'all'>, string> = {
  heritage: '#00BFB3',
  events:   '#F59E0B',
  nature:   '#10B981',
  culture:  '#8B5CF6',
  food:     '#EF4444',
  community:'#3B82F6',
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
  const [items, setItems]           = useState<GalleryItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [lightbox, setLightbox]     = useState<GalleryItem | null>(null);

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

  const filtered = activeCategory === 'all'
    ? items
    : items.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-3xl sm:text-5xl font-bold mb-2" style={{ color: '#00BFB3' }}>Media Gallery</h1>
          <p className="text-gray-500 text-base sm:text-lg">A visual journey through Liliw, Laguna</p>
        </motion.div>
      </div>

      {/* Category filter */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={activeCategory === cat
                ? { backgroundColor: '#00BFB3', color: '#fff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }}
            >
              {CATEGORY_LABELS[cat]}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Grid */}
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

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: '#00BFB3' }}>
            <Images className="w-12 h-12 mx-auto mb-3" style={{ color: '#00BFB3', opacity: 0.5 }} />
            <p className="font-semibold text-lg" style={{ color: '#0F1F3C' }}>No photos yet</p>
            <p className="text-sm text-gray-400 mt-1">Add and publish Gallery Items in Strapi.</p>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && filtered.length > 0 && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3"
          >
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                  <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-semibold truncate pr-2">{item.title}</span>
                      <ZoomIn className="w-4 h-4 text-white shrink-0" />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold text-white"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightbox.imageUrl}
                alt={lightbox.title}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              {(lightbox.title || lightbox.description) && (
                <div className="mt-3 px-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-lg">{lightbox.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[lightbox.category] }}>
                      {CATEGORY_LABELS[lightbox.category]}
                    </span>
                  </div>
                  {lightbox.description && (
                    <p className="text-gray-400 text-sm">{lightbox.description}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
