'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Play } from 'lucide-react';
import PeekingDog from '@/components/PeekingDog';
import StorySlideshow from '@/components/stories/StorySlideshow';
import PageBanner from '@/components/liliw/PageBanner';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

// Add your YouTube video IDs here — empty strings are hidden until filled
const STORY_VIDEOS: { id: string; title: string }[] = [
  { id: '', title: 'Video 1' },
  { id: '', title: 'Video 2' },
  { id: '', title: 'Video 3' },
];

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
  if (typeof richText === 'string')
    return richText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
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
    fetch('/api/content/stories')
      .then(r => r.json())
      .then(json => {
        const raw: any[] = json?.data ?? [];
        setStories(raw.map(item => {
          const a = item?.attributes ?? item;
          return {
            id: item.id,
            slug: a?.slug ?? String(item.documentId ?? item.id),
            title: a?.title ?? '',
            excerpt: typeof a?.excerpt === 'string' ? a.excerpt : extractExcerpt(a?.content, ''),
            category: a?.category ?? 'history',
            author: a?.author ?? 'Liliw Tourism Office',
            coverUrl: item._coverUrl ?? '',
            /* The page reads the story rather than teasing it, so the body and
               every photograph come down with the listing — the endpoint has
               always returned both. */
            content: typeof a?.content === 'string' ? a.content : '',
            /* Without these the reader would fall back to the keyword guess
               and ignore whatever an editor uploaded, which is the whole point
               of letting them upload it. */
            audio_key: a?.audio_key ?? null,
            audio_en:  a?.audio_en ?? null,
            audio_fil: a?.audio_fil ?? null,
            images: Array.isArray(item._allImages) && item._allImages.length > 0
              ? item._allImages
              : item._coverUrl ? [item._coverUrl] : [],
            featured: a?.featured ?? false,
            date: a?.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Featured first, then the rest in their published order, so the slideshow
     opens on whatever the tourism office chose to lead with. */
  const ordered = [...stories].sort((a, b) => Number(b.featured) - Number(a.featured));
  const activeVideos = STORY_VIDEOS.filter(v => v.id.trim());

  return (
    <div className="min-h-screen page-ground" suppressHydrationWarning>

      {/* He looks in from the edge of the whole page. */}
      <PeekingDog />

      <PageBanner
        title="Stories of Liliw"
        subtitle="Narratives, history, and the people that make Liliw alive"
        backHref={null}
      />

      <div className="page-wrap px-4 py-8 pb-24">

        {/* The slideshow is the page.
            It was a sticky storyteller in a left column, a featured banner and
            then a grid — three things competing for the same attention, and a
            grid that shows every story at once gives no reason to open any
            particular one. The stories are shown one at a time now, and the
            storyteller walks the rail beneath them to whichever is up. */}
        {loading && (
          <div className="space-y-3">
            <div className="rounded-3xl bg-gray-100 animate-pulse" style={{ aspectRatio: '16 / 9', minHeight: 300 }} />
            <div className="h-52" />
          </div>
        )}

        {!loading && stories.length === 0 && (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-300" />
            <p className="font-semibold text-lg text-gray-700" style={{ fontFamily: HL }}>No stories yet</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Add and publish Stories in the CMS.</p>
          </div>
        )}

        {!loading && stories.length > 0 && (
          <StorySlideshow stories={ordered} />
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
    </div>
  );
}
