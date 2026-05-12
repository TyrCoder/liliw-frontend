'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Play } from 'lucide-react';
import { getCultureHeritages } from '@/lib/strapi';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

function extractText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((block: any) => (block?.children ?? []).map((c: any) => c?.text ?? '').join(' '))
      .join(' ');
  }
  return '';
}

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

export default function CulturePage() {
  const [cultureItems, setCultureItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCultureHeritages()
      .then((data) => setCultureItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/about" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" /> Back to About
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>Culture & Heritage</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Living traditions and stories that define Liliw</p>
        </motion.div>
      </div>

      {/* Culture & Heritage Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && cultureItems.length === 0 && (
            <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-lg">No culture & heritage content yet</p>
              <p className="text-sm mt-1">Add items in Strapi under Culture & Heritage.</p>
            </div>
          )}

          {!loading && cultureItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cultureItems.map((item: any, idx: number) => {
                const a = item?.attributes ?? item;
                const title = a?.title ?? '';
                const description = extractText(a?.description);
                const images: any[] = Array.isArray(a?.images) ? a.images : [];
                const video = a?.video;
                const coverUrl = images[0] ? mediaUrl(images[0]?.url ?? images[0]?.attributes?.url) : null;
                const videoUrl = video ? mediaUrl(video?.url ?? video?.attributes?.url) : null;

                return (
                  <motion.div
                    key={item.id ?? idx}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {/* Media */}
                    {videoUrl ? (
                      <div className="relative h-56 bg-gray-900 flex items-center justify-center">
                        <video src={videoUrl} className="w-full h-full object-cover opacity-80" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : coverUrl ? (
                      <div className="h-56 overflow-hidden">
                        <img src={coverUrl} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,0.08)' }}>
                        <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: '#00BFB3' }}>
                          <Heart className="w-6 h-6" style={{ color: '#00BFB3' }} />
                        </div>
                      </div>
                    )}

                    {/* Text */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#0F1F3C' }}>{title}</h3>
                      {description && (
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{description}</p>
                      )}
                      {images.length > 1 && (
                        <div className="flex gap-1.5 mt-3">
                          {images.slice(1, 4).map((img: any, i: number) => {
                            const imgUrl = mediaUrl(img?.url ?? img?.attributes?.url);
                            return imgUrl ? (
                              <img key={i} src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                            ) : null;
                          })}
                          {images.length > 4 && (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                              +{images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Support CTA */}
          {!loading && (
            <motion.div variants={itemVariants} className="mt-16 rounded-2xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
              <h3 className="text-2xl font-bold mb-3">Support Local Culture</h3>
              <p className="mb-6 opacity-90">Help preserve and celebrate Liliw's heritage through direct support of artisans and cultural initiatives</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold mb-1">Buy Directly</h4>
                  <p className="text-sm opacity-90">Purchase tsinelas and crafts from local makers</p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold mb-1">Attend Events</h4>
                  <p className="text-sm opacity-90">Experience festivals and cultural celebrations</p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold mb-1">Learn Skills</h4>
                  <p className="text-sm opacity-90">Join workshops and cultural tours</p>
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
