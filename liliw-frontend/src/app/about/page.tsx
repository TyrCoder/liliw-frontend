'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Users, Heart } from 'lucide-react';

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

export default function AboutPage() {
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
              className="inline-flex items-center font-semibold mb-6 group"
              style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>About Liliw</h1>
            <p className="text-xl text-gray-600">
              Discover the beauty, history, and heritage of Liliw, Laguna
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* About Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">🏘️ About Liliw</h2>
            <p className="text-gray-700 leading-relaxed">
              Liliw is a scenic municipality in the province of Laguna, Philippines, located at the foot of Mt. Banahaw. 
              The name "Liliw" has evolved from "Lilio," reflecting the town's historical journey and cultural significance.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Known for its handcrafted tsinelas (Filipino slippers) and rich cultural heritage, Liliw stands out as a 
              destination where tradition meets natural beauty, offering visitors both tangible and intangible cultural experiences.
            </p>
          </motion.div>

          {/* Key Facts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
              <MapPin className="w-8 h-8 mb-3" style={{ color: '#00BFB3' }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-700 text-sm">
                At the foot of Mt. Banahaw, Laguna Province, Calabarzon Region
              </p>
            </div>
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
              <Users className="w-8 h-8 mb-3" style={{ color: '#00BFB3' }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Culture</h3>
              <p className="text-gray-700 text-sm">
                Home to master craftspeople and vibrant cultural traditions spanning generations
              </p>
            </div>
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
              <Heart className="w-8 h-8 mb-3" style={{ color: '#00BFB3' }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Heritage</h3>
              <p className="text-gray-700 text-sm">
                Rich in tangible and intangible heritage, from churches to festivals
              </p>
            </div>
          </motion.div>

          {/* Why Visit */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">✨ Why Visit Liliw?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="font-bold text-lg mt-1\" style={{ color: '#00BFB3' }}>•</span>
                <span className="text-gray-700">
                  <strong>Authentic Craftsmanship:</strong> Experience the world-renowned tsinelas-making tradition and support local artisans
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                <span className="text-gray-700">
                  <strong>Cultural Immersion:</strong> Participate in festivals, learn about traditions, and connect with communities
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                <span className="text-gray-700">
                  <strong>Natural Beauty:</strong> Enjoy cold springs, scenic viewpoints, and mountain landscapes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                <span className="text-gray-700">
                  <strong>Heritage Exploration:</strong> Visit historic churches, heritage districts, and cultural landmarks
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                <span className="text-gray-700">
                  <strong>Farm Tourism:</strong> Connect with rural communities through agritourism experiences
                </span>
              </li>
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}
          >
            <h3 className="text-2xl font-bold mb-4">Ready to Explore?</h3>
            <p className="mb-6 opacity-90">
              Discover the attractions, culture, and heritage that make Liliw unique
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/attractions"
                className="px-8 py-3 bg-white font-semibold rounded-lg transition" style={{ color: '#00BFB3' }}
              >
                Explore Attractions
              </Link>
              <Link
                href="/culture"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg transition" style={{ borderColor: 'white' }}
              >
                Learn Our Culture
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Discover the Beauty of Liliw.</p>
        </div>
      </motion.footer>
    </div>
  );
}
