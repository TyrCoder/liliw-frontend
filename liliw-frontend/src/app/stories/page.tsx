'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen, User } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const CATEGORY_COLORS: Record<string, string> = {
  history:  '#0B3D91',
  culture:  '#8B5CF6',
  people:   '#F5C518',
  nature:   '#2E7D32',
  food:     '#EF4444',
  festival: '#EC4899',
};

function mediaUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
}

function extractExcerpt(richText: any, fallback = ''): string {
  if (!richText) return fallback;
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText))
    return richText.flatMap((b: any) => b?.children ?? []).map((c: any) => c?.text ?? '').join(' ').slice(0, 200);
  return fallback;
}

interface Story {
  id: number; slug: string; title: string; excerpt: string;
  category: string; author: string; coverUrl: string; featured: boolean; date: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strapi/stories')
      .then(r => r.json())
      .then(json => {
        const raw: any[] = json?.data ?? [];
        setStories(raw.map(item => {
          const a = item?.attributes ?? item;
          const img = a?.cover_image?.data?.attributes ?? a?.cover_image ?? {};
          return {
            id: item.id,
            slug: a?.slug ?? String(item.id),
            title: a?.title ?? '',
            excerpt: a?.excerpt || extractExcerpt(a?.content, ''),
            category: a?.category ?? 'history',
            author: a?.author ?? 'Liliw Tourism',
            coverUrl: mediaUrl(img?.url ?? img?.formats?.medium?.url ?? img?.formats?.large?.url),
            featured: a?.featured ?? false,
            date: a?.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = stories.find(s => s.featured);
  const rest = stories.filter(s => !s.featured || stories.filter(x => x.featured).indexOf(s) > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <p className="section-label mb-3" style={{ color: 'rgba(245,197,24,0.9)' }}>Narratives</p>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: DL }}>Stories of Liliw</h1>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518' }} />
            <p className="text-white/70 text-lg" style={{ fontFamily: BL }}>Narratives, history, and the people that make Liliw alive</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 pb-24">

        {/* Skeleton */}
        {loading && (
          <div className="space-y-10">
            <div className="rounded-2xl overflow-hidden animate-pulse bg-white h-72 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && stories.length === 0 && (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: 'rgba(11,61,145,0.2)' }}>
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: '#0B3D91' }} />
            <p className="font-semibold text-lg" style={{ color: '#1A1A2E', fontFamily: HL }}>No stories yet</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Add and publish Stories in Strapi.</p>
          </div>
        )}

        {/* Featured story */}
        {!loading && featured && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
            <Link href={`/stories/${featured.slug}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 editorial-card">
                {featured.coverUrl
                  ? <img src={featured.coverUrl} alt={featured.title} className="w-full h-full object-cover card-img" />
                  : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#0B3D91,#1A1A2E)' }} />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wide"
                      style={{ backgroundColor: CATEGORY_COLORS[featured.category] ?? '#0B3D91' }}>
                      {featured.category}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Featured</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: DL }}>{featured.title}</h2>
                  {featured.excerpt && <p className="text-gray-200 text-sm sm:text-base line-clamp-2 max-w-2xl" style={{ fontFamily: BL }}>{featured.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-3 text-gray-300 text-sm" style={{ fontFamily: BL }}>
                    <User className="w-3.5 h-3.5" />{featured.author}
                    {featured.date && <><span>·</span><span>{featured.date}</span></>}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Story grid */}
        {!loading && rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((story, idx) => (
              <motion.div key={story.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.07 }}>
                <Link href={`/stories/${story.slug}`} className="block group h-full">
                  <div className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white editorial-card">
                    <div className="h-44 overflow-hidden bg-gray-100 relative shrink-0">
                      {story.coverUrl
                        ? <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover card-img" />
                        : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(11,61,145,0.1),rgba(26,26,46,0.08))' }}>
                            <BookOpen className="w-8 h-8 opacity-30" style={{ color: '#0B3D91' }} />
                          </div>
                        )
                      }
                      <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize"
                        style={{ backgroundColor: CATEGORY_COLORS[story.category] ?? '#0B3D91' }}>
                        {story.category}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold mb-2 line-clamp-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{story.title}</h3>
                      {story.excerpt && <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1" style={{ fontFamily: BL }}>{story.excerpt}</p>}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400" style={{ fontFamily: BL }}>
                        <User className="w-3 h-3" />{story.author}
                        {story.date && <><span>·</span><span>{story.date}</span></>}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
