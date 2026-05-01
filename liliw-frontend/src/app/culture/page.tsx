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

const FALLBACK_CULTURE = [
  { title: 'Tsinelas-Making Tradition', description: "The renowned handmade Filipino slipper craft that has made Liliw world-famous", icon_emoji: '👞', details: ['Handed down through generations of skilled artisans', 'Intricate designs and superior craftsmanship', 'Visit workshops to see artisans at work'] },
  { title: 'Festivals & Celebrations', description: "Vibrant cultural events celebrating Liliw's heritage and traditions", icon_emoji: '🎉', details: ['Gat Tayaw Tsinelas Festival', 'Mutya ng Liliw', 'Parish celebrations and religious festivals'] },
  { title: 'Intangible Heritage', description: "The living cultural expressions that define Liliw's identity", icon_emoji: '🏛️', details: ['Traditional crafting techniques', 'Cultural narratives and oral histories', 'Culinary traditions and heritage recipes'] },
];

export default function CulturePage() {
  const [culturalAspects, setCulturalAspects] = useState<any[]>(FALLBACK_CULTURE);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/culture-aspects?populate=*&sort=sort_order:asc`, {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` }
    }).then(r => r.json()).then(data => {
      if (data?.data?.length) setCulturalAspects(data.data.map((i: any) => i.attributes || i));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="py-12\" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/about"
              className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>Culture & Heritage</h1>
            <p className="text-xl text-gray-600">
              Experience the living traditions that make Liliw unique
            </p>
          </motion.div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {culturalAspects.map((aspect, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-8 rounded-2xl bg-white border-2 transition-all duration-300 hover:shadow-lg" style={{ borderColor: '#00BFB3' }}
              >
                <div className="mb-4 text-3xl">{aspect.icon_emoji || '🎭'}</div>
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
            <h2 className="text-4xl font-bold text-gray-900">🎨 Local Arts & Creative Industries</h2>
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

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Celebrating Local Culture.</p>
        </div>
      </motion.footer>
    </div>
  );
}
