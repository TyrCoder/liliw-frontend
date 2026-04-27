'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Palette, Users, Star, Heart } from 'lucide-react';
import { logger } from '@/lib/logger';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function ArtsPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const artForms = [
    {
      title: 'Tsinelas (Sandal) Crafting',
      description: 'Traditional handmade sandals that showcase exceptional craftsmanship and artistic design.',
      icon: '👞',
      features: ['Handmade artistry', 'Traditional techniques', 'Cultural heritage'],
    },
    {
      title: 'Traditional Weaving',
      description: 'Intricate textiles created using traditional looms and sustainable materials.',
      icon: '🧵',
      features: ['Intricate patterns', 'Local materials', 'Generational skills'],
    },
    {
      title: 'Culinary Arts',
      description: 'Local delicacies and traditional dishes representing Liliw\'s gastronomic heritage.',
      icon: '🍲',
      features: ['Traditional recipes', 'Local ingredients', 'Family traditions'],
    },
    {
      title: 'Visual Arts & Crafts',
      description: 'Paintings, sculptures, and decorative arts showcasing local talent and creativity.',
      icon: '🎨',
      features: ['Local artists', 'Contemporary styles', 'Cultural expressions'],
    },
    {
      title: 'Music & Performing Arts',
      description: 'Traditional music, dance, and performances celebrating Liliw\'s cultural identity.',
      icon: '🎵',
      features: ['Local musicians', 'Traditional forms', 'Community events'],
    },
    {
      title: 'Artisan Communities',
      description: 'Thriving artist collectives and maker communities preserving and innovating traditions.',
      icon: '👥',
      features: ['Active communities', 'Skill sharing', 'Economic empowerment'],
    },
  ];

  const artists = [
    { name: 'Local Artisans', role: 'Traditional Crafters', specialty: 'Tsinelas & Weaving' },
    { name: 'Community Artists', role: 'Visual & Creative', specialty: 'Paintings & Sculptures' },
    { name: 'Master Chefs', role: 'Culinary Artists', specialty: 'Traditional Cuisine' },
    { name: 'Musicians', role: 'Performing Artists', specialty: 'Traditional Music' },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Header */}
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-6xl mx-auto px-4">
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
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#00BFB3' }}>
              Arts & Creatives
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Discover the vibrant artistic heritage and creative communities that define Liliw's cultural identity
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8" style={{ backgroundColor: '#00BFB3' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#0F1F3C' }}>
              Creative Excellence
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Liliw is a thriving hub of artistic expression and creative innovation. From traditional craftsmanship to contemporary art forms, 
            the community celebrates and preserves cultural expressions that have been passed down through generations while embracing modern creativity.
          </p>
        </motion.div>

        {/* Art Forms Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          {artForms.map((art, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ translateY: -8 }}
              className="p-8 rounded-xl border-l-4 shadow-lg hover:shadow-xl transition-all bg-white"
              style={{ borderLeftColor: '#00BFB3' }}
            >
              <div className="text-4xl mb-4">{art.icon}</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0F1F3C' }}>
                {art.title}
              </h3>
              <p className="text-gray-600 mb-4">{art.description}</p>
              <div className="space-y-2">
                {art.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00BFB3' }} />
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Artists & Artisans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8" style={{ backgroundColor: '#00BFB3' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#0F1F3C' }}>
              Meet Our Artists & Artisans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.map((artist, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 text-center border border-teal-100 hover:border-teal-300 transition-all"
              >
                <div className="text-4xl mb-3">👤</div>
                <h3 className="font-bold text-lg mb-1" style={{ color: '#0F1F3C' }}>
                  {artist.name}
                </h3>
                <p className="text-sm font-semibold mb-2" style={{ color: '#00BFB3' }}>
                  {artist.role}
                </p>
                <p className="text-xs text-gray-600">{artist.specialty}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 191, 179, 0.1) 0%, rgba(0, 191, 179, 0.05) 100%)',
            border: '2px solid #00BFB3',
          }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#0F1F3C' }}>
            Support Local Creatives
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover unique, handcrafted products and experience live performances by local artists
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/attractions"
              className="px-8 py-3 rounded-lg font-bold text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)',
              }}
            >
              Visit Artisan Shops
            </Link>
            <Link
              href="/community"
              className="px-8 py-3 rounded-lg font-bold transition-all hover:bg-gray-100"
              style={{ color: '#00BFB3', border: '2px solid #00BFB3' }}
            >
              Participate & Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
