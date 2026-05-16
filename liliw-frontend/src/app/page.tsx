'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, MapPin, History, Leaf, HelpCircle,
  Calendar, ChevronLeft, ChevronRight, Star,
  Compass, UtensilsCrossed, Mountain, Camera, Users, Globe,
  Layers,
} from 'lucide-react';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

/* ─── types & helpers ───────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = { heritage: 'Heritage', spot: 'Nature Spot', dining: 'Dining' };
const TYPE_BADGE:  Record<string, string> = { heritage: '#EF4444',  spot: '#22C55E',       dining: '#F97316' };
const TYPE_BGRADS: Record<string, string[]> = {
  heritage: ['#7B4E00', '#3D2000'],
  spot:     ['#0B3D91', '#051d4d'],
  dining:   ['#1B5E20', '#0a2e10'],
};

const CATEGORY_STYLE: Record<string, string> = {
  advisory:     '#3B82F6',
  announcement: '#8B5CF6',
  press_release:'#EC4899',
  festival:     '#EF4444',
  cultural:     '#F97316',
  competition:  '#EAB308',
  other:        '#6B7280',
};

function extractText(rt: any): string {
  if (!rt) return '';
  if (typeof rt === 'string') return rt;
  if (Array.isArray(rt)) return rt.map((b: any) => b.children?.map((c: any) => c.text || '').join('') || '').join(' ').trim();
  return '';
}

function getDailyFeatured(attractions: any[], count = 6): any[] {
  if (!attractions.length) return [];
  const day   = Math.floor(Date.now() / 86_400_000);
  const start = day % attractions.length;
  const result: any[] = [];
  for (let i = 0; i < count; i++) result.push(attractions[(start + i) % attractions.length]);
  return result;
}

function photoUrl(photos: any[] = []): string | null {
  const p = photos[0];
  if (!p) return null;
  const raw = p?.formats?.medium?.url || p?.formats?.small?.url || p?.url;
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${STRAPI_BASE}${raw}`;
}

/* ─── Bunting decoration ─────────────────────────────────── */
const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign:'middle' }} aria-hidden="true">
      <line x1="0" y1={cy} x2={W} y2={cy} stroke="#9CA3AF" strokeWidth="1.2" />
      {PENNANT.map((color, idx) => {
        const cx = r + idx * spacing;
        return (
          <g key={idx}>
            {Array.from({ length: panels }).map((_, i) => {
              const a1 = -Math.PI / 2 + i * arc;
              const a2 = -Math.PI / 2 + (i + 1) * arc;
              const x1 = (cx + r * Math.cos(a1)).toFixed(2);
              const y1 = (cy + r * Math.sin(a1)).toFixed(2);
              const x2 = (cx + r * Math.cos(a2)).toFixed(2);
              const y2 = (cy + r * Math.sin(a2)).toFixed(2);
              return <path key={i} d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2} Z`}
                fill={i % 2 === 0 ? color : color + 'bb'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Wave divider ───────────────────────────────────────── */
function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ lineHeight: 0, backgroundColor: from }}>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width: '100%', height: 70, display: 'block' }}>
        <path d="M0,0 C480,70 960,0 1440,70 L1440,70 L0,70 Z" fill={to} />
      </svg>
    </div>
  );
}

function WaveUp({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ lineHeight: 0, backgroundColor: from }}>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width: '100%', height: 70, display: 'block' }}>
        <path d="M0,70 C480,0 960,70 1440,0 L1440,70 L0,70 Z" fill={to} />
      </svg>
    </div>
  );
}

/* ─── Festive section heading ────────────────────────────── */
function FestiveHeading({ title, sub, light = false }: { title: string; sub?: string; light?: boolean }) {
  return (
    <div className="text-center mb-10">
      <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
        <Bunting />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wide leading-tight"
          style={{ fontFamily: HL, color: light ? '#ffffff' : '#1E3A8A' }}>
          {title}
        </h2>
        <Bunting flip />
      </div>
      {sub && (
        <p className="text-sm mt-2 max-w-xl mx-auto"
          style={{ fontFamily: BL, color: light ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Image overlay attraction card ─────────────────────── */
function OverlayCard({ item }: { item: any }) {
  const a      = item?.attributes ?? {};
  const cover  = photoUrl(a.photos ?? []);
  const grads  = TYPE_BGRADS[item.type] ?? ['#0B3D91', '#051d4d'];
  const badge  = TYPE_BADGE[item.type] ?? '#1565C0';
  const label  = TYPE_LABELS[item.type] ?? item.type;

  return (
    <Link href={`/attractions/${item.id}`}
      className="block relative rounded-2xl overflow-hidden group shadow-md hover:shadow-2xl transition-shadow"
      style={{ aspectRatio: '4/3' }}>
      {cover
        ? <img src={cover} alt={a.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${grads[0]}, ${grads[1]})` }} />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-base leading-tight mb-2 line-clamp-2"
          style={{ fontFamily: HL }}>{a.name || 'Unnamed'}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-white text-xs font-bold px-2.5 py-0.5 rounded"
            style={{ backgroundColor: badge, fontFamily: HL }}>
            {label}
          </span>
          {a.location && (
            <span className="text-white/90 text-xs font-semibold px-2.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', fontFamily: BL }}>
              {a.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Activity portrait card ─────────────────────────────── */
function ActivityCard({ item }: { item: any }) {
  const a     = item?.attributes ?? {};
  const cover = photoUrl(a.photos ?? []);
  const grads = TYPE_BGRADS[item.type] ?? ['#0B3D91', '#051d4d'];

  return (
    <Link href={`/attractions/${item.id}`}
      className="shrink-0 relative rounded-2xl overflow-hidden group shadow-md"
      style={{ width: 'clamp(140px, 40vw, 200px)', aspectRatio: '2/3', background: `linear-gradient(160deg, ${grads[0]}, ${grads[1]})` }}>
      {cover && <img src={cover} alt={a.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold leading-snug line-clamp-2 mb-1"
          style={{ fontFamily: HL, fontSize: 14 }}>{a.name}</p>
        <span className="text-xs font-semibold" style={{ color: '#F5C518', fontFamily: BL }}>Explore →</span>
      </div>
    </Link>
  );
}

/* ─── News overlay card ──────────────────────────────────── */
function NewsOverlayCard({ item }: { item: any }) {
  const badgeColor = CATEGORY_STYLE[item.category as string] || '#1565C0';
  return (
    <Link href={item.link || '/news'}
      className="block relative rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-shadow"
      style={{ aspectRatio: '16/9' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-sm leading-tight mb-2 line-clamp-2"
          style={{ fontFamily: HL }}>{item.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-white text-xs font-bold px-2.5 py-0.5 rounded uppercase"
            style={{ backgroundColor: badgeColor, fontFamily: HL }}>
            {item.category?.replace('_', ' ') || 'NEWS'}
          </span>
          {item.isEvent && (
            <span className="text-white text-xs font-bold px-2.5 py-0.5 rounded uppercase"
              style={{ backgroundColor: '#22C55E', fontFamily: HL }}>EVENT</span>
          )}
        </div>
        {item.date && <p className="text-white/50 text-xs mt-1.5" style={{ fontFamily: BL }}>{item.date}</p>}
      </div>
    </Link>
  );
}

/* ─── Quick category icon links ──────────────────────────── */
const QUICK_LINKS = [
  { icon: History,        label: 'Heritage',    color: '#EF4444', href: '/heritage' },
  { icon: UtensilsCrossed,label: 'Dining',      color: '#F97316', href: '/dining' },
  { icon: Camera,         label: 'Arts',        color: '#EAB308', href: '/arts' },
  { icon: Mountain,       label: 'Nature',      color: '#22C55E', href: '/tourist-spots' },
  { icon: Calendar,       label: 'Events',      color: '#0D9488', href: '/news' },
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
/* ─── Featured videos ────────────────────────────────────── */
const FEATURED_VIDEOS = [
  { id: 'blPBoHVC0aw', title: 'Liliw, Laguna', views: '' },
  { id: '5VejBh1lK7o', title: 'Liliw Laguna Tour', views: '' },
  { id: 'FO_xho6dbbM', title: 'Explore Liliw', views: '' },
];

function FeaturedVideos() {
  const [activeId, setActiveId] = useState(FEATURED_VIDEOS[0].id);
  const others = FEATURED_VIDEOS.filter(v => v.id !== activeId);
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <FestiveHeading title="Featured Videos" sub="Watch and experience the beauty of Liliw" />
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main player */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
              <iframe
                key={activeId}
                src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`}
                title="Featured Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none' }}
              />
            </div>
            <p className="mt-3 font-bold text-gray-900 text-base" style={{ fontFamily: HL }}>
              {FEATURED_VIDEOS.find(v => v.id === activeId)?.title}
            </p>
          </div>

          {/* Sidebar thumbnails */}
          <div className="lg:w-72 shrink-0">
            <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider" style={{ fontFamily: HL }}>
              Other Videos
            </p>
            <div className="space-y-3">
              {others.map(v => (
                <button key={v.id} onClick={() => setActiveId(v.id)}
                  className="w-full text-left flex gap-3 group rounded-xl overflow-hidden hover:bg-gray-50 transition p-1">
                  <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 120, aspectRatio: '16/9' }}>
                    <img
                      src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
                      <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-800 ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug" style={{ fontFamily: HL }}>
                      {v.title}
                    </p>
                    {v.views && <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: BL }}>{v.views}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [heroSlide,      setHeroSlide]      = useState<any>(null);
  const [featured,       setFeatured]       = useState<any[]>([]);
  const [allAttractions, setAllAttractions] = useState<any[]>([]);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [actIdx,         setActIdx]         = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── real viewport height for mobile (fixes iOS 100vh bug) ── */
  useEffect(() => {
    const setVH = () =>
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVH();
    window.addEventListener('resize', setVH, { passive: true });
    return () => window.removeEventListener('resize', setVH);
  }, []);

  /* ── data fetching ──────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/strapi/hero-slides')
      .then(r => r.json())
      .then(d => {
        if (d?.data?.length) {
          const item = d.data[0];
          const a    = item.attributes || item;
          const raw  = a.image?.data?.attributes?.url || a.image?.url;
          const img  = raw ? (raw.startsWith('http') ? raw : `${STRAPI_BASE}${raw}`) : null;
          setHeroSlide({ ...a, image: img });
        }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/strapi/attractions')
      .then(r => r.json())
      .then(d => {
        const data: any[] = d.data || [];
        setAllAttractions(data);
        setFeatured(getDailyFeatured(data, 6));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/strapi/news-events?limit=4')
      .then(r => r.json())
      .catch(() => null)
      .then((combined: any) => {
        const items: any[] = [];
        (combined?.news?.data || []).forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'News', isEvent: false,
            date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
            category: a.category || 'announcement',
            excerpt: extractText(a.content).substring(0, 120) || 'Read more.',
            link: '/news',
          });
        });
        (combined?.events?.data || []).forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'Event', isEvent: true,
            date: a.date_start ? new Date(a.date_start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
            category: a.category || 'other',
            excerpt: extractText(a.description).substring(0, 120) || `At ${a.venue || 'Liliw'}`,
            link: '/news',
          });
        });
        if (items.length) setAnnouncements(items.slice(0, 4));
      });
  }, []);

  /* ── activities scroll ──────────────────────────────────── */
  const activities = allAttractions.slice(0, 12);
  const scrollActivities = (dir: 1 | -1) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* ══════════════════════════════════════════════════════
          HERO — full-screen video
          ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden w-full hero-full">
        <div className="absolute inset-0" style={{ background: '#0B3D91' }}>
          {process.env.NEXT_PUBLIC_HERO_VIDEO_URL ? (
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL} type="video/mp4" />
            </video>
          ) : heroSlide?.image ? (
            <img src={heroSlide.image} alt="Liliw hero" className="w-full h-full object-cover" />
          ) : null}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUICK CATEGORY ICONS — colored squares over navy bg
          ══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#1E3A8A' }}>
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-center text-white/60 text-xs font-bold uppercase tracking-widest mb-8"
            style={{ fontFamily: HL }}>
            Discover Liliw
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {QUICK_LINKS.map(({ icon: Icon, label, color, href }) => (
              <motion.div key={href} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Link href={href} className="flex flex-col items-center gap-2.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: color }}>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.8} />
                  </div>
                  <p className="text-white font-bold text-xs sm:text-sm tracking-wide"
                    style={{ fontFamily: HL }}>{label}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: navy → white */}
      <WaveDown from="#1E3A8A" to="#ffffff" />

      {/* ══════════════════════════════════════════════════════
          FEATURED ATTRACTIONS
          ══════════════════════════════════════════════════════ */}
      <section className="py-14 max-w-7xl mx-auto px-4">
        <FestiveHeading
          title="Explore Liliw"
          sub="Hand-picked attractions waiting to be discovered" />

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((item, i) => (
              <motion.div key={`${item.id}-${i}`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }} viewport={{ once: true }}>
                <OverlayCard item={item} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-200 animate-pulse" style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/attractions"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0', color: 'white', fontFamily: BL,
              boxShadow: '0 4px 16px rgba(21,101,192,0.3)' }}>
            View All Attractions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Wave: white → navy */}
      <WaveUp from="#ffffff" to="#0B3D91" />

      {/* ══════════════════════════════════════════════════════
          THINGS TO DO — dark navy scroll section
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#0B3D91', paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-7xl mx-auto px-4">
          <FestiveHeading title="Things to Do" sub="Activities and experiences across Liliw" light />

          <div className="flex items-center justify-end gap-2 mb-5 -mt-4">
            <button onClick={() => scrollActivities(-1)}
              className="w-9 h-9 rounded-full border flex items-center justify-center transition hover:bg-white/20 text-white"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollActivities(1)}
              className="w-9 h-9 rounded-full border flex items-center justify-center transition hover:bg-white/20 text-white"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {activities.length > 0
              ? activities.map((item, i) => <ActivityCard key={`act-${item.id}-${i}`} item={item} />)
              : [...Array(6)].map((_, i) => (
                  <div key={i} className="shrink-0 rounded-2xl bg-white/10 animate-pulse"
                    style={{ width: 200, aspectRatio: '2/3' }} />
                ))
            }
          </div>

          {/* Quick links row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {[
              { href: '/map',         label: 'Interactive Map',  icon: <MapPin className="w-5 h-5" />,   sub: 'Navigate with ease' },
              { href: '/itineraries', label: 'Curated Tours',    icon: <Compass className="w-5 h-5" />,  sub: 'Hand-picked itineraries' },
              { href: '/immersive',   label: '3D Virtual Tour',  icon: <Layers className="w-5 h-5" />,   sub: 'Explore from anywhere' },
            ].map(({ href, label, icon, sub }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center text-center p-5 rounded-2xl transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(245,197,24,0.15)', color: '#F5C518' }}>
                  {icon}
                </div>
                <p className="font-bold text-white text-sm mb-0.5" style={{ fontFamily: HL }}>{label}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: BL }}>{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: navy → white */}
      <WaveDown from="#0B3D91" to="#ffffff" />

      {/* ══════════════════════════════════════════════════════
          LATEST NEWS & EVENTS
          ══════════════════════════════════════════════════════ */}
      {announcements.length > 0 && (
        <section className="py-14 max-w-7xl mx-auto px-4">
          <FestiveHeading
            title="Latest from Liliw"
            sub="News, announcements and upcoming events" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {announcements.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }}>
                <NewsOverlayCard item={item} />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/news"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm border-2 transition hover:bg-blue-50"
              style={{ borderColor: '#1565C0', color: '#1565C0', fontFamily: BL }}>
              View More News <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Wave: white → light blue */}
      <WaveUp from="#ffffff" to="#EFF6FF" />

      {/* ══════════════════════════════════════════════════════
          DISCOVER MORE — CTA section on light blue
          ══════════════════════════════════════════════════════ */}
      <section className="py-16" style={{ backgroundColor: '#EFF6FF' }}>
        <div className="max-w-7xl mx-auto px-4">
          <FestiveHeading
            title="Discover the Soul of Liliw"
            sub="Dive deeper into what makes this town extraordinary" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                href: '/heritage', label: 'Heritage',
                title: 'History & Heritage Sites',
                sub: 'Walk through centuries of rich Filipino history in our preserved landmarks and ancestral houses.',
                bg: '#0B3D91', badge: '#EF4444',
              },
              {
                href: '/culture', label: 'Culture',
                title: 'Culture & Traditions',
                sub: "Experience vibrant festivals, folk arts, and the enduring customs of Liliw's communities.",
                bg: '#1565C0', badge: '#F97316',
              },
              {
                href: '/community', label: 'Community',
                title: 'Participate & Contribute',
                sub: 'Join volunteer programs, cultural events, and community initiatives that make a difference.',
                bg: '#0D9488', badge: '#EAB308',
              },
            ].map(({ href, label, title, sub, bg, badge }) => (
              <Link key={href} href={href}
                className="group block p-7 rounded-2xl text-white relative overflow-hidden transition-transform hover:scale-[1.02] shadow-lg"
                style={{ background: bg }}>
                <div className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.8) 8px, rgba(255,255,255,0.8) 9px)' }} />
                <div className="relative z-10">
                  <span className="inline-block text-white text-xs font-black uppercase px-3 py-1 rounded mb-4"
                    style={{ backgroundColor: badge, fontFamily: HL }}>
                    {label}
                  </span>
                  <h3 className="font-bold mb-3 leading-snug text-lg" style={{ fontFamily: HL }}>{title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed mb-5" style={{ fontFamily: BL }}>{sub}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all"
                    style={{ color: badge, fontFamily: BL }}>
                    Explore <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: light blue → white */}
      <WaveDown from="#EFF6FF" to="#ffffff" />

      {/* ══════════════════════════════════════════════════════
          PLAN YOUR VISIT
          ══════════════════════════════════════════════════════ */}
      <section className="py-14 pb-20 max-w-7xl mx-auto px-4">
        <FestiveHeading title="Plan Your Visit" sub="Everything you need to make the most of your trip" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: '/faq', icon: <HelpCircle className="w-5 h-5" />,
              title: 'Frequently Asked Questions',
              sub: 'Find answers about visiting hours, transport, and more.',
              color: '#1565C0',
            },
            {
              href: '/map', icon: <MapPin className="w-5 h-5" />,
              title: 'Interactive Map',
              sub: 'Navigate all attractions and spots with our live map.',
              color: '#0B3D91',
            },
            {
              href: '/itineraries', icon: <Leaf className="w-5 h-5" />,
              title: 'Tour Packages',
              sub: 'Browse curated day-tours and multi-day itineraries.',
              color: '#0D9488',
            },
          ].map(({ href, icon, title, sub, color }) => (
            <Link key={href} href={href}
              className="flex gap-4 items-start p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}14`, color }}>
                {icon}
              </div>
              <div>
                <h4 className="font-bold mb-1 text-gray-900"
                  style={{ fontFamily: HL, fontSize: 15 }}>
                  {title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: BL }}>{sub}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold"
                  style={{ color, fontFamily: BL }}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED VIDEOS
          ══════════════════════════════════════════════════════ */}
      <FeaturedVideos />

    </div>
  );
}
