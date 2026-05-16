'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Bell } from 'lucide-react';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

const PENNANT = ['#EF4444','#F97316','#EAB308','#22C55E','#0D9488','#3B82F6','#8B5CF6'];
function Bunting({ flip = false }: { flip?: boolean }) {
  const r = 14, panels = 8, arc = Math.PI * 2 / panels, spacing = 30;
  const W = r + (PENNANT.length - 1) * spacing + r;
  const cy = r;
  return (
    <svg width={W} height={r * 2} viewBox={`0 0 ${W} ${r * 2}`} className="hidden sm:inline-block" style={{ transform: flip ? 'scaleX(-1)' : undefined, verticalAlign:'middle' }}>
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
  advisory:     { bg: 'rgba(21,101,192,0.1)',   text: '#1565C0' },
  announcement: { bg: 'rgba(11,61,145,0.1)',    text: '#0B3D91' },
  press_release:{ bg: 'rgba(103,58,183,0.1)',   text: '#673AB7' },
  festival:     { bg: 'rgba(245,197,24,0.15)',  text: '#B8860B' },
  cultural:     { bg: 'rgba(245,197,24,0.1)',   text: '#9A7D0A' },
  competition:  { bg: 'rgba(46,125,50,0.1)',    text: '#2E7D32' },
  other:        { bg: 'rgba(0,0,0,0.06)',       text: '#555' },
};

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strapi/news-events')
      .then(r => r.json())
      .catch(() => null)
      .then((combined: any) => {
        const items: any[] = [];
        combined?.news?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'News Item',
            date: a.publishedAt || a.createdAt || '',
            category: a.category || 'announcement',
            excerpt: (extractText(a.content).substring(0, 200) || 'Read this news item for more information.'),
            source: 'Liliw Tourism Office',
            isEvent: false,
          });
        });
        combined?.events?.data?.forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'Upcoming Event',
            date: a.date_start || a.createdAt || '',
            category: a.category || 'other',
            excerpt: (extractText(a.description).substring(0, 200) || `Event at ${a.venue || 'Liliw'}`),
            source: a.venue || 'Liliw',
            isEvent: true,
          });
        });
        if (items.length > 0) items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(items);
      })
      .finally(() => setLoading(false));
  }, []);

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
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center uppercase tracking-wide" style={{ fontFamily: HL }}>News &amp; Announcements</h1>
              <Bunting flip />
            </div>
            <p className="text-white/70 text-sm sm:text-base text-center" style={{ fontFamily: BL }}>Stay updated on Liliw events, festivals, and community initiatives</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'rgba(11,61,145,0.2)', borderTopColor: '#0B3D91' }} />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#0B3D91' }} />
            <p className="font-semibold text-lg text-gray-600" style={{ fontFamily: HL }}>No news or announcements yet</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: BL }}>Check back soon for updates from Liliw.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, idx) => {
              const catStyle = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.other;
              return (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border-l-4 hover:shadow-md transition-all"
                  style={{ borderLeftColor: '#0B3D91', borderRightColor: 'transparent', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderWidth: '0 0 0 4px', borderStyle: 'solid' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bell className="w-4 h-4 shrink-0" style={{ color: '#0B3D91' }} />
                      <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: HL }}>
                        {item.category.replace('_', ' ')}
                      </span>
                      {item.isEvent && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32', fontFamily: HL }}>Event</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400" style={{ fontFamily: BL }}>
                      <Calendar className="w-4 h-4" />
                      {item.date ? new Date(item.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
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

            {/* Subscribe CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="mt-12 rounded-2xl p-8 text-white text-center"
              style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: HL }}>Stay in the Loop</h3>
              <p className="mb-6 text-white/70 text-sm" style={{ fontFamily: BL }}>Subscribe to receive updates on festivals, events, and community initiatives</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" placeholder="Enter your email"
                  className="px-4 py-3 rounded-xl text-gray-900 flex-1 text-sm focus:outline-none" style={{ fontFamily: BL }} />
                <button className="px-6 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: BL }}>Subscribe</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
