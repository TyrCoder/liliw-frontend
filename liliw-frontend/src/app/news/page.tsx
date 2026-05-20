'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Bell, X, MapPin, Maximize2, CheckCircle, Loader2 } from 'lucide-react';
import PhotoLightbox from '@/components/PhotoLightbox';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign: 'middle' }}>
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

const extractText = (richText: any): string => {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText))
    return richText.map((b: any) => b.children?.map((c: any) => c.text || '').join('') || '').join(' ').trim();
  return '';
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  advisory:     { bg: 'rgba(21,101,192,0.1)',  text: '#1565C0' },
  announcement: { bg: 'rgba(11,61,145,0.1)',   text: '#0B3D91' },
  press_release:{ bg: 'rgba(103,58,183,0.1)',  text: '#673AB7' },
  festival:     { bg: 'rgba(245,197,24,0.15)', text: '#B8860B' },
  cultural:     { bg: 'rgba(245,197,24,0.1)',  text: '#9A7D0A' },
  competition:  { bg: 'rgba(46,125,50,0.1)',   text: '#2E7D32' },
  other:        { bg: 'rgba(0,0,0,0.06)',      text: '#555' },
};

interface NewsItem {
  title: string;
  date: string;
  dateKey: string;
  category: string;
  excerpt: string;
  fullText: string;
  source: string;
  isEvent: boolean;
  slug: string;
  photos: string[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateKey(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function EventCalendar({
  eventDates,
  selectedDay,
  onSelectDay,
}: {
  eventDates: Record<string, NewsItem[]>;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const todayKey     = toDateKey(today.toISOString());

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-50 transition"
          style={{ color: '#0B3D91' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-base" style={{ color: '#0B3D91', fontFamily: HL }}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={nextMonth}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-50 transition"
          style={{ color: '#0B3D91' }}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-sm font-semibold py-1.5" style={{ color: '#9CA3AF', fontFamily: HL }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasEvents = !!eventDates[key];
          const isToday   = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(isSelected ? null : key)}
              className={`
                aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center
                relative transition-all
                ${isSelected ? 'text-white shadow-sm' :
                  isToday    ? 'font-bold' :
                  hasEvents  ? 'hover:bg-blue-50' :
                               'text-gray-400 hover:bg-gray-50'}
              `}
              style={{
                backgroundColor: isSelected ? '#0B3D91' : isToday ? 'rgba(11,61,145,0.08)' : undefined,
                color: isSelected ? '#fff' : isToday ? '#0B3D91' : hasEvents ? '#1A1A2E' : undefined,
                fontFamily: BL,
              }}>
              {day}
              {hasEvents && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: 5, height: 5,
                    backgroundColor: isSelected ? '#F5C518' : '#1565C0',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'rgba(0,0,0,0.06)', color: '#9CA3AF', fontFamily: BL }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Has event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded text-center text-blue-700 font-bold text-xs leading-4" style={{ backgroundColor: 'rgba(11,61,145,0.08)' }}>•</span> Today
        </span>
      </div>

      {/* Selected day events preview */}
      <AnimatePresence>
        {selectedDay && eventDates[selectedDay] && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <p className="text-sm font-semibold" style={{ color: '#0B3D91', fontFamily: HL }}>
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {eventDates[selectedDay].map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }} />
                  <p className="text-sm leading-snug" style={{ color: '#1A1A2E', fontFamily: BL }}>{ev.title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

function extractPhotos(raw: any): string[] {
  const lists = [
    raw?.photos?.data ?? raw?.photos,
    raw?.cover_image?.data ? [raw.cover_image.data] : raw?.cover_image ? [raw.cover_image] : [],
  ];
  const urls: string[] = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      const url = p?.attributes?.url ?? p?.url;
      if (url) urls.push(url.startsWith('http') ? url : `${STRAPI_BASE}${url}`);
    }
  }
  return [...new Set(urls)];
}

function NewsDetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const catStyle = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.other;

  useEffect(() => {
    if (item.photos.length < 2) return;
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % item.photos.length), 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [item.photos.length]);

  const go = (dir: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(c => (c + dir + item.photos.length) % item.photos.length);
    if (item.photos.length > 1)
      timerRef.current = setInterval(() => setCurrent(c => (c + 1) % item.photos.length), 3500);
  };

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">

        {/* Carousel / header */}
        {item.photos.length > 0 ? (
          <div className="relative h-64 shrink-0 overflow-hidden bg-gray-900">
            <AnimatePresence mode="wait">
              <motion.img key={current} src={item.photos[current]} alt={item.title}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                onClick={() => setLightbox(true)}
                className="absolute inset-0 w-full h-full object-contain cursor-zoom-in" />
            </AnimatePresence>
            {item.photos.length > 1 && (
              <>
                <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {item.photos.map((_, i) => (
                    <button key={i} onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setCurrent(i); }}
                      className="rounded-full transition-all"
                      style={{ width: i === current ? 20 : 8, height: 8, backgroundColor: i === current ? '#F5C518' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <button onClick={() => setLightbox(true)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition"
              title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative h-16 shrink-0" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
              style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: HL }}>
              {item.category.replace('_', ' ')}
            </span>
            {item.isEvent && (
              <span className="px-2 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#C2410C', fontFamily: HL }}>
                Event
              </span>
            )}
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: BL }}>
              <Calendar className="w-3.5 h-3.5" />
              {item.date ? new Date(item.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: '#1A1A2E', fontFamily: HL }}>{item.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: BL }}>
            {item.fullText || item.excerpt}
          </p>
          {item.source && (
            <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400" style={{ fontFamily: BL }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />{item.source}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
    <AnimatePresence>
      {lightbox && item.photos.length > 0 && (
        <PhotoLightbox photos={item.photos} initial={current} onClose={() => setLightbox(false)} />
      )}
    </AnimatePresence>
    </>
  );
}

export default function NewsPage() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [subEmail,  setSubEmail]  = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      });
      setSubStatus(res.ok ? 'success' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  useEffect(() => {
    fetch('/api/strapi/news-events')
      .then(r => r.json())
      .catch(() => null)
      .then((combined: any) => {
        const items: NewsItem[] = [];
        combined?.news?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          const date = a.publishedAt || a.createdAt || '';
          const full = extractText(a.content);
          items.push({
            title: a.title || 'News Item',
            date,
            dateKey: toDateKey(date),
            category: a.category || 'announcement',
            excerpt: full.substring(0, 200) || 'Read this news item for more information.',
            fullText: full,
            source: 'Liliw Tourism Office',
            isEvent: false,
            slug: a.slug || a.documentId || String(item.id),
            photos: extractPhotos(a),
          });
        });
        combined?.events?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          const date = a.date_start || a.createdAt || '';
          const full = extractText(a.description);
          items.push({
            title: a.title || 'Upcoming Event',
            date,
            dateKey: toDateKey(date),
            category: a.category || 'other',
            excerpt: full.substring(0, 200) || `Event at ${a.venue || 'Liliw'}`,
            fullText: full,
            source: a.venue || 'Liliw',
            isEvent: true,
            slug: a.slug || a.documentId || String(item.id),
            photos: extractPhotos(a),
          });
        });
        if (items.length > 0) items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const eventDates = useMemo(() => {
    const map: Record<string, NewsItem[]> = {};
    news.filter(n => n.isEvent && n.dateKey).forEach(n => {
      if (!map[n.dateKey]) map[n.dateKey] = [];
      map[n.dateKey].push(n);
    });
    return map;
  }, [news]);

  const displayed = useMemo(() => {
    if (!selectedDay) return news;
    return news.filter(n => n.dateKey === selectedDay);
  }, [news, selectedDay]);

  const hasEvents = news.some(n => n.isEvent);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F6F0' }} suppressHydrationWarning>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)', borderBottom: '2px solid #F5C518' }}>
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group text-sm" style={{ color: '#F5C518', fontFamily: BL }}>
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <Bunting />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>
                News &amp; Events
              </h1>
              <Bunting flip />
            </div>
            <p className="text-white/70 text-sm sm:text-base text-center" style={{ fontFamily: BL }}>
              Stay updated on Liliw events, festivals, and community initiatives
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(11,61,145,0.2)', borderTopColor: '#0B3D91' }} />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[400px_1fr] gap-8 items-start">

            {/* ── Calendar sidebar (LEFT) ── */}
            <div className="lg:sticky lg:top-24 mb-8 lg:mb-0">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0B3D91', fontFamily: HL }}>
                Event Calendar
              </p>
              <EventCalendar
                eventDates={eventDates}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              {!hasEvents && !loading && (
                <p className="mt-3 text-xs text-center text-gray-400" style={{ fontFamily: BL }}>
                  No upcoming events scheduled yet.
                </p>
              )}
            </div>

            {/* ── News list (RIGHT) ── */}
            <div>
              {/* Active filter chip */}
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: '#0B3D91', fontFamily: BL }}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={() => setSelectedDay(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm hover:bg-red-50 transition"
                    style={{ color: '#EF4444' }}>
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {news.length === 0 ? (
                <div className="text-center py-20">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#0B3D91' }} />
                  <p className="font-semibold text-lg text-gray-600" style={{ fontFamily: HL }}>No news or announcements yet</p>
                  <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Check back soon for updates from Liliw.</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#0B3D91' }} />
                  <p className="font-semibold text-gray-600" style={{ fontFamily: HL }}>No items on this date</p>
                  <button onClick={() => setSelectedDay(null)}
                    className="mt-3 text-sm font-semibold" style={{ color: '#1565C0', fontFamily: BL }}>
                    Show all
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayed.map((item, idx) => {
                    const catStyle = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.other;
                    return (
                      <motion.div key={`${item.dateKey}-${idx}`}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                        onClick={() => setSelectedItem(item)}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        style={{ borderLeft: '4px solid #0B3D91' }}>
                        {/* Cover photo strip */}
                        {item.photos.length > 0 && (
                          <div className="h-40 overflow-hidden">
                            <img src={item.photos[0]} alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Bell className="w-4 h-4 shrink-0" style={{ color: '#0B3D91' }} />
                              <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                                style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: HL }}>
                                {item.category.replace('_', ' ')}
                              </span>
                              {item.isEvent && (
                                <span className="px-2 py-1 rounded-full text-xs font-bold"
                                  style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#C2410C', fontFamily: HL }}>
                                  Event
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0" style={{ fontFamily: BL }}>
                              <Calendar className="w-4 h-4" />
                              {item.date
                                ? new Date(item.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—'}
                            </div>
                          </div>
                          <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: HL }}>{item.title}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3" style={{ fontFamily: BL }}>
                            {item.excerpt}{item.fullText.length > 200 ? '...' : ''}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-400" style={{ fontFamily: BL }}>{item.source}</span>
                            <span className="text-xs font-semibold" style={{ color: '#1565C0', fontFamily: BL }}>
                              View Details →
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Subscribe CTA */}
              {!selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="mt-10 relative overflow-hidden rounded-2xl p-8 text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 60%, #1976D2 100%)' }}
                >
                  {/* Decorative rings */}
                  <span className="absolute -top-10 -right-10 w-44 h-44 rounded-full border-18 border-white/10 pointer-events-none" />
                  <span className="absolute -bottom-14 -left-10 w-56 h-56 rounded-full border-18 border-white/10 pointer-events-none" />
                  <span className="absolute top-5 left-6 w-3 h-3 rounded-full bg-yellow-300/30 pointer-events-none" />
                  <span className="absolute bottom-5 right-8 w-2 h-2 rounded-full bg-yellow-300/40 pointer-events-none" />
                  <span className="absolute top-1/2 left-3 w-1.5 h-1.5 rounded-full bg-white/20 pointer-events-none" />

                  {/* Icon badge */}
                  <div className="relative z-10 w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(245,197,24,0.18)', border: '1.5px solid rgba(245,197,24,0.45)' }}>
                    <Bell className="w-7 h-7" style={{ color: '#F5C518' }} />
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold mb-1" style={{ fontFamily: HL }}>Stay in the Loop</h3>
                    <p className="mb-6 text-white/65 text-sm max-w-xs mx-auto leading-relaxed" style={{ fontFamily: BL }}>
                      Get the latest festivals, events, and community updates from Liliw
                    </p>

                    {subStatus === 'success' ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl"
                        style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-semibold text-sm" style={{ fontFamily: BL }}>You're subscribed!</span>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                        <input
                          type="email"
                          value={subEmail}
                          onChange={e => setSubEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="px-4 py-3 rounded-xl bg-white text-gray-900 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          style={{ fontFamily: BL }}
                        />
                        <button
                          type="submit"
                          disabled={subStatus === 'loading'}
                          className="px-5 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shrink-0 shadow-md"
                          style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                          {subStatus === 'loading'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : 'Subscribe'}
                        </button>
                      </form>
                    )}

                    {subStatus === 'error' && (
                      <p className="mt-2 text-red-300 text-xs" style={{ fontFamily: BL }}>
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && <NewsDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
