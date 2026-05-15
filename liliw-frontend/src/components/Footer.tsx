'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, MessageCircle, Send, Download, CheckCircle, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXPLORE_LINKS = [
  { href: '/attractions', label: 'Attractions' },
  { href: '/heritage',    label: 'Heritage Sites' },
  { href: '/culture',     label: 'Culture & Traditions' },
  { href: '/arts',        label: 'Arts & Creatives' },
  { href: '/itineraries', label: 'Tours & Itineraries' },
];

const RESOURCE_LINKS = [
  { href: '/news',      label: 'News & Events' },
  { href: '/community', label: 'Community & Participate' },
  { href: '/faq',       label: 'FAQ' },
  { href: '/about',     label: 'About Liliw' },
  { href: '/contact',   label: 'Contact Us' },
];

const SOCIAL = [
  { icon: Share2,        href: 'https://facebook.com/liliwtourism',  label: 'Facebook' },
  { icon: MessageCircle, href: 'https://instagram.com/liliwtourism', label: 'Instagram' },
  { icon: Send,          href: 'https://twitter.com/liliwtourism',   label: 'Twitter' },
];

function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div key="ios-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div key="ios-modal"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#0B3D91', border: '1px solid rgba(245,197,24,0.3)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: 'var(--font-display)' }}>L</div>
              <div>
                <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Add to Home Screen</p>
                <p className="text-white/40 text-xs">Liliw Tourism · iOS Safari</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {[
              { step: 1, icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
              { step: 2, icon: '📋', text: 'Scroll down and tap "Add to Home Screen"' },
              { step: 3, icon: '✅', text: 'Tap "Add" in the top right corner' },
            ].map(({ step, icon, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'rgba(245,197,24,0.18)', color: '#F5C518' }}>{step}</span>
                <p className="text-white/70 text-sm leading-snug"><span className="mr-1.5">{icon}</span>{text}</p>
              </div>
            ))}
            <div className="mt-4 p-3 rounded-xl text-xs text-white/40 leading-relaxed"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Once added, Liliw Tourism will launch like a native app — full screen, no browser bar, works offline.
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 mt-1"
              style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: 'var(--font-body)' }}>
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling]         = useState(false);
  const [installed, setInstalled]           = useState(false);
  const [isIOS, setIsIOS]                   = useState(false);
  const [iosModalOpen, setIosModalOpen]     = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    if (!ios) {
      const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
      const installedHandler = () => { setInstalled(true); setDeferredPrompt(null); };
      window.addEventListener('beforeinstallprompt', handler);
      window.addEventListener('appinstalled', installedHandler);
      return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installedHandler); };
    }
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const showAndroid   = !installed && !!deferredPrompt;
  const showIOS       = !installed && isIOS;
  const showInstalled = installed;

  const linkStyle = {
    fontFamily: 'var(--font-body), "Plus Jakarta Sans", sans-serif',
    fontSize: 14,
  };

  const headingStyle = {
    fontFamily: 'var(--font-heading), Outfit, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#F5C518',
  };

  return (
    <>
      {iosModalOpen && <IOSInstallModal onClose={() => setIosModalOpen(false)} />}

      <footer className="mt-20 text-white" style={{ backgroundColor: '#0B3D91' }}>
        {/* Fiesta Gold top rule */}
        <div style={{ height: 2, backgroundColor: '#F5C518' }} />

        {/* Subtle grain texture overlay */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto px-4 pt-14 pb-10 relative">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">

            {/* Brand */}
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shrink-0"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: 'var(--font-display)' }}>L</div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading), Outfit, sans-serif' }}>Liliw</h3>
              </div>
              <div className="w-8 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518', opacity: 0.6 }} />
              <p className="text-white/60 text-sm leading-relaxed mb-5" style={linkStyle}>
                Discover the natural beauty, cultural heritage, and authentic traditions of Liliw, Laguna.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Tourism', 'Heritage', 'Community'].map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: 'rgba(245,197,24,0.12)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.2)', fontFamily: 'var(--font-heading)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Explore */}
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <h4 style={headingStyle} className="mb-1">Explore</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518', opacity: 0.4 }} />
              <nav className="space-y-2.5">
                {EXPLORE_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    style={linkStyle}>
                    <span className="w-1 h-1 rounded-full shrink-0 transition-all group-hover:w-2 group-hover:bg-yellow-400"
                      style={{ backgroundColor: 'rgba(245,197,24,0.4)' }} />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>

            {/* Resources */}
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <h4 style={headingStyle} className="mb-1">Resources</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518', opacity: 0.4 }} />
              <nav className="space-y-2.5">
                {RESOURCE_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    style={linkStyle}>
                    <span className="w-1 h-1 rounded-full shrink-0 transition-all group-hover:w-2 group-hover:bg-yellow-400"
                      style={{ backgroundColor: 'rgba(245,197,24,0.4)' }} />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>

            {/* Contact */}
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <h4 style={headingStyle} className="mb-1">Contact</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#F5C518', opacity: 0.4 }} />
              <div className="space-y-3.5 text-sm text-white/50">
                {[
                  { Icon: Phone, text: '+63 (49) 501-1234' },
                  { Icon: Mail,  text: 'info@liliwtourism.com' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-start gap-3 group">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(245,197,24,0.1)' }}>
                      <Icon size={13} style={{ color: '#F5C518' }} />
                    </div>
                    <span className="group-hover:text-white transition-colors" style={linkStyle}>{text}</span>
                  </div>
                ))}
                <div className="flex items-start gap-3 group">
                  <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(245,197,24,0.1)' }}>
                    <MapPin size={13} style={{ color: '#F5C518' }} />
                  </div>
                  <span className="group-hover:text-white transition-colors" style={linkStyle}>
                    Liliw, Laguna<br />Philippines 4002
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pt-6 border-t"
            style={{ borderColor: 'rgba(245,197,24,0.15)' }}>
            <p className="text-sm text-white/30" style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>
              &copy; {year} Liliw Tourism. All rights reserved.
            </p>

            {/* Install CTA */}
            <div>
              {showInstalled && (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: 'rgba(245,197,24,0.1)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.25)', fontFamily: 'var(--font-body)' }}>
                  <CheckCircle size={15} /> App Installed
                </div>
              )}
              {showAndroid && (
                <motion.button onClick={handleAndroidInstall} disabled={installing}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-opacity disabled:opacity-70"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: 'var(--font-body)' }}>
                  {installing
                    ? <><span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,61,145,0.3)', borderTopColor: '#0B3D91' }} /> Installing…</>
                    : <><Download size={15} /> Install App</>}
                </motion.button>
              )}
              {showIOS && (
                <motion.button onClick={() => setIosModalOpen(true)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm"
                  style={{ backgroundColor: '#F5C518', color: '#0B3D91', fontFamily: 'var(--font-body)' }}>
                  <Smartphone size={15} /> Add to Home Screen
                </motion.button>
              )}
            </div>

            {/* Social + legal */}
            <div className="flex items-center gap-5">
              <div className="flex gap-2">
                {SOCIAL.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                    className="p-2 rounded-full transition hover:opacity-80"
                    style={{ backgroundColor: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.15)' }}>
                    <s.icon size={15} style={{ color: '#F5C518' }} />
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/30" style={linkStyle}>
                <Link href="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
                <Link href="#" className="hover:text-white/60 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
