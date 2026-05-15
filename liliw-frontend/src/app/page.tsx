'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, MapPin, History, Leaf, HelpCircle,
  Calendar, Bell, ChevronLeft, ChevronRight, Star, Layers,
  Compass, UtensilsCrossed, Mountain, Camera, Users, Globe,
} from 'lucide-react';
import AnnouncementBar from '@/components/AnnouncementBar';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

/* ─── types ─────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string>   = { heritage: 'Heritage Site', spot: 'Tourist Spot', dining: 'Dining & Food' };
const TYPE_COLORS: Record<string, string>   = { heritage: '#F5C518', spot: '#1565C0', dining: '#2E7D32' };
const TYPE_BGRADS: Record<string, string[]> = {
  heritage: ['#7B4E00', '#3D2000'],
  spot:     ['#0B3D91', '#051d4d'],
  dining:   ['#1B5E20', '#0a2e10'],
};

const CATEGORY_TABS = [
  { key: 'all',      label: 'All',          icon: Globe },
  { key: 'heritage', label: 'Heritage',     icon: History },
  { key: 'spot',     label: 'Nature',       icon: Mountain },
  { key: 'dining',   label: 'Dining',       icon: UtensilsCrossed },
  { key: 'culture',  label: 'Culture',      icon: Camera },
  { key: 'events',   label: 'Events',       icon: Calendar },
  { key: 'map',      label: 'Interactive Map', icon: MapPin },
];

const CATEGORY_HREF: Record<string, string> = {
  all: '/attractions', heritage: '/attractions?type=heritage', spot: '/attractions?type=spot',
  dining: '/dining', culture: '/culture', events: '/news', map: '/map',
};

const CATEGORY_STYLE = {
  advisory:     'bg-blue-100 text-blue-700',
  announcement: 'bg-indigo-100 text-indigo-700',
  press_release:'bg-purple-100 text-purple-700',
  festival:     'bg-red-100 text-red-700',
  cultural:     'bg-amber-100 text-amber-700',
  competition:  'bg-orange-100 text-orange-700',
  other:        'bg-gray-100 text-gray-600',
};

/* ─── helpers ───────────────────────────────────────────── */
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

/* ─── section heading ───────────────────────────────────── */
function SectionHeading({ label, title, light = false }: { label: string; title: string; light?: boolean }) {
  return (
    <div className={`mb-10 ${light ? '' : ''}`}>
      <p className="section-label mb-3" style={{ color: light ? 'rgba(245,197,24,0.9)' : '#1565C0' }}>{label}</p>
      <h2 className="font-display gold-underline"
        style={{
          fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif',
          fontSize: 'clamp(28px,4vw,40px)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: light ? '#fff' : '#1A1A2E',
        }}>
        {title}
      </h2>
    </div>
  );
}

/* ─── editorial attraction card ─────────────────────────── */
function AttractionCard({ item }: { item: any }) {
  const a      = item?.attributes ?? {};
  const cover  = photoUrl(a.photos ?? []);
  const color  = TYPE_COLORS[item.type] ?? '#1565C0';
  const label  = TYPE_LABELS[item.type] ?? item.type;
  const grads  = TYPE_BGRADS[item.type] ?? ['#0B3D91', '#051d4d'];

  return (
    <Link href={`/attractions/${item.id}`} className="editorial-card block rounded-2xl overflow-hidden bg-white shadow-sm"
      style={{ boxShadow: '0 2px 16px rgba(11,61,145,0.07)' }}>
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {cover
          ? <img src={cover} alt={a.name} className="card-img w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${grads[0]}, ${grads[1]})` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute bottom-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: color, fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
      {/* Body */}
      <div className="p-4" style={{ backgroundColor: '#F9F6F0' }}>
        <p className="section-label mb-1" style={{ color: '#1565C0', fontSize: 11 }}>
          {a.category || (item.type === 'heritage' ? 'Historical' : item.type === 'spot' ? 'Nature' : 'Cuisine')}
        </p>
        <h3 className="font-semibold mb-1 line-clamp-1"
          style={{ fontFamily: 'var(--font-heading), Outfit, sans-serif', fontSize: 15, color: '#1A1A2E' }}>
          {a.name || 'Unnamed'}
        </h3>
        {a.location && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />{a.location}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ─── activities portrait card ──────────────────────────── */
function ActivityCard({ item }: { item: any }) {
  const a     = item?.attributes ?? {};
  const cover = photoUrl(a.photos ?? []);
  const grads = TYPE_BGRADS[item.type] ?? ['#0B3D91', '#051d4d'];

  return (
    <Link href={`/attractions/${item.id}`}
      className="shrink-0 relative rounded-2xl overflow-hidden group"
      style={{ width: 200, aspectRatio: '2/3', background: `linear-gradient(160deg, ${grads[0]}, ${grads[1]})` }}>
      {cover && <img src={cover} alt={a.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,61,145,0.9) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-medium leading-snug line-clamp-2 mb-2"
          style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>{a.name}</p>
        <span className="text-xs font-semibold" style={{ color: '#F5C518', fontFamily: 'var(--font-body)' }}>
          Explore →
        </span>
      </div>
    </Link>
  );
}

/* ─── news card (horizontal) ────────────────────────────── */
function NewsCard({ item }: { item: any }) {
  return (
    <Link href={item.link || '/news'}
      className="editorial-card flex gap-4 rounded-xl overflow-hidden bg-white p-4"
      style={{ borderLeft: '3px solid #1565C0', boxShadow: '0 2px 12px rgba(11,61,145,0.06)' }}>
      <div className="flex-1 min-w-0">
        <p className="section-label mb-1" style={{ color: '#1565C0', fontSize: 11 }}>
          {item.category?.replace('_', ' ') || 'News'}
          {item.isEvent && <span className="ml-2 text-green-600">· Event</span>}
        </p>
        {item.date && <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'var(--font-body)' }}>{item.date}</p>}
        <h3 className="font-semibold line-clamp-2 mb-1"
          style={{ fontFamily: 'var(--font-heading), Outfit, sans-serif', fontSize: 14, color: '#1A1A2E' }}>
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>{item.excerpt}</p>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();

  const [heroSlide,      setHeroSlide]      = useState<any>(null);
  const [featured,       setFeatured]       = useState<any[]>([]);
  const [allAttractions, setAllAttractions] = useState<any[]>([]);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchType,     setSearchType]     = useState('all');
  const [actIdx,         setActIdx]         = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  /* ── hero search ────────────────────────────────────────── */
  const handleSearch = () => {
    const q = searchQuery.trim();
    const url = q
      ? `/attractions?q=${encodeURIComponent(q)}&type=${searchType}`
      : searchType !== 'all' ? `/attractions?type=${searchType}` : '/attractions';
    router.push(url);
  };

  /* ── activities scroll ──────────────────────────────────── */
  const activities = allAttractions.slice(0, 12);
  const scrollActivities = (dir: 1 | -1) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* ── Announcement Bar ────────────────────────────────── */}
      <AnnouncementBar defaultOpen={true} />

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col justify-end overflow-hidden"
        style={{ minHeight: 'calc(100vh - 56px)' }}>

        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 55%, #0a3580 100%)' }}>
          {heroSlide?.image && (
            <img src={heroSlide.image} alt="Liliw hero" className="w-full h-full object-cover opacity-50" />
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(11,61,145,0.97) 0%, rgba(11,61,145,0.55) 50%, rgba(11,61,145,0.15) 100%)' }} />

        {/* Decorative orbs */}
        <motion.div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F5C518, transparent)' }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-40 left-10 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <motion.p className="section-label mb-4" style={{ color: '#F5C518' }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Liliw, Laguna · Philippines
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-display), "Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(44px, 7.5vw, 80px)',
              fontWeight: 700, lineHeight: 1.05, color: '#fff',
              marginBottom: 20, maxWidth: 720,
            }}>
            {heroSlide?.title || <>Where Heritage<br />Meets Paradise</>}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif',
              fontSize: 18, color: 'rgba(255,255,255,0.78)', maxWidth: 520,
              lineHeight: 1.65, marginBottom: 32,
            }}>
            {heroSlide?.subtitle || 'Discover century-old churches, pristine waterfalls, and vibrant local traditions in the heart of Laguna.'}
          </motion.p>

          <motion.div className="flex flex-wrap gap-3 mb-10"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Link href="/attractions"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                backgroundColor: '#F5C518', color: '#0B3D91',
                padding: '13px 30px', borderRadius: 50,
                fontFamily: 'var(--font-body)', fontSize: 15,
                boxShadow: '0 4px 20px rgba(245,197,24,0.4)',
              }}>
              Start Exploring <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/itineraries"
              className="inline-flex items-center gap-2 font-semibold transition-all hover:bg-white/20"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                color: 'white', padding: '13px 30px', borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-body)', fontSize: 15,
              }}>
              View Itineraries
            </Link>
          </motion.div>

          {/* Frosted glass search bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-2 items-center flex-wrap sm:flex-nowrap"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.22)',
              padding: '10px 14px',
              maxWidth: 680,
            }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search destinations, activities…"
              style={{
                flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                color: 'white', fontFamily: 'var(--font-body)', fontSize: 14,
              }} />
            <select value={searchType} onChange={e => setSearchType(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, color: 'white', padding: '6px 10px', fontSize: 13,
                fontFamily: 'var(--font-body)', outline: 'none',
              }}>
              <option value="all"      style={{ background: '#0B3D91' }}>All Types</option>
              <option value="heritage" style={{ background: '#0B3D91' }}>Heritage</option>
              <option value="spot"     style={{ background: '#0B3D91' }}>Nature</option>
              <option value="dining"   style={{ background: '#0B3D91' }}>Dining</option>
            </select>
            <button onClick={handleSearch}
              className="shrink-0 font-semibold transition-all hover:opacity-90"
              style={{
                background: '#F5C518', color: '#0B3D91', border: 'none',
                borderRadius: 9, padding: '9px 22px',
                fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
              }}>
              Search
            </button>
          </motion.div>
        </div>

        {/* Diagonal cut → Deep Navy */}
        <div className="absolute bottom-0 left-0 right-0 z-10" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
            <polygon points="0,56 1440,0 1440,56" fill="#0B3D91" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY PILL NAV
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#0B3D91', paddingTop: 20, paddingBottom: 20 }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map(({ key, label, icon: Icon }) => {
              const active = activeCategory === key;
              return (
                <button key={key}
                  onClick={() => { setActiveCategory(key); router.push(CATEGORY_HREF[key]); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 50, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                    whiteSpace: 'nowrap', border: 'none',
                    transition: 'all 150ms ease',
                    backgroundColor: active ? '#F5C518' : 'transparent',
                    color: active ? '#0B3D91' : 'rgba(255,255,255,0.65)',
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED ATTRACTIONS
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-2">
          <SectionHeading label="Curated for You" title="Featured Attractions" />
          <Link href="/attractions" className="shrink-0 mb-10 flex items-center gap-1.5 font-semibold text-sm"
            style={{ color: '#1565C0', fontFamily: 'var(--font-body)' }}>
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((item, i) => (
              <motion.div key={`${item.id}-${i}`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }} viewport={{ once: true }}>
                <AttractionCard item={item} />
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
      </section>

      {/* ══════════════════════════════════════════════════════
          THINGS TO DO (dark navy section)
          ══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#0B3D91', paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <SectionHeading label="Discover Liliw" title="Things to Do" light />
            <div className="flex gap-2 mb-10 shrink-0">
              <button onClick={() => scrollActivities(-1)}
                className="w-10 h-10 rounded-full border flex items-center justify-center transition hover:bg-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollActivities(1)}
                className="w-10 h-10 rounded-full border flex items-center justify-center transition hover:bg-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { href: '/map',         label: 'Interactive Map',   icon: <MapPin className="w-5 h-5" />,    sub: 'Navigate with ease' },
              { href: '/itineraries', label: 'Curated Tours',     icon: <Compass className="w-5 h-5" />,   sub: 'Hand-picked itineraries' },
              { href: '/immersive',   label: '3D Virtual Tour',   icon: <Camera className="w-5 h-5" />,    sub: 'Explore from anywhere' },
            ].map(({ href, label, icon, sub }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center text-center p-5 rounded-2xl transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(245,197,24,0.15)', color: '#F5C518' }}>
                  {icon}
                </div>
                <p className="font-semibold text-white text-sm mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{label}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-body)' }}>{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LATEST FROM LILIW (news)
          ══════════════════════════════════════════════════════ */}
      {announcements.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-2">
            <SectionHeading label="News & Events" title="Latest from Liliw" />
            <Link href="/news" className="shrink-0 mb-10 flex items-center gap-1.5 font-semibold text-sm"
              style={{ color: '#1565C0', fontFamily: 'var(--font-body)' }}>
              All news <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {announcements.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }}>
                <NewsCard item={item} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          HERITAGE · CULTURE · COMMUNITY (3-col CTA)
          ══════════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <SectionHeading label="Explore Deeper" title="Discover the Soul of Liliw" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              href: '/heritage', label: 'Heritage',
              title: 'History & Heritage Sites',
              sub: 'Walk through centuries of rich Filipino history in our preserved landmarks and ancestral houses.',
              icon: <History className="w-6 h-6" />,
              bg: '#0B3D91', accent: '#F5C518',
            },
            {
              href: '/culture', label: 'Culture',
              title: 'Culture & Traditions',
              sub: 'Experience vibrant festivals, folk arts, and the enduring customs of Liliw's communities.',
              icon: <Camera className="w-6 h-6" />,
              bg: '#1565C0', accent: '#F5C518',
            },
            {
              href: '/community', label: 'Community',
              title: 'Participate & Contribute',
              sub: 'Join volunteer programs, cultural events, and community initiatives that make a difference.',
              icon: <Users className="w-6 h-6" />,
              bg: '#2E7D32', accent: '#F5C518',
            },
          ].map(({ href, label, title, sub, icon, bg, accent }) => (
            <Link key={href} href={href}
              className="group block p-7 rounded-2xl text-white relative overflow-hidden transition-transform hover:scale-[1.02]"
              style={{ background: bg }}>
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.8) 8px, rgba(255,255,255,0.8) 9px)' }} />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${accent}22`, color: accent }}>{icon}</div>
                <p className="section-label mb-2" style={{ color: accent }}>{label}</p>
                <h3 className="font-bold mb-3 leading-snug"
                  style={{ fontFamily: 'var(--font-heading), Outfit, sans-serif', fontSize: 18 }}>
                  {title}
                </h3>
                <p className="text-white/65 text-sm leading-relaxed mb-5" style={{ fontFamily: 'var(--font-body)' }}>{sub}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                  style={{ color: accent, fontFamily: 'var(--font-body)' }}>
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUICK ACCESS ROW
          ══════════════════════════════════════════════════════ */}
      <section className="pb-20 max-w-7xl mx-auto px-4">
        <SectionHeading label="Visitor Resources" title="Plan Your Visit" />
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
              color: '#2E7D32',
            },
          ].map(({ href, icon, title, sub, color }) => (
            <Link key={href} href={href}
              className="editorial-card flex gap-4 items-start p-5 rounded-2xl bg-white"
              style={{ boxShadow: '0 2px 16px rgba(11,61,145,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}12`, color }}>
                {icon}
              </div>
              <div>
                <h4 className="font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-heading), Outfit, sans-serif', fontSize: 15, color: '#1A1A2E' }}>
                  {title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{sub}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold"
                  style={{ color, fontFamily: 'var(--font-body)' }}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
