'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Bell } from 'lucide-react';

const extractText = (richText: any): string => {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((block: any) => block.children?.map((c: any) => c.text || '').join('') || '')
      .join(' ')
      .trim();
  }
  return '';
};

const FALLBACK_NEWS = [
  { title: 'Gat Tayaw Tsinelas Festival 2026', date: '2026-03-15', category: 'festival', excerpt: "Annual festival celebrating Liliw's famous tsinelas craftsmanship and cultural heritage. Join the community for a week of events and activities.", source: 'Liliw Tourism Office', isEvent: true },
  { title: 'Heritage Conservation Project Launch', date: '2026-02-20', category: 'announcement', excerpt: 'Liliw municipality launches a new initiative to preserve and promote historical landmarks and cultural sites throughout the town.', source: 'Municipal Hall', isEvent: false },
  { title: 'New Artisan Workshops Open for Visitors', date: '2026-01-10', category: 'advisory', excerpt: 'Several tsinelas workshops in the town center are now open for guided tours and hands-on making experiences. Book your slot today!', source: 'Liliw Tourism', isEvent: false },
];

const CATEGORY_STYLE: Record<string, string> = {
  advisory: 'bg-blue-100 text-blue-700',
  announcement: 'bg-teal-100 text-teal-700',
  press_release: 'bg-purple-100 text-purple-700',
  festival: 'bg-red-100 text-red-700',
  cultural: 'bg-yellow-100 text-yellow-700',
  competition: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

export default function NewsPage() {
  const [news, setNews] = useState<any[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const headers = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` };

    Promise.all([
      fetch(`${strapiUrl}/api/newses?populate=*&sort=createdAt:desc`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${strapiUrl}/api/events?populate=*&sort=date_start:desc`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([newsData, eventsData]) => {
      const items: any[] = [];

      if (newsData?.data?.length) {
        newsData.data.forEach((item: any) => {
          const a = item.attributes || item;
          const excerpt = extractText(a.content);
          items.push({
            title: a.title || 'News Item',
            date: a.publishedAt || a.createdAt || '',
            category: a.category || 'announcement',
            excerpt: (excerpt ? excerpt.substring(0, 200) : 'Read this news item for more information.'),
            source: 'Liliw Tourism Office',
            isEvent: false,
          });
        });
      }

      if (eventsData?.data?.length) {
        eventsData.data.forEach((item: any) => {
          const a = item.attributes || item;
          const desc = extractText(a.description);
          items.push({
            title: a.title || 'Upcoming Event',
            date: a.date_start || a.createdAt || '',
            category: a.category || 'other',
            excerpt: (desc ? desc.substring(0, 200) : `Event at ${a.venue || 'Liliw'}`),
            source: a.venue || 'Liliw',
            isEvent: true,
          });
        });
      }

      if (items.length > 0) {
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(items);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <Link href="/" className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}>
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" /> Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>News & Announcements</h1>
            <p className="text-xl text-gray-600">Stay updated on Liliw events, festivals, and community initiatives</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: '#00BFB3' }} />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-12">
            <div className="space-y-4">
              {news.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="p-6 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300" style={{ borderLeftColor: '#00BFB3' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Bell className="w-5 h-5 flex-shrink-0" style={{ color: '#00BFB3' }} />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${CATEGORY_STYLE[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category.replace('_', ' ')}
                      </span>
                      {item.isEvent && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Event</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date ? new Date(item.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-3">{item.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{item.source}</span>
                    <button className="font-semibold text-sm" style={{ color: '#00BFB3' }}>Read More →</button>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-16 rounded-2xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
              <h3 className="text-2xl font-bold mb-4">📮 Stay in the Loop</h3>
              <p className="mb-6 opacity-90">Subscribe to receive updates on festivals, events, and community initiatives</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input type="email" placeholder="Enter your email" className="px-4 py-3 rounded-lg text-gray-900 flex-1" />
                <button className="px-6 py-3 bg-white font-semibold rounded-lg transition" style={{ color: '#00BFB3' }}>Subscribe</button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="p-4 rounded-lg bg-blue-50 border border-blue-200 hover:shadow-md transition text-center">
                <h4 className="font-bold text-gray-900">Facebook</h4>
                <p className="text-sm text-gray-600">Follow @LiliwTourism</p>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="p-4 rounded-lg bg-pink-50 border border-pink-200 hover:shadow-md transition text-center">
                <h4 className="font-bold text-gray-900">Instagram</h4>
                <p className="text-sm text-gray-600">Follow @LiliwTourism</p>
              </a>
              <a href="https://web.facebook.com" target="_blank" rel="noopener noreferrer"
                className="p-4 rounded-lg border hover:shadow-md transition text-center" style={{ backgroundColor: 'rgba(0, 191, 179, 0.05)', borderColor: '#00BFB3' }}>
                <h4 className="font-bold text-gray-900">Website</h4>
                <p className="text-sm text-gray-600">Visit Official Site</p>
              </a>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
