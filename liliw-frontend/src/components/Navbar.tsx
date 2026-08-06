'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, User, BookmarkCheck, ChevronDown, Search, Bell, MessageSquare, Users, Building2, MapPin, Newspaper, CalendarDays, Settings, Trophy, Compass, Route, Info, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import SmartSearchModal from '@/components/SmartSearchModal';
import { openPassport } from '@/components/PassportHost';
import { PASSPORT_TRIPS_PAGE } from '@/components/Passport';

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

// Royal blue is the only festival colour that carries meaning here — active
// page, primary action, wordmark. The rest live in the woven border and the
// edge ribbons only. See the palette note in globals.css.
const ROYAL = '#0F5FB5';
const INK   = '#334155';

/** A section is current when you are on it or anywhere beneath it. */
function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href, label, icon: Icon, active = false, variant = 'bar', onClick,
}: {
  href: string; label: string; icon?: LucideIcon; active?: boolean;
  variant?: 'bar' | 'menu'; onClick?: () => void;
}) {
  // A centre-out underline suits a compact bar item; stretched across a
  // full-width menu row it just reads as a stray rule, so the menu gets a
  // background wash instead.
  const inMenu = variant === 'menu';
  return (
    <Link href={href} onClick={onClick} data-active={active}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2 font-medium rounded-full text-sm whitespace-nowrap transition-colors duration-[250ms] ${
        inMenu
          ? `px-3.5 py-2.5 ${active ? '' : 'hover:bg-blue-50/70'}`
          : 'nav-underline px-3 2xl:px-3.5 py-2'
      } ${active ? 'text-white' : 'hover:text-[#0F5FB5]'}`}
      style={{
        color: active ? '#fff' : INK,
        fontFamily: BL,
        backgroundColor: active ? ROYAL : 'transparent',
        boxShadow: active ? '0 6px 16px -6px rgba(15,95,181,0.65)' : 'none',
      }}>
      {/* Across seven links an icon costs ~22px each, which is the difference
          between fitting and not fitting in the bar at xl — so there they wait
          for 2xl. The menu has vertical room, so it always shows them. */}
      {Icon && (
        <Icon className={`w-3.5 h-3.5 shrink-0 ${inMenu ? '' : 'hidden 2xl:block'}`} strokeWidth={1.75} />
      )}
      {label}
    </Link>
  );
}

// Same look as NavLink, for entries that open something in place rather than
// navigating — the passport being the one that does.
function NavAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3.5 py-2 font-medium transition-colors duration-[250ms] rounded-full text-sm whitespace-nowrap block w-full text-left hover:text-[#0F5FB5] hover:bg-blue-50/70"
      style={{ color: INK, fontFamily: BL }}>
      {label}
    </button>
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
  const pathname = usePathname();

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
    { href: '/about',       label: 'About Liliw',   icon: Info },
    { href: '/attractions', label: 'Tourism',       icon: MapPin },
    { href: '/itineraries', label: 'Itinerary',     icon: Route },
    { href: '/news',        label: 'News & Events', icon: CalendarDays },
    { href: '/community',   label: 'Participate',   icon: Users },
    { href: '/contact',     label: 'Contact',       icon: MessageSquare },
  ];

  // Browsing anything under Explore should light the Explore trigger, even
  // though none of those pages is a top-level link.
  const exploreActive = exploreLinks.some(l => isCurrent(pathname, l.href));

  const dropdownStyle = {
    background: '#fff',
    boxShadow: '0 12px 44px rgba(15,23,42,0.14)',
    border: '1px solid #E8EDF3',
  };

  // Note: the nav must not be overflow-hidden — the Explore, notification and
  // user menus sit at top-full and would be clipped away by it. The ribbons are
  // inset within the bar, so they need no clipping of their own.
  return (
    <>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          boxShadow: scrolled ? '0 6px 28px -12px rgba(15,23,42,0.22)' : 'none',
          transition: 'box-shadow 300ms ease, background-color 300ms ease',
        }}>

        {/* Festival ribbons entering from either edge. Kept at 7% and pinned
            behind the content so they colour the bar without ever competing
            with a label or catching a click. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-40 sm:w-64"
          style={{
            opacity: 0.07,
            background:
              'radial-gradient(120% 90% at 0% 30%, var(--festival-magenta) 0%, transparent 60%),' +
              'radial-gradient(90% 70% at 12% 90%, var(--festival-orange) 0%, transparent 65%)',
          }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-40 sm:w-64"
          style={{
            opacity: 0.07,
            background:
              'radial-gradient(120% 90% at 100% 30%, var(--festival-cyan) 0%, transparent 60%),' +
              'radial-gradient(90% 70% at 88% 90%, var(--festival-yellow) 0%, transparent 65%)',
          }} />

        {/* The container widens past 2xl so the full nav, the tagline and the
            username can all be shown at once — inside max-w-7xl they cannot. */}
        <div className="relative z-10 max-w-7xl 2xl:max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3 sm:gap-4 xl:gap-5">

            {/* Logo */}
            <motion.div whileHover={{ scale: 1.03 }} className="shrink-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative w-9 sm:w-11 h-9 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg overflow-hidden shrink-0"
                  style={{
                    backgroundColor: ROYAL,
                    color: 'var(--festival-yellow)',
                    fontFamily: HL,
                    boxShadow: '0 8px 20px -8px rgba(15,95,181,0.75)',
                  }}>
                  {/* Sole tread running across the mark */}
                  <span aria-hidden className="liliw-tread absolute inset-0" />
                  <span className="relative">L</span>
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold leading-none tracking-[0.14em]"
                    style={{ fontFamily: HL, color: ROYAL }}>LILIW</h1>
                  {/* Hidden only in the xl band, where the full nav appears but
                      the container has not widened yet and every pixel counts. */}
                  <p className="text-[10.5px] leading-none mt-1 font-medium tracking-wide whitespace-nowrap xl:hidden 2xl:block"
                    style={{ color: '#64748B', fontFamily: BL }}>Home of the Tsinelas Festival</p>
                </div>
              </Link>
            </motion.div>

            {/* Desktop nav — seven links plus the action cluster genuinely do
                not fit before 1280px, so below xl it all moves into the menu.
                overflow-x-auto is the last resort: at an unusual zoom or font
                size the row scrolls rather than overflowing the bar. */}
            <div className="hidden xl:flex items-center gap-0.5 2xl:gap-1.5 flex-1 justify-center min-w-0 overflow-x-auto scrollbar-hide">
              <NavLink href="/about" label="About Liliw" icon={Info} active={isCurrent(pathname, '/about')} />

              {/* Explore dropdown */}
              <div className="relative">
                <button onClick={() => setExploreOpen(p => !p)}
                  data-active={exploreActive}
                  aria-current={exploreActive ? 'page' : undefined}
                  className={`nav-underline flex items-center gap-1.5 px-3 2xl:px-3.5 py-2 font-medium rounded-full text-sm whitespace-nowrap transition-colors duration-[250ms] ${
                    exploreActive ? 'text-white' : 'hover:text-[#0F5FB5]'
                  }`}
                  style={{
                    fontFamily: BL,
                    color: exploreActive ? '#fff' : INK,
                    backgroundColor: exploreActive ? ROYAL : exploreOpen ? 'rgba(15,95,181,0.08)' : 'transparent',
                    boxShadow: exploreActive ? '0 6px 16px -6px rgba(15,95,181,0.65)' : 'none',
                  }}>
                  <Compass className="w-3.5 h-3.5 shrink-0 hidden 2xl:block" strokeWidth={1.75} />
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
                        {exploreLinks.map((link, i) => {
                          // The four decorative festival colours cycle through
                          // the submenu dots — the one place they appear beside
                          // text, small enough to read as craft, not carnival.
                          const dots = ['var(--royal-blue)', 'var(--festival-cyan)', 'var(--festival-yellow)', 'var(--festival-orange)', 'var(--festival-magenta)'];
                          const on = isCurrent(pathname, link.href);
                          return (
                            <Link key={link.href} href={link.href} onClick={() => setExploreOpen(false)}
                              aria-current={on ? 'page' : undefined}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-blue-50/70"
                              style={{ color: on ? ROYAL : INK, fontFamily: BL, fontWeight: on ? 700 : 500 }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: dots[i % dots.length] }} />
                              {link.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.slice(1).map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon}
                  active={isCurrent(pathname, link.href)} />
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 2xl:gap-3 shrink-0">
              {/* Search — shaped like a field, not a button, so it reads as
                  somewhere to type rather than a third call to action. The
                  label only fits once the container widens at 2xl; below that
                  it collapses to the icon, and below sm it lives in the menu. */}
              <button onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 2xl:pl-3.5 2xl:pr-4 py-2 rounded-full text-sm font-medium transition-colors duration-[250ms] border hover:border-[#0F5FB5]/40 hover:bg-white"
                style={{ color: '#64748B', fontFamily: BL, borderColor: '#E2E8F0', backgroundColor: 'rgba(248,250,252,0.9)' }}
                aria-label="Search Liliw">
                <Search className="w-4 h-4 shrink-0" strokeWidth={1.9} />
                <span className="hidden 2xl:inline text-xs">Discover Liliw...</span>
              </button>

              {/* Map — the primary pill. Collapses to a round icon button on
                  phones, where the label would push the row over the edge. */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/map" aria-label="Map"
                  className="w-9 h-9 sm:w-auto sm:h-auto sm:px-4 2xl:px-5 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-shadow inline-flex items-center justify-center gap-1.5 text-white"
                  style={{
                    backgroundColor: ROYAL, fontFamily: BL,
                    boxShadow: '0 8px 20px -8px rgba(15,95,181,0.8)',
                  }}>
                  <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2} />
                  <span className="hidden sm:inline">Map</span>
                </Link>
              </motion.div>

              {/* 3D Tour — the secondary pill, outlined so the pair reads as
                  primary and secondary rather than two competing actions.
                  Hidden on phones; it is in the menu instead. */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="hidden sm:block">
                <Link href="/immersive"
                  className="px-3.5 2xl:px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm border transition-colors duration-[250ms] inline-flex items-center gap-1.5 hover:bg-blue-50"
                  style={{
                    borderColor: 'rgba(15,95,181,0.35)', color: ROYAL, fontFamily: BL,
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    boxShadow: '0 4px 14px -8px rgba(15,23,42,0.35)',
                  }}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  3D Tour
                </Link>
              </motion.div>

              {/* Notification bell — all logged-in users */}
              {user && (
                <div className="relative">
                  <button onClick={() => notifOpen ? setNotifOpen(false) : openNotif()}
                    className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-blue-50 transition-colors duration-[250ms]"
                    aria-label="Notifications">
                    <Bell className="w-5 h-5" strokeWidth={1.9} style={{ color: INK }} />
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
                          className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl overflow-hidden z-20"
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
                              className="text-xs font-semibold hover:underline" style={{ color: ROYAL }}>
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
                    aria-label="Account menu"
                    className="flex items-center gap-2 p-1 2xl:pl-1.5 2xl:pr-3 2xl:py-1.5 rounded-full hover:bg-blue-50 transition-colors duration-[250ms]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: ROYAL, fontFamily: HL, boxShadow: '0 4px 12px -4px rgba(15,95,181,0.7)' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Name and role badge only once the container widens — in
                        the xl band that space belongs to the nav links. */}
                    <span className="hidden 2xl:inline text-sm font-medium max-w-24 truncate"
                      style={{ fontFamily: BL, color: INK }}>
                      {user.username}
                    </span>
                    {isStaff && (
                      <span className="hidden 2xl:inline text-xs font-bold px-1.5 py-0.5 rounded-full"
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
                          {/* The passport opens over the current page rather
                              than navigating — that is the whole point of it
                              being a booklet you pull out. */}
                          {[
                            { page: 0,                   icon: <User className="w-4 h-4" />,          label: 'View Profile' },
                            { page: PASSPORT_TRIPS_PAGE, icon: <BookmarkCheck className="w-4 h-4" />, label: 'Saved Itineraries' },
                          ].map(item => (
                            <button key={item.label}
                              onClick={() => { setUserMenuOpen(false); openPassport(item.page); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition"
                              style={{ color: INK, fontFamily: BL }}>
                              <span className="text-blue-600">{item.icon}</span> {item.label}
                            </button>
                          ))}
                          <Link href="/rewards" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition"
                            style={{ color: INK, fontFamily: BL }}>
                            <span className="text-blue-600"><Trophy className="w-4 h-4" /></span> Rewards
                          </Link>
                          <Link href="/profile/edit" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                            style={{ color: INK, fontFamily: BL }}>
                            <Settings className="w-4 h-4 text-blue-600" /> Edit Profile
                          </Link>
                          {isStaff && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                              style={{ color: INK, fontFamily: BL }}>
                              <LayoutDashboard className="w-4 h-4 text-blue-600" />
                              {isAdmin ? 'Admin Dashboard' : isChatoOfficer ? 'Officer Dashboard' : 'Editor Dashboard'}
                            </Link>
                          )}
                          {isLocal && isLbo && (
                            <Link href="/lbo" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition border-t border-gray-100"
                              style={{ color: INK, fontFamily: BL }}>
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
                  className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 2xl:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-[250ms] border hover:text-[#0F5FB5] hover:bg-blue-50"
                  style={{ color: INK, fontFamily: BL, borderColor: '#E2E8F0' }}
                  aria-label="Log in">
                  <User className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2} />
                  <span className="hidden sm:inline">Login</span>
                </motion.button>
              )}

              {/* Menu toggle — shown right up to xl, since that is where the
                  horizontal nav starts fitting. */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleMenu}
                className="xl:hidden p-2 rounded-full transition-colors duration-[250ms] hover:bg-blue-50"
                style={{ color: INK }} aria-label="Toggle menu">
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
                className="xl:hidden mt-4 pt-4 border-t border-gray-100">
                {/* Capped so a long menu — staff links, business dashboard —
                    scrolls on a short screen instead of running off it. */}
                <div className="flex flex-col gap-1 max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain pb-1">
                  <NavLink href="/about" label="About Liliw" icon={Info} variant="menu"
                    active={isCurrent(pathname, '/about')} onClick={closeMenu} />
                  <div className="pl-3 border-l-2 space-y-0.5 my-1" style={{ borderColor: ROYAL }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 py-1.5"
                      style={{ fontFamily: HL }}>Explore</p>
                    {exploreLinks.map(link => (
                      <NavLink key={link.href} href={link.href} label={link.label} variant="menu"
                        active={isCurrent(pathname, link.href)} onClick={closeMenu} />
                    ))}
                  </div>
                  {navLinks.slice(1).map((link) => (
                    <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} variant="menu"
                      active={isCurrent(pathname, link.href)} onClick={closeMenu} />
                  ))}
                  {user && (
                    <>
                      <NavAction label="My Profile"        onClick={() => { closeMenu(); openPassport(0); }} />
                      <NavAction label="Saved Itineraries" onClick={() => { closeMenu(); openPassport(PASSPORT_TRIPS_PAGE); }} />
                      <NavLink href="/rewards" label="Rewards" icon={Trophy} variant="menu" active={isCurrent(pathname, "/rewards")} onClick={closeMenu} />
                    </>
                  )}
                  {isStaff && <NavLink href="/admin" variant="menu" icon={LayoutDashboard} active={isCurrent(pathname, "/admin")} label={isAdmin ? "Admin Dashboard" : isChatoOfficer ? "Officer Dashboard" : "Editor Dashboard"} onClick={closeMenu} />}
                  {isLocal && isLbo  && <NavLink href="/lbo" label="Business Dashboard" icon={Building2} variant="menu" active={isCurrent(pathname, "/lbo")} onClick={closeMenu} />}

                  <button onClick={() => { setSearchOpen(true); closeMenu(); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition border w-full hover:bg-blue-50 hover:text-[#0F5FB5]"
                    style={{ color: '#64748B', fontFamily: BL, borderColor: '#E2E8F0', backgroundColor: 'rgba(248,250,252,0.9)' }}>
                    <Search className="w-4 h-4" strokeWidth={1.9} /> Discover Liliw...
                  </button>

                  <div className="flex gap-2.5 mt-2">
                    <Link href="/map" onClick={closeMenu}
                      className="flex-1 py-3 rounded-full font-semibold text-sm text-center text-white inline-flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: ROYAL, fontFamily: BL, boxShadow: '0 8px 20px -8px rgba(15,95,181,0.8)' }}>
                      <MapPin className="w-3.5 h-3.5" strokeWidth={2} /> Map
                    </Link>
                    <Link href="/immersive" onClick={closeMenu}
                      className="flex-1 py-3 rounded-full font-semibold text-sm text-center border inline-flex items-center justify-center gap-1.5"
                      style={{ borderColor: 'rgba(15,95,181,0.35)', color: ROYAL, fontFamily: BL }}>
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2} /> 3D Tour
                    </Link>
                  </div>

                  {!user && (
                    <button onClick={() => { setAuthModal('login'); closeMenu(); }}
                      className="mt-1 py-3 rounded-full font-bold text-sm text-center text-white"
                      style={{ backgroundColor: ROYAL, fontFamily: BL, boxShadow: '0 8px 20px -8px rgba(15,95,181,0.8)' }}>
                      Login / Register
                    </button>
                  )}
                  {user && (
                    <button onClick={() => { logout(); closeMenu(); }}
                      className="mt-1 py-3 rounded-full font-semibold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition">
                      Log Out
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Woven trim — slipper tread and banig weave, replacing the plain
            blue rule. Full-bleed so it reads as a band of fabric across the
            whole bar rather than a line under the content. */}
        <div aria-hidden className="liliw-weave absolute bottom-0 inset-x-0 h-[3px]"
          style={{ opacity: 0.9 }} />
      </motion.nav>

      {authModal && <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />}
      {searchOpen && <SmartSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
