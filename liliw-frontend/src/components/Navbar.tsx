'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, User, BookmarkCheck, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link href={href} onClick={onClick}
        className="px-3 py-2 text-gray-100 hover:text-white font-semibold transition-all duration-300 rounded-lg hover:bg-white/10 text-sm whitespace-nowrap block">
        {label}
      </Link>
    </motion.div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen]             = useState(false);
  const [authModal, setAuthModal]       = useState<'login' | 'register' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen]   = useState(false);
  const { user, logout, isAdmin }       = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu  = () => { setIsOpen(false); setExploreOpen(false); };

  const exploreLinks = [
    { href: '/heritage', label: 'History & Heritage' },
    { href: '/culture',  label: 'Culture & Traditions' },
    { href: '/arts',     label: 'Arts & Creatives' },
    { href: '/dining',   label: 'Dining' },
  ];

  const navLinks = [
    { href: '/about',       label: 'About Liliw' },
    { href: '/attractions', label: 'Tourism' },
    { href: '/itineraries', label: 'Itinerary' },
    { href: '/news',        label: 'News & Events' },
    { href: '/community',   label: 'Participate' },
    { href: '/contact',     label: 'Contact' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          backgroundColor: 'rgba(15, 31, 60, 0.97)',
          borderBottomColor: 'rgba(0,191,179,0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-4">

            {/* Logo */}
            <motion.div whileHover={{ scale: 1.08 }} className="shrink-0">
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg text-white"
                  style={{ backgroundColor: '#00BFB3' }}>L</div>
                <h1 className="text-lg sm:text-2xl font-bold text-white hidden sm:block">Liliw</h1>
              </Link>
            </motion.div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
              <NavLink href="/about" label="About Liliw" />

              {/* Explore dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setExploreOpen(p => !p)}
                  className={`flex items-center gap-1 px-3 py-2 font-semibold transition-all duration-300 rounded-lg text-sm whitespace-nowrap ${
                    exploreOpen ? 'text-white bg-white/15' : 'text-gray-100 hover:text-white hover:bg-white/10'
                  }`}>
                  Explore
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                <AnimatePresence>
                  {exploreOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExploreOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 py-1">
                        {exploreLinks.map(link => (
                          <Link key={link.href} href={link.href}
                            onClick={() => setExploreOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                            {link.label}
                          </Link>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.slice(1).map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Map + 3D */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/map"
                  className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5"
                  style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}>
                  Map
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/immersive"
                  className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border transition-colors inline-flex items-center gap-1.5"
                  style={{ borderColor: 'rgba(0,191,179,0.5)', color: '#00BFB3' }}>
                  3D Tour
                </Link>
              </motion.div>

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-white">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: '#00BFB3' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-semibold max-w-24 truncate">{user.username}</span>
                    {isAdmin && (
                      <span className="hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#00BFB3', fontSize: '10px' }}>
                        Admin
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                          <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                            <User className="w-4 h-4" style={{ color: '#00BFB3' }} /> View Profile
                          </Link>
                          <Link href="/profile#saved" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                            <BookmarkCheck className="w-4 h-4" style={{ color: '#00BFB3' }} /> Saved Itineraries
                          </Link>
                          {isAdmin && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100">
                              <LayoutDashboard className="w-4 h-4" style={{ color: '#00BFB3' }} /> Admin Dashboard
                            </Link>
                          )}
                          <button onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition border-t border-gray-100">
                            <LogOut className="w-4 h-4" /> Log Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition"
                  style={{ backgroundColor: '#00BFB3' }}>
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </motion.button>
              )}

              {/* Mobile menu toggle */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleMenu}
                className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10 text-white" aria-label="Toggle menu">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                className="lg:hidden mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex flex-col gap-2">
                  <NavLink href="/about" label="About Liliw" onClick={closeMenu} />
                  {/* Explore section in mobile */}
                  <div className="pl-3 border-l-2 space-y-1" style={{ borderColor: '#00BFB3' }}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1">Explore</p>
                    {exploreLinks.map(link => (
                      <NavLink key={link.href} href={link.href} label={link.label} onClick={closeMenu} />
                    ))}
                  </div>
                  {navLinks.slice(1).map((link) => (
                    <NavLink key={link.href} href={link.href} label={link.label} onClick={closeMenu} />
                  ))}
                  {user && (
                    <>
                      <NavLink href="/profile" label="My Profile" onClick={closeMenu} />
                      <NavLink href="/profile#saved" label="Saved Itineraries" onClick={closeMenu} />
                    </>
                  )}
                  {isAdmin && (
                    <NavLink href="/admin" label="Admin Dashboard" onClick={closeMenu} />
                  )}
                  <div className="flex gap-2 mt-1">
                    <Link href="/map" onClick={closeMenu}
                      className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-center"
                      style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}>Map</Link>
                    <Link href="/immersive" onClick={closeMenu}
                      className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-center border"
                      style={{ borderColor: 'rgba(0,191,179,0.5)', color: '#00BFB3' }}>3D Tour</Link>
                  </div>
                  {!user && (
                    <button onClick={() => { setAuthModal('login'); closeMenu(); }}
                      className="mt-1 py-2.5 rounded-lg font-bold text-sm text-white text-center"
                      style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)' }}>
                      Login / Register
                    </button>
                  )}
                  {user && (
                    <button onClick={() => { logout(); closeMenu(); }}
                      className="mt-1 py-2.5 rounded-lg font-semibold text-sm text-red-400 border border-red-200 hover:bg-red-50 transition">
                      Log Out
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Auth modal */}
      {authModal && (
        <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  );
}
