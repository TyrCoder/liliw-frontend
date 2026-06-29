'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const GRADIENTS = ['from-blue-800 to-blue-600', 'from-[#0B3D91] to-blue-600', 'from-blue-900 to-blue-700', 'from-[#0B3D91] to-indigo-600'];

export default function HeroCarousel() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
    fetch('/api/strapi/hero-slides')
      .then(r => r.json())
      .then(data => {
        if (data?.data?.length) {
          setSlides(data.data.map((item: any, i: number) => {
            const a = item.attributes || item;
            const imgUrl = a.image?.data?.attributes?.url || a.image?.url;
            const fullImg = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `${strapiUrl}${imgUrl}`) : null;
            return { ...a, gradient: GRADIENTS[i % GRADIENTS.length], image: fullImg };
          }));
        }
      }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  if (loading) {
    return <div className="h-64 sm:h-80 md:h-96 lg:h-[550px] rounded-2xl sm:rounded-3xl bg-gray-200 animate-pulse" />;
  }

  if (!slides.length) {
    return (
      <div className="h-64 sm:h-80 md:h-96 lg:h-[550px] rounded-2xl sm:rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }}>
        <div className="text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-bold mb-3 drop-shadow-lg">Welcome to Liliw</h2>
          <p className="text-lg sm:text-xl text-white/90 mb-6">Discover Hidden Treasures in Laguna</p>
          <Link href="/attractions" className="inline-flex items-center bg-white font-bold py-3 px-7 rounded-full shadow-xl hover:shadow-2xl transition group" style={{ color: '#0B3D91' }}>
            Explore Attractions <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="relative h-64 sm:h-80 md:h-96 lg:h-[550px] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 ${slide.image ? '' : `bg-gradient-to-br ${slide.gradient}`}`}
        >
          {slide.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          )}
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -50, 0],
                y: [0, -100, 0],
              }}
              transition={{ duration: 25, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/25" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-4">
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-2 sm:mb-4 drop-shadow-lg"
            >
              {slide.title}
            </motion.h2>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-4 sm:mb-8 max-w-2xl drop-shadow-md"
            >
              {slide.subtitle}
            </motion.p>
            
            {/* CTA Button */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={(slide as any).cta_link || (slide as any).link || '/'}
                className="inline-flex items-center bg-white hover:bg-blue-50 font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl group" style={{ color: '#0B3D91' }}
              >
                {slide.cta_text || (slide as any).cta}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={prev}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/40 hover:bg-white/60 backdrop-blur-md p-3 rounded-full transition-all shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" strokeWidth={3} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={next}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/40 hover:bg-white/60 backdrop-blur-md p-3 rounded-full transition-all shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" strokeWidth={3} />
      </motion.button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full transition-all ${
              idx === current
                ? 'bg-white w-10 h-3'
                : 'bg-white/60 hover:bg-white/80 w-3 h-3'
            }`}
            whileHover={{ scale: 1.2 }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-20 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-white font-semibold">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
