'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, User, Play } from 'lucide-react';
import GatTayaw from '@/components/GatTayaw';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

// Add your YouTube video IDs here — empty strings are hidden until filled
const STORY_VIDEOS: { id: string; title: string }[] = [
  { id: '', title: 'Video 1' },
  { id: '', title: 'Video 2' },
  { id: '', title: 'Video 3' },
];

const CATEGORY_COLORS: Record<string, string> = {
  history: '#EF4444', culture: '#8B5CF6', people: '#EAB308',
  nature: '#22C55E', food: '#F97316', festival: '#EC4899',
};

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign:'middle' }}>
      <line x1="0" y1={cy} x2={W} y2={cy} stroke="#9CA3AF" strokeWidth="1.2" />
      {PENNANT.map((color, i) => {
        const cx = r + i * spacing;
        return (
          <g key={i}>
            {Array.from({ length: panels }).map((_, j) => {
              const a1 = -Math.PI / 2 + j * arc;
              const a2 = -Math.PI / 2 + (j + 1) * arc;
              const x1 = (cx + r * Math.cos(a1)).toFixed(2);
              const y1 = (cy + r * Math.sin(a1)).toFixed(2);
              const x2 = (cx + r * Math.cos(a2)).toFixed(2);
              const y2 = (cy + r * Math.sin(a2)).toFixed(2);
              return <path key={j} d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={j % 2 === 0 ? color : color + 'bb'} />;
            })}
          </g>
        );
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
  const activeVideos = STORY_VIDEOS.filter(v => v.id.trim());

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0B3D91 0%,#1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-4">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>
                Stories of Liliw
              </h1>
              <Bunting flip />
            </div>
            <p className="text-center text-white/70 text-base mt-2" style={{ fontFamily: BL }}>
              Narratives, history, and the people that make Liliw alive
            </p>
          </motion.div>
        </div>
      </div>
      <WaveDown from="#1565C0" to="#ffffff" />

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">

        {/* Three-column layout: GatTayaw | Stories | Dog */}
        <div className="flex gap-6 xl:gap-10 items-start">

          {/* ── Left sidebar: GatTayaw (sticky) ── */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-8">
            <GatTayaw defaultKey="welcome" />
          </div>

          {/* ── Center: story content ── */}
          <div className="flex-1 min-w-0">

            {/* Mobile: GatTayaw above stories */}
            <div className="block lg:hidden mb-8">
              <GatTayaw defaultKey="welcome" />
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="space-y-10">
                <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-100 h-72 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-gray-100" style={{ aspectRatio:'3/4' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading && stories.length === 0 && (
              <div className="text-center py-24 rounded-2xl border-2 border-dashed border-gray-200">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                <p className="font-semibold text-lg text-gray-700" style={{ fontFamily: HL }}>No stories yet</p>
                <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Add and publish Stories in Strapi.</p>
              </div>
            )}

            {/* Featured story */}
            {!loading && featured && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
                <Link href={`/stories/${featured.slug}`} className="block group">
                  <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96">
                    {featured.coverUrl
                      ? <img src={featured.coverUrl} alt={featured.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }} />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize"
                          style={{ backgroundColor: CATEGORY_COLORS[featured.category] ?? '#1565C0' }}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {rest.map((story, i) => (
                  <motion.div key={story.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                    whileHover={{ y: -5 }} className="h-full">
                    <Link href={`/stories/${story.slug}`} className="block h-full">
                      <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group"
                        style={{ aspectRatio:'3/4', background:'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                        {story.coverUrl
                          ? <img src={story.coverUrl} alt={story.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="absolute inset-0 flex items-center justify-center opacity-20"><BookOpen className="w-16 h-16 text-white" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2 capitalize"
                            style={{ backgroundColor: CATEGORY_COLORS[story.category] ?? '#1565C0', fontFamily: HL }}>
                            {story.category}
                          </span>
                          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1" style={{ fontFamily: HL }}>{story.title}</h3>
                          <div className="flex items-center gap-1.5 text-white/60 text-xs" style={{ fontFamily: BL }}>
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

            {/* Featured Videos */}
            {activeVideos.length > 0 && (
              <div className="mt-16 pt-10 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Play className="w-5 h-5" style={{ color: '#0B3D91' }} />
                  <h2 className="text-2xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>
                    Videos about Liliw
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeVideos.map(v => (
                    <div key={v.id} className="rounded-2xl overflow-hidden shadow-md" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${v.id}`}
                        title={v.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Right sidebar: floating dog (sticky) ── */}
          <div className="hidden xl:flex w-44 shrink-0 flex-col items-center sticky top-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/liliw-dog.png"
              alt="Liliw mascot"
              className="gat-float"
              style={{
                width: 160, height: 'auto', display: 'block',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
