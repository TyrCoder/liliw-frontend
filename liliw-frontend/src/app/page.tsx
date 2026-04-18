'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, History, Leaf, HelpCircle, Calendar, Star } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import AnnouncementBar from '@/components/AnnouncementBar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export default function Home() {
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
          <h1 className="text-2xl font-bold text-white">
            Liliw
          </h1>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/about"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              About
            </Link>
            <Link
              href="/attractions"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              Attractions
            </Link>
            <Link
              href="/culture"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              Culture
            </Link>
            <Link
              href="/itineraries"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              Tours
            </Link>
            <Link
              href="/news"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              News
            </Link>
            <Link
              href="/faq"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              FAQ
            </Link>
            <Link
              href="/community"
              className="text-white hover:opacity-80 font-semibold transition text-sm"
            >
              Community
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Announcement Bar */}
      <AnnouncementBar defaultOpen={true} />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <HeroCarousel />
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {/* Featured Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="w-1 h-6 sm:h-8" style={{ backgroundColor: '#00BFB3' }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#0F1F3C' }}>
              Latest Announcements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Featured Announcement 1 */}
            <motion.div
              whileHover={{ translateY: -8 }}
              className="group rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-l-4"
              style={{ borderLeftColor: '#00BFB3' }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#00BFB3' }} />
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">May 2026</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#0F1F3C' }}>
                  Cultural Heritage Week Festival
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Join us for a celebration of Liliw's rich cultural heritage featuring traditional music, dance, local crafts, and authentic cuisine.
                </p>
                <motion.div whileHover="hover" whileTap="tap" variants={{
                  hover: { scale: 1.05 },
                  tap: { scale: 0.95 },
                }}>
                  <Link
                    href="/news"
                    className="inline-flex items-center font-semibold transition-all"
                    style={{ color: '#00BFB3' }}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Featured Announcement 2 */}
            <motion.div
              whileHover={{ translateY: -8 }}
              className="group rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-l-4"
              style={{ borderLeftColor: '#00BFB3' }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#00BFB3' }} />
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">New Guides</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#0F1F3C' }}>
                  3-Day Adventure Itinerary
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Explore heritage sites, natural wonders, and local culture with our newly curated 3-day tour guide featuring off-the-beaten-path destinations.
                </p>
                <motion.div whileHover="hover" whileTap="tap" variants={{
                  hover: { scale: 1.05 },
                  tap: { scale: 0.95 },
                }}>
                  <Link
                    href="/itineraries"
                    className="inline-flex items-center font-semibold transition-all"
                    style={{ color: '#00BFB3' }}
                  >
                    View Itineraries
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {/* Heritage */}
          <motion.div
            variants={itemVariants}
            className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
          >
            <div className="mb-4 inline-block p-3 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <History className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Heritage Sites</h3>
            <p className="text-gray-600 mb-6">
              Explore historic landmarks and cultural treasures that tell the story of Liliw's rich heritage.
            </p>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Link
                href="/heritage"
                className="inline-flex items-center font-semibold group/link"
                style={{ color: '#00BFB3' }}
              >
                Explore
                <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Natural Spots */}
          <motion.div
            variants={itemVariants}
            className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
          >
            <div className="mb-4 inline-block p-3 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <Leaf className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Natural Attractions</h3>
            <p className="text-gray-600 mb-6">
              Discover scenic spots and natural destinations perfect for adventure and relaxation.
            </p>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Link
                href="/tourist-spots"
                className="inline-flex items-center font-semibold group/link"
                style={{ color: '#00BFB3' }}
              >
                Explore
                <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Local Culture */}
          <motion.div
            variants={itemVariants}
            className="group p-8 rounded-2xl bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
          >
            <div className="mb-4 inline-block p-3 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-6 h-6" style={{ color: '#00BFB3' }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Local Culture</h3>
            <p className="text-gray-600 mb-6">
              Experience authentic traditions and vibrant community life in Liliw.
            </p>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Link
                href="/culture"
                className="inline-flex items-center font-semibold group/link"
                style={{ color: '#00BFB3' }}
              >
                Explore
                <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* More Sections Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 mt-12"
        >
          {/* About */}
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="mb-3 inline-block p-2 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">About Liliw</h4>
            <p className="text-sm text-gray-600 mb-3">
              Learn the history, location, and story of Liliw.
            </p>
            <Link
              href="/about"
              className="font-semibold text-sm"
              style={{ color: '#00BFB3' }}
            >
              Learn More →
            </Link>
          </motion.div>

          {/* Itineraries */}
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="mb-3 inline-block p-2 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <History className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Tour Itineraries</h4>
            <p className="text-sm text-gray-600 mb-3">
              Discover suggested 1-day and 2-day tours.
            </p>
            <Link
              href="/itineraries"
              className="font-semibold text-sm"
              style={{ color: '#00BFB3' }}
            >
              Explore Tours →
            </Link>
          </motion.div>

          {/* News */}
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="mb-3 inline-block p-2 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <Leaf className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">News & Events</h4>
            <p className="text-sm text-gray-600 mb-3">
              Stay updated on festivals and announcements.
            </p>
            <Link
              href="/news"
              className="font-semibold text-sm"
              style={{ color: '#00BFB3' }}
            >
              View News →
            </Link>
          </motion.div>

          {/* FAQ */}
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="mb-3 inline-block p-2 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <HelpCircle className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">FAQs</h4>
            <p className="text-sm text-gray-600 mb-3">
              Find answers to common questions about visiting.
            </p>
            <Link
              href="/faq"
              className="font-semibold text-sm"
              style={{ color: '#00BFB3' }}
            >
              Browse FAQs →
            </Link>
          </motion.div>

          {/* Community */}
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
          >
            <div className="mb-3 inline-block p-2 rounded-lg group-hover:opacity-80 transition" style={{ backgroundColor: 'rgba(0, 191, 179, 0.1)' }}>
              <MapPin className="w-5 h-5" style={{ color: '#00BFB3' }} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Get Involved</h4>
            <p className="text-sm text-gray-600 mb-3">
              Join our community and support local culture.
            </p>
            <Link
              href="/community"
              className="font-semibold text-sm"
              style={{ color: '#00BFB3' }}
            >
              Participate →
            </Link>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="rounded-3xl p-12 text-white text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-32 -mt-32" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Start Exploring Today</h2>
            <p className="text-lg text-white/90 mb-8">
              Discover all the amazing attractions and experiences Liliw has to offer.
            </p>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Link
                href="/attractions"
                className="inline-block bg-white text-teal-700 hover:bg-teal-50 font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View All Attractions
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gray-900 text-white mt-20 py-12"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Discover the Beauty of Liliw.</p>
        </div>
      </motion.footer>
    </div>
  );
}
