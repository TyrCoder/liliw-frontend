'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href={href}
        onClick={onClick}
        className="px-3 py-2 text-gray-100 hover:text-white font-semibold transition-all duration-300 rounded-lg hover:bg-white/10 text-sm whitespace-nowrap block"
      >
        {label}
      </Link>
    </motion.div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/attractions', label: 'Attractions' },
    { href: '/culture', label: 'Culture' },
    { href: '/heritage', label: 'Heritage' },
    { href: '/itineraries', label: 'Tours' },
    { href: '/community', label: 'Participate' },
    { href: '/news', label: 'News' },
  ];

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
        <div className="flex justify-between items-center gap-4">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.08 }} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div
              className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg text-white"
              style={{ backgroundColor: '#00BFB3' }}
            >
              L
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white hidden sm:block">Liliw</h1>
          </motion.div>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          {/* 3D Tours Button - Always visible */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
            <Link
              href="/immersive"
              className="relative px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm text-white overflow-hidden group/btn transition-all duration-300 inline-flex items-center gap-1 sm:gap-2"
              style={{
                background: 'linear-gradient(135deg, #00BFB3 0%, #00A39E 100%)',
                boxShadow: '0 4px 15px rgba(0, 191, 179, 0.4)',
              }}
            >
              <span className="relative z-10 flex items-center gap-1">
                <span className="text-sm sm:text-base">🥽</span>
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

          {/* Mobile Menu Button - Visible on lg and below */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10 text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Navigation - Dropdown menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    onClick={closeMenu}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
