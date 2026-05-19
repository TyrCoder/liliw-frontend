'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  photos: string[];
  initial?: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initial = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initial);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 }); // percent
  const imgRef = useRef<HTMLImageElement>(null);

  // Block page scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const go = (dir: number) => {
    setZoomed(false);
    setCurrent(c => (c + dir + photos.length) % photos.length);
  };

  const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setOrigin({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
    setZoomed(z => !z);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
        <span className="text-white/60 text-sm font-medium">
          {current + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed(z => !z)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition"
            title={zoomed ? 'Zoom out' : 'Zoom in'}>
            {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
          <a href={photos[current]} target="_blank" rel="noreferrer"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition"
            title="Open full size">
            <Maximize2 className="w-4 h-4" />
          </a>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            ref={imgRef}
            src={photos[current]}
            alt=""
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            onClick={handleImgClick}
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              transform: zoomed ? `scale(2.5)` : 'scale(1)',
              transformOrigin: zoomed ? `${origin.x}% ${origin.y}%` : 'center center',
              transition: 'transform 0.3s ease',
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
            }}
          />
        </AnimatePresence>
      </div>

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition z-10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition z-10">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, i) => (
            <button key={i} onClick={() => { setZoomed(false); setCurrent(i); }}
              className="rounded-full transition-all"
              style={{ width: i === current ? 22 : 8, height: 8, backgroundColor: i === current ? '#F5C518' : 'rgba(255,255,255,0.4)' }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
