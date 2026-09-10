'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, BookOpen, Volume2, VolumeX, HelpCircle, X, MessageCircle, Languages } from 'lucide-react';
import { storyNarrationSrc, type NarrationLang } from '@/lib/narrations';
import SafeHtml from '@/components/SafeHtml';

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
  /** The story itself. The page shows it rather than teasing it. */
  content?: string;
  images?: string[];
  /** The narration an editor picked, when they picked one. */
  audio_key?: string | null;
  /** Recordings uploaded through the CMS, which take precedence. */
  audio_en?: string | null;
  audio_fil?: string | null;
  /** A short line shown in his speech bubble. Empty means no bubble. */
  storyteller_text?: string | null;
}

// Below this the rail shows bars only — titles would truncate to a word each.
const TITLES_MIN_WIDTH = 560;

// Gat Tayaw's size, as a share of the card width so he fits at any width.
const FIGURE_SHARE = 0.38;
const FIGURE_MIN = 200;
const FIGURE_MAX = 380;
const FIGURE_RATIO = 1.14;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// The card's background. With more than one photo it cross-fades between them;
// with one it holds still; with none it falls back to a brand gradient. Remount
// it (key on the story) to restart at the first photo when the story changes.
function StoryBackdrop({ images }: { images: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI(p => (p + 1) % images.length), 5500);
    return () => clearInterval(id);
  }, [images]);

  if (images.length === 0) {
    return <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }} />;
  }
  return (
    <AnimatePresence>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        key={i}
        src={images[i % images.length]}
        alt=""
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </AnimatePresence>
  );
}

// Stories one at a time, read in full. Gat Tayaw stands in the card's right-side
// deadspace and reads the current one. No auto-advance — paging is manual.
export default function StorySlideshow({ stories }: { stories: Story[] }) {
  const [index, setIndex] = useState(0);
  const count = stories.length;

  // The card's own width (not the viewport), so the figure sizes correctly.
  const stage = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showTitles = width >= TITLES_MIN_WIDTH;
  const figureW = clamp(width * FIGURE_SHARE, FIGURE_MIN, FIGURE_MAX);
  const figureH = figureW * FIGURE_RATIO;

  // Narration for the current story, in the chosen language (both were recorded).
  const [lang, setLang] = useState<NarrationLang>('en');
  const [narrating, setNarrating] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // The "how this works" legend.
  const [showHelp, setShowHelp] = useState(false);

  // Typewriter reveal of the speech bubble, restarted on each story.
  const [typed, setTyped] = useState('');

  const story = stories[Math.min(index, Math.max(count - 1, 0))];
  const audioSrc = story ? storyNarrationSrc(story, lang) : '';
  const speaking = narrating && !!audioSrc;
  const bubbleText = (story?.storyteller_text ?? '').trim();
  const coverImage = story?.coverUrl || story?.images?.[0] || '';
  const bgImages = story?.images?.length ? story.images : (coverImage ? [coverImage] : []);

  // Try to autoplay; browsers block sound before interaction, so `blocked`
  // turns the button into an invitation to press it.
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
    if (speaking) { el.pause(); setNarrating(false); return; }
    el.play().then(() => { setNarrating(true); setBlocked(false); }).catch(() => setBlocked(true));
  };

  const goTo = useCallback((next: number) => {
    setIndex(((next % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Arrow-key paging.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Reveal the bubble one character at a time (skipped for reduced motion).
  useEffect(() => {
    if (!bubbleText) { setTyped(''); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTyped(bubbleText);
      return;
    }
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(bubbleText.slice(0, i));
      if (i >= bubbleText.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [bubbleText]);

  if (!count || !story) return null;
  const accent = CATEGORY_COLORS[story.category] ?? '#1565C0';

  return (
    <section
      ref={stage}
      className="relative"
      aria-roledescription="carousel"
      aria-label="Stories of Liliw"
    >
      <article className="relative rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: '#0B1836' }}>
        {/* The story's photos fill the card (cross-fading when there are
            several), darkened at the edges (vignette) and down the left so the
            light text stays readable. */}
        <div className="absolute inset-0" aria-hidden>
          <StoryBackdrop key={story.slug} images={bgImages} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(130% 130% at 50% 35%, transparent 42%, rgba(2,8,24,0.62) 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(2,8,24,0.90) 0%, rgba(2,8,24,0.72) 50%, rgba(2,8,24,0.28) 78%, rgba(2,8,24,0.50) 100%)' }} />
          {/* On mobile the text is full width, so darken the whole photo evenly
              (the left scrim above only covers one side). */}
          <div className="absolute inset-0 sm:hidden" style={{ backgroundColor: 'rgba(2,8,24,0.45)' }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={story.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            /* Roomier card, text centred vertically; right padding reserves the
               deadspace the storyteller stands in. */
            className="relative z-10 flex flex-col justify-start sm:justify-center sm:min-h-115 lg:min-h-130 pl-5 sm:pl-9 lg:pl-12 pr-5 sm:pr-[42%] py-8 sm:py-10"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}
          >
            {/* Kicker: which chapter, and what kind of story. */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <span className="text-[34px] sm:text-[42px] leading-none font-black tabular-nums"
                style={{ color: 'rgba(255,255,255,0.30)', fontFamily: HL }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.22em] px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: accent, fontFamily: HL }}>
                {story.category}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.75)', fontFamily: HL }}>
                {index + 1} of {count}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-bold leading-[1.1] mb-3 max-w-3xl"
              style={{ color: '#ffffff', fontFamily: DL }}>
              {story.title}
            </h2>

            <div className="w-16 h-1 rounded-full mb-5" style={{ backgroundColor: '#F5C518' }} />

            {/* The story itself, sanitised and held to a reading measure. */}
            {story.content
              ? <SafeHtml html={story.content}
                  className="prose prose-invert prose-sm sm:prose-base max-w-[62ch] text-white/90 leading-relaxed"
                  style={{ fontFamily: BL }} />
              : story.excerpt
                ? <p className="max-w-[62ch] text-white/90 leading-relaxed" style={{ fontFamily: BL }}>{story.excerpt}</p>
                : null}

            <div className="mt-7 pt-5 border-t border-white/20 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-2 text-sm text-white/75" style={{ fontFamily: BL }}>
                <User className="w-3.5 h-3.5 shrink-0" />{story.author}
                {story.date && <><span>·</span><span>{story.date}</span></>}
              </span>

              <Link href={`/stories/${story.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
                style={{ color: '#F5C518', fontFamily: HL }}>
                <BookOpen className="w-4 h-4" /> Open on its own page
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Gat Tayaw with his speech bubble above him. On mobile he stands
            below the text in normal flow; from sm up he is centred in the
            right-side deadspace. Outside the crossfade so the 3D canvas persists
            across slides. */}
        <div className="flex flex-col items-center gap-2 z-10 pointer-events-none w-full pb-6 sm:pb-0 sm:w-auto sm:absolute sm:bottom-0 sm:left-[79%] sm:-translate-x-1/2">
          {bubbleText && (
            <motion.div
              key={story.slug}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative"
              style={{ width: Math.min(figureW * 1.2, 340) }}
            >
              <div className="rounded-2xl rounded-br-md bg-white shadow-xl ring-1 ring-black/5 px-4 pt-2.5 pb-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: '#1565C0', fontFamily: HL }}>
                  <Volume2 className="w-3 h-3" /> Gat Tayaw says
                </p>
                <p className="text-[13px] leading-snug text-gray-700 line-clamp-6" style={{ fontFamily: BL }}>
                  {typed}
                  {typed.length < bubbleText.length && (
                    <span className="inline-block w-0.5 h-[0.95em] ml-0.5 align-middle animate-pulse"
                      style={{ backgroundColor: '#1565C0' }} />
                  )}
                </p>
              </div>
              {/* tail pointing down toward him */}
              <span className="absolute -bottom-1 right-8 w-3 h-3 rotate-45 bg-white" />
            </motion.div>
          )}
          <div style={{ width: figureW, height: figureH }}>
            <GatTayaw3D width={figureW} height={figureH} facing="left" framing="bust"
              greetKey={story.slug} speaking={speaking} />
          </div>
        </div>

        {count > 1 && (
          <>
            <button onClick={prev} aria-label="Previous story"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full text-white flex items-center justify-center transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(11,61,145,0.55)' }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} aria-label="Next story"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full text-white flex items-center justify-center transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(11,61,145,0.55)' }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* How-this-works: what every control on the card does. */}
        <button onClick={() => setShowHelp(true)} aria-label="How this works"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:opacity-90"
          style={{ backgroundColor: 'rgba(11,61,145,0.55)' }}>
          <HelpCircle className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 z-40 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(2,8,24,0.82)', backdropFilter: 'blur(2px)' }}>
              <motion.div
                initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <p className="font-bold text-gray-900" style={{ fontFamily: HL }}>How to explore the stories</p>
                  <button onClick={() => setShowHelp(false)} aria-label="Close"
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ul className="p-4 space-y-3.5 max-h-[62vh] overflow-y-auto">
                  {[
                    { icon: <User className="w-4 h-4" />, title: 'Gat Tayaw, your storyteller',
                      desc: 'The guide standing on the card. He reads the story on screen and moves while he speaks.' },
                    { icon: <MessageCircle className="w-4 h-4" />, title: 'His speech bubble',
                      desc: 'A short line from Gat Tayaw, typed out as he talks.' },
                    { icon: <Volume2 className="w-4 h-4" />, title: 'Listen',
                      desc: 'Hear Gat Tayaw narrate the story aloud. Tap again to pause.' },
                    { icon: <Languages className="w-4 h-4" />, title: 'EN / FIL',
                      desc: 'Switch the narration between English and Filipino.' },
                    { icon: <ChevronRight className="w-4 h-4" />, title: 'Arrows & the bar below',
                      desc: 'Move between stories. The bar shows how many there are and which one you are on.' },
                    { icon: <BookOpen className="w-4 h-4" />, title: 'Open on its own page',
                      desc: 'Read the full story on its own page, with a link you can share.' },
                  ].map((it, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(11,61,145,0.08)', color: '#1565C0' }}>
                        {it.icon}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900" style={{ fontFamily: HL }}>{it.title}</p>
                        <p className="text-[13px] text-gray-500 leading-snug" style={{ fontFamily: BL }}>{it.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      {/* Listen to this one, and in which language. */}
      <div className={`mt-4 items-center gap-2 ${audioSrc ? 'flex' : 'hidden'}`}>
        <button
          onClick={toggleNarration}
          aria-label={speaking ? 'Pause narration' : 'Listen to Gat Tayaw'}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
          style={{ backgroundColor: blocked ? '#B45309' : '#0B3D91', fontFamily: HL }}
        >
          {speaking ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
          <span className="whitespace-nowrap">{speaking ? 'Pause' : 'Listen'}</span>
        </button>

        <button
          onClick={() => setLang(l => (l === 'en' ? 'fil' : 'en'))}
          aria-label={`Narration language: ${lang === 'en' ? 'English' : 'Filipino'}. Tap to switch.`}
          title="Switch narration language"
          className="px-3 py-2.5 rounded-xl text-xs font-black tracking-wider transition hover:opacity-90"
          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}
        >
          {lang === 'en' ? 'EN' : 'FIL'}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        onEnded={() => setNarrating(false)}
        onPause={() => setNarrating(false)}
        onPlay={() => setNarrating(true)}
      />

      {/* The rail: how many stories, and which one is up. */}
      <div className="mt-6 flex gap-2">
        {stories.map((s, i) => (
          <button key={s.slug} onClick={() => goTo(i)}
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
    </section>
  );
}
