'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGalleryProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  title?: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) return null;

  const current = images[selectedIndex];
  const next = () => setSelectedIndex((selectedIndex + 1) % images.length);
  const prev = () => setSelectedIndex((selectedIndex - 1 + images.length) % images.length);

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="space-y-4">
        {title && <h3 className="text-2xl font-bold" style={{ color: '#0F1F3C' }}>{title}</h3>}
        
        {/* Main Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setIsFullscreen(true)}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          {current.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <p className="text-sm">{current.caption}</p>
            </div>
          )}
        </motion.div>

        {/* Thumbnail Carousel */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  idx === selectedIndex ? 'border-teal-500' : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
                style={idx === selectedIndex ? { borderColor: '#00BFB3' } : {}}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{selectedIndex + 1} / {images.length}</span>
            <div className="flex gap-2">
              <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:opacity-70 transition"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white hover:opacity-70 transition"
            >
              <ChevronLeft size={40} />
            </button>

            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-4/5 h-4/5 max-w-5xl"
            >
              <Image
                src={current.src}
                alt={current.alt}
                fill
                className="object-contain"
                priority
              />
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white hover:opacity-70 transition"
            >
              <ChevronRight size={40} />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
