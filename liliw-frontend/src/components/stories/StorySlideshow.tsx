'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, BookOpen, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { storyNarrationSrc, type NarrationLang } from '@/lib/narrations';

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
  /** The narration an editor picked, when they picked one. */
  audio_key?: string | null;
  /** Recordings uploaded through the CMS, which take precedence. */
  audio_en?: string | null;
  audio_fil?: string | null;
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
 * his feet sit on the rail rather than floating above it.
 *
 * These are proportions rather than pixels. Written as fixed sizes he was 230
 * wide — nearly two thirds of a 360px phone — and rose 160px over a slide that
 * was only 200 tall there, which is not a presenter in front of a screen but a
 * character standing on one. Everything below is derived from the width the
 * component actually has. */

/** Of the container's width, at the extremes it is allowed to reach. */
const FIGURE_SHARE = 0.21;
const FIGURE_MIN = 104;
const FIGURE_MAX = 230;
/** His drawn proportions, kept whatever the width works out to. */
const FIGURE_RATIO = 310 / 230;
/** How much of his height rises over the slide. */
const OVERLAP_SHARE = 0.52;
/** Clear air between his feet and the progress bar. */
const STAND_GAP = 6;

/**
 * Below this the rail shows bars without titles.
 *
 * Four story titles sharing 360px is 85px each, which truncates every one of
 * them to a word and a half — four identical grey stubs that say nothing and
 * still take up the room. The bars alone still show how many there are and
 * which one is up, and the title is on the slide directly above them.
 */
const TITLES_MIN_WIDTH = 560;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

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

  /*
   * The width the component actually has, not the width of the window.
   *
   * The slideshow sits inside a page container with its own padding and a
   * maximum, so the viewport is the wrong thing to measure — and a breakpoint
   * would only be right at the two widths it was chosen for. A ResizeObserver
   * is correct at every width, including the ones nobody tests: a folded
   * phone, a tablet held sideways, a desktop window dragged narrow.
   */
  const stage = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const figureW = clamp(width * FIGURE_SHARE, FIGURE_MIN, FIGURE_MAX);
  const figureH = figureW * FIGURE_RATIO;
  const overlap = figureH * OVERLAP_SHARE;
  const showTitles = width >= TITLES_MIN_WIDTH;
  const railH = showTitles ? 44 : 16;
  /* Portrait on a phone. A 16:9 slide on a 360px screen is 202px tall, and the
     category, title, two lines of summary and a row of buttons do not fit in
     202px — they overflow it, or crush the picture to a stripe behind them. */
  const portrait = width > 0 && width < 520;

  /*
   * Gat Tayaw reads the story that is showing.
   *
   * Not a fixed welcome: that recording exists in English only, so a Filipino
   * toggle beside it would have nothing to play. Every story narration was
   * recorded in both, and reading the slide in view is the more useful thing
   * for him to be doing anyway.
   */
  const [lang, setLang] = useState<NarrationLang>('en');
  const [narrating, setNarrating] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const story = stories[Math.min(index, Math.max(count - 1, 0))];
  const audioSrc = story ? storyNarrationSrc(story, lang) : '';

  /*
   * Autoplay, as far as a browser will allow it.
   *
   * Sound cannot start on its own before a visitor has interacted with the
   * page — every current browser refuses, and the promise from play() rejects.
   * So it is attempted and the refusal is caught rather than logged and
   * forgotten: `blocked` turns the control into an invitation to press it,
   * which is the one thing that lifts the restriction. From then on each new
   * slide starts speaking on its own.
   */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;

    el.load();
    let cancelled = false;

    el.play()
      .then(() => { if (!cancelled) { setNarrating(true); setBlocked(false); } })
      .catch(() => { if (!cancelled) { setNarrating(false); setBlocked(true); } });

    return () => { cancelled = true; };
  }, [audioSrc]);

  const toggleNarration = () => {
    const el = audioRef.current;
    if (!el) return;
    if (narrating) { el.pause(); setNarrating(false); return; }
    el.play().then(() => { setNarrating(true); setBlocked(false); }).catch(() => setBlocked(true));
  };

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

  if (!count || !story) return null;
  const accent = CATEGORY_COLORS[story.category] ?? '#1565C0';

  return (
    <section
      ref={stage}
      className="relative"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Stories of Liliw"
    >
      <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: '#0B3D91' }}>
        <div className="relative"
          style={portrait
            ? { aspectRatio: '4 / 5', maxHeight: '76vh' }
            : { aspectRatio: '16 / 9', minHeight: 300 }}>
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

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7 lg:p-9">
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

                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 max-w-3xl leading-tight" style={{ fontFamily: DL }}>
                  {story.title}
                </h2>

                {story.excerpt && (
                  <p className="text-gray-200 text-[13px] sm:text-base line-clamp-2 sm:line-clamp-2 max-w-2xl mb-3 sm:mb-4" style={{ fontFamily: BL }}>
                    {story.excerpt}
                  </p>
                )}

                {/* The storyteller stands over the right-hand side of this
                    block, so the controls keep to the left and stop short of
                    him — on a phone a button under his feet is a button that
                    cannot be pressed. */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap"
                  style={{ maxWidth: portrait ? 'calc(100% - 4.5rem)' : undefined }}>
                  <Link href={`/stories/${story.slug}`}
                    className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-[13px] sm:text-sm transition hover:opacity-90"
                    style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Read{portrait ? '' : ' this story'}</span>
                  </Link>
                  {/* Listen, and the language it is read in. One button each:
                      the second is a toggle rather than two radio buttons,
                      because there are exactly two languages and a pair of
                      buttons where one is always the wrong one is noise. */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleNarration}
                      aria-label={narrating ? 'Pause narration' : 'Listen to Gat Tayaw'}
                      className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-[13px] sm:text-sm transition hover:bg-white/20"
                      style={{
                        backgroundColor: blocked ? 'rgba(245,197,24,0.22)' : 'rgba(255,255,255,0.12)',
                        color: '#fff', fontFamily: HL,
                      }}
                    >
                      {narrating ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
                      <span className="whitespace-nowrap">{narrating ? 'Pause' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={() => setLang(l => (l === 'en' ? 'fil' : 'en'))}
                      aria-label={`Narration language: ${lang === 'en' ? 'English' : 'Filipino'}. Tap to switch.`}
                      title="Switch narration language"
                      className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black tracking-wider transition hover:opacity-90"
                      style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}
                    >
                      {lang === 'en' ? 'EN' : 'FIL'}
                    </button>
                  </div>

                  {!portrait && (
                    <span className="flex items-center gap-2 text-gray-300 text-sm" style={{ fontFamily: BL }}>
                      <User className="w-3.5 h-3.5 shrink-0" />{story.author}
                      {story.date && <><span>·</span><span>{story.date}</span></>}
                    </span>
                  )}
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
      {/* Narration for the slide in view. Not visible: the controls above are
          the interface, and a second set of native ones would be a second
          thing to keep in step. */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        onEnded={() => setNarrating(false)}
        onPause={() => setNarrating(false)}
        onPlay={() => setNarrating(true)}
      />

      {/* pointer-events-none on the container, not just on the figure.
          This block is pulled up over the slide across its whole width, so
          while it was clickable it lay across "Read this story" and swallowed
          the click — the button was visible, unobstructed to look at, and
          dead. The rail buttons below opt back in. */}
      <div className="relative pointer-events-none"
        style={{ height: overlap + railH, marginTop: -overlap }}>
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ width: figureW, marginLeft: -figureW / 2, bottom: railH + STAND_GAP }}
          animate={{ left: `${((index + 0.5) / count) * 100}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        >
          {/* He works through his clips while the narration is playing and
              settles when it stops, so the figure and the audio are obviously
              the same person rather than two things happening at once. */}
          <GatTayaw3D width={figureW} height={figureH} facing={facing}
            greetKey="stories-slideshow" speaking={narrating} />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 flex gap-2 pointer-events-auto">
          {stories.map((s, i) => (
            <button key={s.slug} onClick={() => { setPlaying(false); goTo(i); }}
              aria-label={`Go to ${s.title}`}
              aria-current={i === index}
              className="flex-1 group text-left">
              <span className="block h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i === index ? accent : 'rgba(11,61,145,0.18)' }} />
              {showTitles && (
                <span className="mt-2 block text-[11px] font-semibold truncate transition-colors"
                  style={{ fontFamily: BL, color: i === index ? '#0B3D91' : 'rgba(11,61,145,0.45)' }}>
                  {s.title}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
