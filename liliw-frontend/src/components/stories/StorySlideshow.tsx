'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, BookOpen, Pause, Play } from 'lucide-react';

const GatTayaw3D = dynamic(() => import('@/components/GatTayaw3D'), {
  ssr: false,
  loading: () => <div style={{ width: 230, height: 310 }} />,
});

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const CATEGORY_COLORS: Record<string, string> = {
  history: '#EF4444', culture: '#8B5CF6', people: '#EAB308',
};

export interface Story {
  id: string | number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  coverUrl: string;
  date: string;
}

const AUTOPLAY_MS = 9000;

/* The storyteller and the strip he walks along.
 *
 * He stands in front of the slide, not below it. Keeping him clear of it meant
 * reserving his whole height underneath, which left a band of empty cream
 * between his feet and the titles and made him small to fit — and he was still
 * being cut off, because anything of him that reached up into the slide went
 * behind it. Standing him in front solves all three: he can be large, he
 * overlaps the picture the way a presenter stands in front of a screen, and
 * his feet sit on the rail rather than floating above it. */
const FIGURE_W = 230;
const FIGURE_H = 310;
/** The progress bar and the titles under it. */
const RAIL_H = 44;
/** How much of him rises above the rail area and over the slide. */
const OVERLAP = 160;
/** Clear air between his feet and the progress bar. */
const STAND_GAP = 6;

/**
 * The stories, one at a time, with Gat Tayaw walking to the one he introduces.
 *
 * They were a featured banner above a grid of cards — a layout that shows
 * every story at once and so gives no reason to look at any one of them, which
 * for four or five narrative pieces is a contents page rather than an
 * invitation. One at a time gives each its own moment, and the rail beneath is
 * both the navigation and the map of where you are in the set.
 *
 * The storyteller's position along that rail is the slide index. He is not
 * decoration parked near the controls: he stands over the story being shown
 * and walks when it changes, which makes the rail readable without a caption
 * explaining what it is.
 */
export default function StorySlideshow({ stories }: { stories: Story[] }) {
  const [index, setIndex] = useState(0);
  const [facing, setFacing] = useState<'left' | 'right' | 'front'>('front');
  const [playing, setPlaying] = useState(true);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const count = stories.length;

  /* Which way he turns is the direction of travel, and he squares up again
     once he arrives — a character left permanently at an angle reads as a
     model dropped in rather than one that walked there. */
  const goTo = useCallback((next: number) => {
    setIndex(prev => {
      const wrapped = ((next % count) + count) % count;
      if (wrapped !== prev) setFacing(wrapped > prev ? 'right' : 'left');
      return wrapped;
    });
    clearTimeout(settle.current);
    settle.current = setTimeout(() => setFacing('front'), 900);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Arrow keys, because a slideshow that answers only to mouse clicks is one
  // that some of the people trying to use it cannot drive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setPlaying(false); next(); }
      if (e.key === 'ArrowLeft')  { setPlaying(false); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!playing || count < 2) return;
    // Someone who has asked for less movement should not be handed a carousel
    // that advances on its own.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [playing, next, count]);

  useEffect(() => () => clearTimeout(settle.current), []);

  if (!count) return null;
  const story = stories[index];
  const accent = CATEGORY_COLORS[story.category] ?? '#1565C0';

  return (
    <section
      className="relative"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Stories of Liliw"
    >
      <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: '#0B3D91' }}>
        <div className="relative" style={{ aspectRatio: '16 / 9', minHeight: 300 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={story.slug}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {story.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={story.slug}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize"
                    style={{ backgroundColor: accent, fontFamily: HL }}>
                    {story.category}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white"
                    style={{ fontFamily: HL }}>
                    {index + 1} of {count}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 max-w-3xl" style={{ fontFamily: DL }}>
                  {story.title}
                </h2>

                {story.excerpt && (
                  <p className="text-gray-200 text-sm sm:text-base line-clamp-2 max-w-2xl mb-4" style={{ fontFamily: BL }}>
                    {story.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  <Link href={`/stories/${story.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
                    style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                    <BookOpen className="w-4 h-4" /> Read this story
                  </Link>
                  <span className="flex items-center gap-2 text-gray-300 text-sm" style={{ fontFamily: BL }}>
                    <User className="w-3.5 h-3.5" />{story.author}
                    {story.date && <><span>·</span><span>{story.date}</span></>}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {count > 1 && (
            <>
              <button onClick={() => { setPlaying(false); prev(); }} aria-label="Previous story"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => { setPlaying(false); next(); }} aria-label="Next story"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setPlaying(p => !p)}
                aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── The rail he walks along ──
          Each story takes an equal share of the width, so his position is the
          index expressed as a percentage and nothing has to be measured. */}
      {/* The rail reserves only what sits below him. The rest of his height
          rises over the slide, which works because the slide is positioned
          without a z-index of its own — so a later sibling that has one paints
          in front of it, and nothing between here and the section root clips
          overflow. */}
      <div className="relative" style={{ height: OVERLAP + RAIL_H, marginTop: -OVERLAP }}>
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ width: FIGURE_W, marginLeft: -FIGURE_W / 2, bottom: RAIL_H + STAND_GAP }}
          animate={{ left: `${((index + 0.5) / count) * 100}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        >
          <GatTayaw3D width={FIGURE_W} height={FIGURE_H} facing={facing}
            greetKey="stories-slideshow" speaking={false} />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 flex gap-2">
          {stories.map((s, i) => (
            <button key={s.slug} onClick={() => { setPlaying(false); goTo(i); }}
              aria-label={`Go to ${s.title}`}
              aria-current={i === index}
              className="flex-1 group text-left">
              <span className="block h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i === index ? accent : 'rgba(11,61,145,0.18)' }} />
              <span className="mt-2 block text-[11px] font-semibold truncate transition-colors"
                style={{ fontFamily: BL, color: i === index ? '#0B3D91' : 'rgba(11,61,145,0.45)' }}>
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
