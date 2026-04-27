'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href={href}
        className="px-3 py-2 text-gray-100 hover:text-white font-semibold transition-all duration-300 rounded-lg hover:bg-white/10 text-sm whitespace-nowrap"
      >
        {label}
      </Link>
    </motion.div>
  );
}

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 backdrop-blur-lg border-b-2"
      style={{
        backgroundColor: 'rgba(15, 31, 60, 0.95)',
        borderBottomColor: '#00BFB3',
        boxShadow: '0 8px 32px rgba(0, 191, 179, 0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-6">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.08 }} className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg text-white"
              style={{ backgroundColor: '#00BFB3' }}
            >
              L
            </div>
            <h1 className="text-2xl font-bold text-white hidden md:block">Liliw</h1>
          </motion.div>

          {/* Nav Links - Organized Structure */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-center overflow-x-auto">
            <NavLink href="/about" label="About" />
            <NavLink href="/attractions" label="Attractions" />
            <NavLink href="/culture" label="Culture" />
            <NavLink href="/heritage" label="Heritage" />
            <NavLink href="/itineraries" label="Tours" />
            <NavLink href="/community" label="Participate" />
            <NavLink href="/news" label="News" />
          </div>

          {/* 3D Tours Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/immersive"
              className="relative px-4 py-2 rounded-lg font-bold text-sm text-white overflow-hidden group/btn transition-all duration-300 flex items-center gap-2 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)',
                boxShadow: '0 4px 15px rgba(0, 191, 179, 0.4)',
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="text-base">🥽</span>
                <span className="hidden sm:inline">3D</span>
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, #00A39E 0%, #007B78 100%)',
                }}
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
