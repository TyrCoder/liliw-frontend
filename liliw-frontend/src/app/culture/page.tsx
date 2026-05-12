'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

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


export default function CulturePage() {
  const [culturalAspects, setCulturalAspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strapi/culture-aspects')
      .then(r => r.json())
      .then(data => {
        if (data?.data?.length) setCulturalAspects(data.data.map((i: any) => i.attributes || i));
      }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/about" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" /> Back to About
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>Culture & Heritage</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Experience the living traditions that make Liliw unique</p>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Cultural Aspects */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 h-64 animate-pulse" />)}
            </div>
          )}
          {!loading && culturalAspects.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="font-semibold text-lg">No cultural aspects listed yet</p>
              <p className="text-sm mt-1">Content will be added soon.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {culturalAspects.map((aspect, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-8 rounded-2xl bg-white border-2 transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#00BFB3' }}
              >
                {aspect.icon_emoji && <div className="mb-4 text-3xl">{aspect.icon_emoji}</div>}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{aspect.title}</h3>
                <p className="text-gray-600 mb-6">{aspect.description}</p>
                <ul className="space-y-2">
                  {(Array.isArray(aspect.details) ? aspect.details : []).map((detail: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="font-bold mt-1" style={{ color: '#00BFB3' }}>✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Local Arts & Creative Industries */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">Local Arts & Creative Industries</h2>
            <p className="text-lg text-gray-700">
              Liliw is home to talented artisans, designers, cultural groups, and creative entrepreneurs
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Meet Local Artists</h4>
                <p className="text-gray-700 mb-4">
                  Explore profiles and work of local artisans, designers, painters, and cultural performers
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Tsinelas craftspeople and designers</li>
                  <li>• Visual artists and painters</li>
                  <li>• Cultural performers and musicians</li>
                  <li>• Contemporary designers and creators</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Creative Spaces</h4>
                <p className="text-gray-700 mb-4">
                  Visit galleries, workshops, and creative studios showcasing local talent
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Tsinelas workshop tours</li>
                  <li>• Art galleries and exhibits</li>
                  <li>• Craft studios and maker spaces</li>
                  <li>• Community creative centers</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Engage */}
          <motion.div variants={itemVariants} className="mt-16 rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
            <h3 className="text-2xl font-bold mb-4">🤝 Support Local Culture</h3>
            <p className="mb-6 opacity-90">
              Help preserve and celebrate Liliw's heritage through direct support of artisans and cultural initiatives
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h4 className="font-bold mb-2">Buy Directly</h4>
                <p className="text-sm opacity-90">Purchase tsinelas and crafts directly from makers</p>
              </div>
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h4 className="font-bold mb-2">Attend Events</h4>
                <p className="text-sm opacity-90">Experience festivals and cultural celebrations</p>
              </div>
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h4 className="font-bold mb-2">Learn Skills</h4>
                <p className="text-sm opacity-90">Participate in workshops and cultural tours</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
