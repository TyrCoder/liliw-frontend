'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Users, Heart } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>About Liliw</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Discover the beauty, history, and heritage of Liliw, Laguna</p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-16">

          {/* About Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">About Liliw</h2>
            <p className="text-gray-700 leading-relaxed">
              Liliw is a scenic municipality in the province of Laguna, Philippines, located at the foot of Mt. Banahaw.
              The name &quot;Liliw&quot; has evolved from &quot;Lilio,&quot; reflecting the town&apos;s historical journey and cultural significance.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Known for its handcrafted tsinelas (Filipino slippers) and rich cultural heritage, Liliw stands out as a
              destination where tradition meets natural beauty, offering visitors both tangible and intangible cultural experiences.
            </p>
          </motion.div>

          {/* Key Facts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <MapPin className="w-8 h-8" />, title: 'Location', text: 'At the foot of Mt. Banahaw, Laguna Province, Calabarzon Region' },
              { icon: <Users className="w-8 h-8" />, title: 'Culture', text: 'Home to master craftspeople and vibrant cultural traditions spanning generations' },
              { icon: <Heart className="w-8 h-8" />, title: 'Heritage', text: 'Rich in tangible and intangible heritage, from churches to festivals' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0,191,179,0.08)', borderColor: '#00BFB3' }}>
                <div className="mb-3" style={{ color: '#00BFB3' }}>{icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-700 text-sm">{text}</p>
              </div>
            ))}
          </motion.div>

          {/* Why Visit */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Why Visit Liliw?</h2>
            <ul className="space-y-3">
              {[
                { label: 'Authentic Craftsmanship', text: 'Experience the world-renowned tsinelas-making tradition and support local artisans' },
                { label: 'Cultural Immersion', text: 'Participate in festivals, learn about traditions, and connect with communities' },
                { label: 'Natural Beauty', text: 'Enjoy cold springs, scenic viewpoints, and mountain landscapes' },
                { label: 'Heritage Exploration', text: 'Visit historic churches, heritage districts, and cultural landmarks' },
                { label: 'Farm Tourism', text: 'Connect with rural communities through agritourism experiences' },
              ].map(({ label, text }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="font-bold text-lg mt-1" style={{ color: '#00BFB3' }}>•</span>
                  <span className="text-gray-700"><strong>{label}:</strong> {text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="rounded-2xl p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0F1F3C 100%)' }}>
            <h3 className="text-2xl font-bold mb-4">Ready to Explore?</h3>
            <p className="mb-6 opacity-90">Discover the attractions, culture, and heritage that make Liliw unique</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/attractions" className="px-8 py-3 bg-white font-semibold rounded-lg transition" style={{ color: '#00BFB3' }}>
                Explore Attractions
              </Link>
              <Link href="/culture" className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg transition">
                Learn Our Culture
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
