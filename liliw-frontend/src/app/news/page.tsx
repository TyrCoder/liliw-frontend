'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Bell, Share2 } from 'lucide-react';
import { getEvents } from '@/lib/strapi';

interface Event {
  id: number;
  title: string;
  description?: any;
  date_start: string;
  date_end?: string;
  venue?: string;
  category: string;
  program?: any;
  is_featured?: boolean;
}

interface NewsItem {
  date: string;
  category: string;
  title: string;
  excerpt: string;
  source: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

// Extract text from rich text blocks
const extractText = (richText: any): string => {
  if (!richText) return '';
  if (Array.isArray(richText)) {
    return richText
      .map((block: any) =>
        block.children?.map((child: any) => child.text).join(' ') || ''
      )
      .join(' ')
      .trim();
  }
  return richText;
};

// Transform Strapi event to display format
const transformEvent = (event: Event): NewsItem => {
  const date = new Date(event.date_start).toISOString().split('T')[0];
  const categoryLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);
  
  return {
    date,
    category: categoryLabel,
    title: event.title,
    excerpt: extractText(event.description).substring(0, 150) + '...' || event.venue || 'Event in Liliw',
    source: event.venue || 'Liliw Tourism',
  };
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const events = await getEvents();
        const transformedNews = events.map(transformEvent);
        setNews(transformedNews);
      } catch (err) {
        setError('Failed to load news');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 shadow-lg"
        style={{ backgroundColor: '#0F1F3C' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white">Liliw</h1>
          <div className="flex items-center gap-6 flex-wrap">
            <Link href="/" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Home
            </Link>
            <Link href="/about" className="text-white hover:opacity-80 font-semibold transition text-sm">
              About
            </Link>
            <Link href="/attractions" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Attractions
            </Link>
            <Link href="/culture" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Culture
            </Link>
            <Link href="/itineraries" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Tours
            </Link>
            <Link href="/news" className="text-white hover:opacity-80 font-semibold transition text-sm">
              News
            </Link>
            <Link href="/faq" className="text-white hover:opacity-80 font-semibold transition text-sm">
              FAQ
            </Link>
            <Link href="/community" className="text-white hover:opacity-80 font-semibold transition text-sm">
              Community
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Page Header */}
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3\" style={{ color: '#00BFB3' }}>News & Announcements</h1>
            <p className="text-xl text-gray-600">
              Stay updated on Liliw events, festivals, and community initiatives
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        {loading ? (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: 'rgba(0, 191, 179, 0.3)', borderTopColor: '#00BFB3' }}></div>
            </div>
            <p className="mt-4 text-gray-600">Loading news...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <p className="text-red-600 font-semibold">{error}</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            {/* News List */}
            <div className="space-y-4">
              {news.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-6 rounded-lg border-l-4 bg-white hover:shadow-lg transition-all duration-300" style={{ borderLeftColor: '#00BFB3' }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 flex-shrink-0" style={{ color: '#00BFB3' }} />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.category === 'Cultural' ? 'text-white' :
                        item.category === 'Festival' ? 'bg-red-100 text-red-700' :
                        item.category === 'Workshop' ? 'bg-blue-100 text-blue-700' :
                        item.category === 'Competition' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`} style={item.category === 'Cultural' ? { backgroundColor: '#00BFB3' } : {}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 transition cursor-pointer">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{item.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Source: {item.source}</span>
                    <div className="flex gap-2">
                      <button className="font-semibold text-sm" style={{ color: '#00BFB3' }}>
                        Read More →
                      </button>
                      <button className="p-2 text-gray-600 transition" style={{ '--tw-text-opacity': '1' } as any}>
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {news.length === 0 && (
              <motion.div
                variants={itemVariants}
                className="text-center py-12"
              >
                <p className="text-gray-600">No news items available.</p>
              </motion.div>
            )}

            {/* Subscribe CTA */}
            <motion.div
              variants={itemVariants}
              className="mt-16 rounded-2xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}
            >
              <h3 className="text-2xl font-bold mb-4">📮 Stay in the Loop</h3>
              <p className="mb-6 opacity-90">
                Subscribe to receive updates on festivals, events, and community initiatives
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg text-gray-900 flex-1"
                />
                <button className="px-6 py-3 bg-white font-semibold rounded-lg transition" style={{ color: '#00BFB3' }}>
                  Subscribe
                </button>
              </div>
            </motion.div>

            {/* Quick Links */}
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

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Stay Updated.</p>
        </div>
      </motion.footer>
    </div>
  );
}
