'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, History, Leaf, HelpCircle, Calendar, Star, Bell } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import AnnouncementBar from '@/components/AnnouncementBar';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

const CATEGORY_STYLE: Record<string, string> = {
  advisory: 'bg-blue-100 text-blue-700',
  announcement: 'bg-teal-100 text-teal-700',
  press_release: 'bg-purple-100 text-purple-700',
  festival: 'bg-red-100 text-red-700',
  cultural: 'bg-yellow-100 text-yellow-700',
  competition: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

const extractText = (rt: any): string => {
  if (!rt) return '';
  if (typeof rt === 'string') return rt;
  if (Array.isArray(rt)) return rt.map((b: any) => b.children?.map((c: any) => c.text || '').join('') || '').join(' ').trim();
  return '';
};

const FALLBACK_ANNOUNCEMENTS = [
  { title: 'Cultural Heritage Festival', date: 'May 2026', category: 'festival', excerpt: "Join us celebrating Liliw's rich cultural heritage.", link: '/news', isEvent: true },
  { title: 'Adventure Itineraries', date: 'New Guides', category: 'announcement', excerpt: 'Explore with our curated tour guides and itineraries.', link: '/itineraries', isEvent: false },
];

export default function Home() {
  const [announcements, setAnnouncements] = useState<any[]>(FALLBACK_ANNOUNCEMENTS);

  useEffect(() => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const headers = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` };

    Promise.all([
      fetch(`${strapiUrl}/api/newses?populate=*&sort=createdAt:desc&pagination[limit]=2`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${strapiUrl}/api/events?populate=*&sort=date_start:desc&pagination[limit]=2`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([newsData, eventsData]) => {
      const items: any[] = [];

      if (newsData?.data?.length) {
        newsData.data.forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'News',
            date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : '',
            category: a.category || 'announcement',
            excerpt: extractText(a.content).substring(0, 100) || 'Read this news for more information.',
            link: '/news',
            isEvent: false,
          });
        });
      }

      if (eventsData?.data?.length) {
        eventsData.data.forEach((item: any) => {
          const a = item.attributes || item;
          items.push({
            title: a.title || 'Upcoming Event',
            date: a.date_start ? new Date(a.date_start).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : '',
            category: a.category || 'other',
            excerpt: extractText(a.description).substring(0, 100) || `Event at ${a.venue || 'Liliw'}`,
            link: '/news',
            isEvent: true,
          });
        });
      }

      if (items.length > 0) {
        setAnnouncements(items.slice(0, 2));
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <AnnouncementBar defaultOpen={true} />

      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <HeroCarousel />
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        {/* Latest Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="w-1 h-6 sm:h-8" style={{ backgroundColor: '#00BFB3' }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#0F1F3C' }}>Latest Announcements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {announcements.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ translateY: -8 }}
                className="group rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-l-4"
                style={{ borderLeftColor: '#00BFB3' }}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                    {item.date ? (
                      <><Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#00BFB3' }} />
                      <span className="text-xs sm:text-sm font-semibold text-gray-600">{item.date}</span></>
                    ) : (
                      <><Bell className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#00BFB3' }} />
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${CATEGORY_STYLE[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category.replace('_', ' ')}
                      </span></>
                    )}
                    {item.isEvent && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Event</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#0F1F3C' }}>{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{item.excerpt}</p>
                  <Link href={item.link || '/news'} className="inline-flex items-center font-semibold" style={{ color: '#00BFB3' }}>
                    {item.isEvent ? 'View Event' : 'Learn More'} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div variants={itemVariants} className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
            <div className="mb-4 inline-block p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <History className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Heritage Sites</h3>
            <p className="text-gray-600 mb-6">Explore historic landmarks and cultural treasures.</p>
            <Link href="/heritage" className="inline-flex items-center font-semibold" style={{ color: '#00BFB3' }}>Explore <ArrowRight className="w-4 h-4 ml-2 transition" /></Link>
          </motion.div>
          <motion.div variants={itemVariants} className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
            <div className="mb-4 inline-block p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <Leaf className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Natural Attractions</h3>
            <p className="text-gray-600 mb-6">Discover pristine landscapes and wonders.</p>
            <Link href="/tourist-spots" className="inline-flex items-center font-semibold" style={{ color: '#00BFB3' }}>Discover <ArrowRight className="w-4 h-4 ml-2 transition" /></Link>
          </motion.div>
          <motion.div variants={itemVariants} className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
            <div className="mb-4 inline-block p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Interactive Map</h3>
            <p className="text-gray-600 mb-6">Navigate attractions with our interactive map.</p>
            <Link href="/attractions" className="inline-flex items-center font-semibold" style={{ color: '#00BFB3' }}>View Map <ArrowRight className="w-4 h-4 ml-2 transition" /></Link>
          </motion.div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all border border-gray-200">
            <div className="mb-3 inline-block p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <HelpCircle className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">FAQs</h4>
            <p className="text-sm text-gray-600 mb-3">Find answers to common questions.</p>
            <Link href="/faq" className="font-semibold text-sm" style={{ color: '#00BFB3' }}>Browse FAQs →</Link>
          </motion.div>
          <motion.div variants={itemVariants} className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all border border-gray-200">
            <div className="mb-3 inline-block p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Community</h4>
            <p className="text-sm text-gray-600 mb-3">Join and support local culture.</p>
            <Link href="/community" className="font-semibold text-sm" style={{ color: '#00BFB3' }}>Participate →</Link>
          </motion.div>
          <motion.div variants={itemVariants} className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all border border-gray-200">
            <div className="mb-3 inline-block p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <Leaf className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Culture</h4>
            <p className="text-sm text-gray-600 mb-3">Experience traditions and culture.</p>
            <Link href="/culture" className="font-semibold text-sm" style={{ color: '#00BFB3' }}>Learn More →</Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
