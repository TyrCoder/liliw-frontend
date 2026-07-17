'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, User, BookmarkCheck, ChevronDown, Search, Bell, MessageSquare, Users, Building2, MapPin, Newspaper, CalendarDays, Settings, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import SmartSearchModal from '@/components/SmartSearchModal';

type NotifItem = {
  id: string;
  type: 'submission' | 'participation' | 'lbo_application' | 'attraction_request' | 'event' | 'news' | 'achievement';
  title: string;
  subtitle: string;
  status?: string;
  createdAt: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notifIcon(type: NotifItem['type']) {
  if (type === 'submission')         return <MessageSquare className="w-3.5 h-3.5" />;
  if (type === 'participation')      return <Users className="w-3.5 h-3.5" />;
  if (type === 'lbo_application')    return <Building2 className="w-3.5 h-3.5" />;
  if (type === 'attraction_request') return <MapPin className="w-3.5 h-3.5" />;
  if (type === 'event')              return <CalendarDays className="w-3.5 h-3.5" />;
  if (type === 'news')               return <Newspaper className="w-3.5 h-3.5" />;
  if (type === 'achievement')        return <Trophy className="w-3.5 h-3.5" />;
}

function notifColor(type: NotifItem['type']) {
  if (type === 'submission')         return { bg: '#EFF6FF', color: '#1D4ED8' };
  if (type === 'participation')      return { bg: '#F0FDF4', color: '#166534' };
  if (type === 'lbo_application')    return { bg: '#FFF7ED', color: '#C2410C' };
  if (type === 'attraction_request') return { bg: '#F5F3FF', color: '#6D28D9' };
  if (type === 'event')              return { bg: '#FEF3C7', color: '#B45309' };
  if (type === 'news')               return { bg: '#F0FDF4', color: '#065F46' };
  if (type === 'achievement')        return { bg: '#FEF9C3', color: '#A16207' };
  return { bg: '#F1F5F9', color: '#475569' };
}

const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="px-3 py-2 font-medium transition-all duration-200 rounded-lg text-sm whitespace-nowrap block hover:bg-blue-50 hover:text-blue-700"
      style={{ color: '#374151', fontFamily: BL }}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen]             = useState(false);
  const [authModal, setAuthModal]       = useState<'login' | 'register' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen]   = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [isLbo,    setIsLbo]            = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifItems,   setNotifItems]   = useState<NotifItem[]>([]);
  const [newCount,     setNewCount]     = useState(0);
  const { user, token, logout, isAdmin, isChatoOfficer, isChatoEditor, isStaff, isLocal, adminPanelRole } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isLocal || !token) { setIsLbo(false); return; }
    fetch('/api/lbo/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setIsLbo(r.ok))
      .catch(() => setIsLbo(false));
  }, [isLocal, token]);

  useEffect(() => {
    if (!user || !token) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('liliw-notif-lastseen') : null;
    const lastSeen = stored ? Number(stored) : 0;
    const endpoint = isStaff ? '/api/admin/notifications' : '/api/notifications';
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data) {
          setNotifItems(d.data);
          setNewCount(d.data.filter((n: NotifItem) => new Date(n.createdAt).getTime() > lastSeen).length);
        }
      })
      .catch(() => {});
  }, [user, isStaff, token]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu  = () => { setIsOpen(false); setExploreOpen(false); };

  const openNotif = () => {
    setNotifOpen(true);
    const now = Date.now();
    if (typeof window !== 'undefined') localStorage.setItem('liliw-notif-lastseen', String(now));
    setNewCount(0);
  };

  const exploreLinks = [
    { href: '/heritage', label: 'History & Heritage' },
    { href: '/culture',  label: 'Culture & Traditions' },
    { href: '/arts',     label: 'Arts & Creatives' },
    { href: '/dining',   label: 'Dining' },
    { href: '/gallery',  label: 'Media Gallery' },
    { href: '/stories',  label: 'Stories' },
  ];

  const navLinks = [
    { href: '/about',       label: 'About Liliw' },
    { href: '/attractions', label: 'Tourism' },
    { href: '/itineraries', label: 'Itinerary' },
    { href: '/news',        label: 'News & Events' },
    { href: '/community',   label: 'Participate' },
    { href: '/contact',     label: 'Contact' },
  ];

  const dropdownStyle = {
    background: '#fff',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    border: '1px solid #E5E7EB',
  };

  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white"
        style={{
          borderBottom: '3px solid #1565C0',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.1)' : 'none',
          transition: 'box-shadow 300ms ease',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <div className="flex justify-between items-center gap-4">

            {/* Logo */}
            <motion.div whileHover={{ scale: 1.04 }} className="shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base"
                  style={{ backgroundColor: '#1565C0', color: '#F5C518', fontFamily: DL }}>
                  L
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold leading-none" style={{ fontFamily: HL, color: '#0B3D91' }}>Liliw</h1>
                  <p className="text-xs leading-none mt-0.5" style={{ color: '#9CA3AF' }}>Laguna, Philippines</p>
                </div>
              </Link>
            </motion.div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 justify-center">
              <NavLink href="/about" label="About Liliw" />

              {/* Explore dropdown */}
              <div className="relative">
                <button onClick={() => setExploreOpen(p => !p)}
                  className={`flex items-center gap-1 px-3 py-2 font-medium transition-all duration-200 rounded-lg text-sm whitespace-nowrap ${
                    exploreOpen ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                  style={{ fontFamily: BL }}>
                  Explore
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {exploreOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExploreOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-20 py-1.5"
                        style={dropdownStyle}>
                        {exploreLinks.map(link => (
                          <Link key={link.href} href={link.href} onClick={() => setExploreOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-blue-50 hover:text-blue-700"
                            style={{ color: '#374151', fontFamily: BL }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#1565C0' }} />
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
              {/* Search */}
              <button onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                style={{ color: '#6B7280', fontFamily: BL }}
                aria-label="Search">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline text-xs">Search...</span>
              </button>

              {/* Map */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/map"
                  className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-1.5 text-white"
                  style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
                  Map
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/immersive"
                  className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border transition-colors inline-flex items-center gap-1.5"
                  style={{ borderColor: '#1565C0', color: '#1565C0', fontFamily: BL }}>
                  3D Tour
                </Link>
              </motion.div>

              {/* Notification bell — all logged-in users */}
              {user && (
                <div className="relative">
                  <button onClick={() => notifOpen ? setNotifOpen(false) : openNotif()}
                    className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-blue-50 transition"
                    aria-label="Notifications">
                    <Bell className="w-5 h-5" style={{ color: '#374151' }} />
                    {newCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: '#EF4444', lineHeight: 1 }}>
                        {newCount > 9 ? '9+' : newCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -6 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-20"
                          style={dropdownStyle}>
                          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-900" style={{ fontFamily: HL }}>
                              {isStaff ? 'Notifications' : 'Latest Updates'}
                            </p>
                            <span className="text-xs text-gray-400">{notifItems.length} recent</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifItems.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-8">
                                {isStaff ? 'No recent activity' : 'No updates yet'}
                              </p>
                            ) : notifItems.map(n => {
                              const c = notifColor(n.type);
                              return (
                                <a key={n.id} href={isStaff ? '/admin' : (n.type === 'event' ? '/news' : '/news')} onClick={() => setNotifOpen(false)}
                                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: c.bg, color: c.color }}>
                                    {notifIcon(n.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                                    {n.subtitle && <p className="text-xs text-gray-400 truncate capitalize">{n.subtitle}</p>}
                                    <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                                  </div>
                                  {n.status && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0 mt-0.5"
                                      style={{
                                        backgroundColor: n.status === 'new' || n.status === 'pending' ? '#FEF3C7' : n.status === 'approved' ? '#D1FAE5' : n.status === 'rejected' ? '#FEE2E2' : '#E0E7FF',
                                        color: n.status === 'new' || n.status === 'pending' ? '#92400E' : n.status === 'approved' ? '#065F46' : n.status === 'rejected' ? '#991B1B' : '#3730A3',
                                      }}>
                                      {n.status}
                                    </span>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                          <div className="px-4 py-2.5 border-t border-gray-100">
                            <a href={isStaff ? '/admin' : '/news'} onClick={() => setNotifOpen(false)}
                              className="text-xs font-semibold hover:underline" style={{ color: '#1565C0' }}>
                              {isStaff ? 'View all in dashboard →' : 'See all news & events →'}
                            </a>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-24 truncate"
                      style={{ fontFamily: BL, color: '#374151' }}>
                      {user.username}
                    </span>
                    {isStaff && (
                      <span className="hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          fontSize: '10px', fontFamily: HL,
                          backgroundColor: isAdmin ? '#DBEAFE' : isChatoOfficer ? '#EDE9FE' : '#D1FAE5',
                          color: isAdmin ? '#1D4ED8' : isChatoOfficer ? '#6D28D9' : '#065F46',
                        }}>
                        {isAdmin ? (adminPanelRole ?? 'Admin') : isChatoOfficer ? 'CHATO Officer' : 'CHATO Editor'}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -6 }}
                          className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-20"
                          style={dropdownStyle}>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900" style={{ fontFamily: HL }}>{user.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            {isStaff && (
                              <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  fontFamily: HL,
                                  backgroundColor: isAdmin ? '#DBEAFE' : isChatoOfficer ? '#EDE9FE' : '#D1FAE5',
                                  color: isAdmin ? '#1D4ED8' : isChatoOfficer ? '#6D28D9' : '#065F46',
                                }}>
                                {isAdmin ? (adminPanelRole ?? 'Admin') : isChatoOfficer ? 'CHATO Officer' : 'CHATO Editor'}
                              </span>
                            )}
                          </div>
                          {[
                            { href: '/profile',       icon: <User className="w-4 h-4" />,          label: 'View Profile' },
                            { href: '/profile#saved', icon: <BookmarkCheck className="w-4 h-4" />, label: 'Saved Itineraries' },
                            { href: '/rewards',       icon: <Trophy className="w-4 h-4" />,        label: 'Rewards' },
                          ].map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition"
                              style={{ color: '#374151', fontFamily: BL }}>
                              <span className="text-blue-600">{item.icon}</span> {item.label}
                            </Link>
                          ))}
                          <Link href="/profile/edit" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                            style={{ color: '#374151', fontFamily: BL }}>
                            <Settings className="w-4 h-4 text-blue-600" /> Edit Profile
                          </Link>
                          {isStaff && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                              style={{ color: '#374151', fontFamily: BL }}>
                              <LayoutDashboard className="w-4 h-4 text-blue-600" />
                              {isAdmin ? 'Admin Dashboard' : isChatoOfficer ? 'Officer Dashboard' : 'Editor Dashboard'}
                            </Link>
                          )}
                          {isLocal && isLbo && (
                            <Link href="/lbo" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                              style={{ color: '#374151', fontFamily: BL }}>
                              <LayoutDashboard className="w-4 h-4 text-blue-500" />
                              Business Dashboard
                            </Link>
                          )}
                          <button onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition border-t border-gray-100"
                            style={{ fontFamily: BL }}>
                            <LogOut className="w-4 h-4" /> Log Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition border border-gray-300 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50"
                  style={{ color: '#374151', fontFamily: BL }}>
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </motion.button>
              )}

              {/* Mobile toggle */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleMenu}
                className="lg:hidden p-2 rounded-lg transition-colors hover:bg-blue-50"
                style={{ color: '#374151' }} aria-label="Toggle menu">
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                className="lg:hidden mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-1">
                  <NavLink href="/about" label="About Liliw" onClick={closeMenu} />
                  <div className="pl-3 border-l-2 space-y-0.5 my-1" style={{ borderColor: '#1565C0' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 py-1.5"
                      style={{ fontFamily: HL }}>Explore</p>
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
                      <NavLink href="/rewards" label="Rewards" onClick={closeMenu} />
                    </>
                  )}
                  {isStaff && <NavLink href="/admin" label={isAdmin ? 'Admin Dashboard' : isChatoOfficer ? 'Officer Dashboard' : 'Editor Dashboard'} onClick={closeMenu} />}
                  {isLocal && isLbo  && <NavLink href="/lbo" label="Business Dashboard" onClick={closeMenu} />}

                  <button onClick={() => { setSearchOpen(true); closeMenu(); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition border border-gray-200 w-full hover:bg-blue-50 hover:text-blue-700"
                    style={{ color: '#6B7280', fontFamily: BL }}>
                    <Search className="w-4 h-4" /> Search
                  </button>

                  <div className="flex gap-2 mt-2">
                    <Link href="/map" onClick={closeMenu}
                      className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-center text-white"
                      style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
                      Map
                    </Link>
                    <Link href="/immersive" onClick={closeMenu}
                      className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-center border"
                      style={{ borderColor: '#1565C0', color: '#1565C0', fontFamily: BL }}>
                      3D Tour
                    </Link>
                  </div>

                  {!user && (
                    <button onClick={() => { setAuthModal('login'); closeMenu(); }}
                      className="mt-1 py-2.5 rounded-lg font-bold text-sm text-center text-white"
                      style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
                      Login / Register
                    </button>
                  )}
                  {user && (
                    <button onClick={() => { logout(); closeMenu(); }}
                      className="mt-1 py-2.5 rounded-lg font-semibold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition">
                      Log Out
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {authModal && <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />}
      {searchOpen && <SmartSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
