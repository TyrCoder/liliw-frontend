'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, User, Tag } from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

const CATEGORY_COLORS: Record<string, string> = {
  history:  '#00BFB3',
  culture:  '#8B5CF6',
  people:   '#F59E0B',
  nature:   '#10B981',
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
  if (Array.isArray(richText)) {
    return richText
      .flatMap((b: any) => b?.children ?? [])
      .map((c: any) => c?.text ?? '')
      .join(' ')
      .slice(0, 200);
  }
  return fallback;
}

interface Story {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  coverUrl: string;
  featured: boolean;
  date: string;
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
  const rest     = stories.filter(s => !s.featured || stories.filter(x => x.featured).indexOf(s) > 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-3xl sm:text-5xl font-bold mb-2" style={{ color: '#00BFB3' }}>Stories of Liliw</h1>
          <p className="text-gray-500 text-base sm:text-lg">Narratives, history, and the people that make Liliw alive</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* Skeleton */}
        {loading && (
          <div className="space-y-10">
            <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 h-72 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && stories.length === 0 && (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed" style={{ borderColor: '#00BFB3' }}>
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#00BFB3', opacity: 0.5 }} />
            <p className="font-semibold text-lg" style={{ color: '#0F1F3C' }}>No stories yet</p>
            <p className="text-sm text-gray-400 mt-1">Add and publish Stories in Strapi.</p>
          </div>
        )}

        {/* Featured story */}
        {!loading && featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link href={`/stories/${featured.slug}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96">
                {featured.coverUrl ? (
                  <img src={featured.coverUrl} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#00BFB3,#0F1F3C)' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wide"
                      style={{ backgroundColor: CATEGORY_COLORS[featured.category] ?? '#00BFB3' }}>
                      {featured.category}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Featured</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">{featured.title}</h2>
                  {featured.excerpt && (
                    <p className="text-gray-200 text-sm sm:text-base line-clamp-2 max-w-2xl">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-gray-300 text-sm">
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
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
              >
                <Link href={`/stories/${story.slug}`} className="block group h-full">
                  <div className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="h-44 overflow-hidden bg-gray-100 relative shrink-0">
                      {story.coverUrl ? (
                        <img src={story.coverUrl} alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,rgba(0,191,179,0.15),rgba(15,31,60,0.1))' }}>
                          <BookOpen className="w-8 h-8" style={{ color: '#00BFB3', opacity: 0.5 }} />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize"
                        style={{ backgroundColor: CATEGORY_COLORS[story.category] ?? '#00BFB3' }}>
                        {story.category}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold mb-2 group-hover:text-teal-600 transition-colors line-clamp-2"
                        style={{ color: '#0F1F3C' }}>{story.title}</h3>
                      {story.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">{story.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
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
