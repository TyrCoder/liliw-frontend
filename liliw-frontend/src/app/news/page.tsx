'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Bell, X } from 'lucide-react';

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
  source: string;
  isEvent: boolean;
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
    <div className="bg-white rounded-2xl shadow-sm p-5 border" style={{ borderColor: 'rgba(11,61,145,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition"
          style={{ color: '#0B3D91' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-sm" style={{ color: '#0B3D91', fontFamily: HL }}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 transition"
          style={{ color: '#0B3D91' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: '#9CA3AF', fontFamily: HL }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
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
                aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center
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
      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'rgba(0,0,0,0.06)', color: '#9CA3AF', fontFamily: BL }}>
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
            <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-semibold" style={{ color: '#0B3D91', fontFamily: HL }}>
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {eventDates[selectedDay].map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }} />
                  <p className="text-xs leading-snug" style={{ color: '#1A1A2E', fontFamily: BL }}>{ev.title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewsPage() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/strapi/news-events')
      .then(r => r.json())
      .catch(() => null)
      .then((combined: any) => {
        const items: NewsItem[] = [];
        combined?.news?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          const date = a.publishedAt || a.createdAt || '';
          items.push({
            title: a.title || 'News Item',
            date,
            dateKey: toDateKey(date),
            category: a.category || 'announcement',
            excerpt: extractText(a.content).substring(0, 200) || 'Read this news item for more information.',
            source: 'Liliw Tourism Office',
            isEvent: false,
          });
        });
        combined?.events?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          const date = a.date_start || a.createdAt || '';
          items.push({
            title: a.title || 'Upcoming Event',
            date,
            dateKey: toDateKey(date),
            category: a.category || 'other',
            excerpt: extractText(a.description).substring(0, 200) || `Event at ${a.venue || 'Liliw'}`,
            source: a.venue || 'Liliw',
            isEvent: true,
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
          <div className="lg:grid lg:grid-cols-[1fr_300px] gap-8 items-start">

            {/* ── News list ── */}
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
                        className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                        style={{ borderLeft: '4px solid #0B3D91' }}>
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
                        <p className="text-gray-600 text-sm leading-relaxed mb-3" style={{ fontFamily: BL }}>{item.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400" style={{ fontFamily: BL }}>{item.source}</span>
                          <button className="font-semibold text-sm" style={{ color: '#1565C0', fontFamily: BL }}>Read More →</button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Subscribe CTA */}
              {!selectedDay && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="mt-10 rounded-2xl p-8 text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: HL }}>Stay in the Loop</h3>
                  <p className="mb-6 text-white/70 text-sm" style={{ fontFamily: BL }}>
                    Subscribe to receive updates on festivals, events, and community initiatives
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input type="email" placeholder="Enter your email"
                      className="px-4 py-3 rounded-xl text-gray-900 flex-1 text-sm focus:outline-none" style={{ fontFamily: BL }} />
                    <button className="px-6 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                      style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>
                      Subscribe
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Calendar sidebar ── */}
            <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
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
          </div>
        )}
      </div>
    </div>
  );
}
