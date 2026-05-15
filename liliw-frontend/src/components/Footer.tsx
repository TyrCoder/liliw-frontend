'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, MessageCircle, Send, Download, CheckCircle, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const EXPLORE_LINKS = [
  { href: '/attractions', label: 'Attractions' },
  { href: '/heritage', label: 'Heritage Sites' },
  { href: '/culture', label: 'Culture & Traditions' },
  { href: '/arts', label: 'Arts & Creatives' },
  { href: '/itineraries', label: 'Tours & Itineraries' },
];

const RESOURCE_LINKS = [
  { href: '/news', label: 'News & Events' },
  { href: '/community', label: 'Community & Participate' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About Liliw' },
  { href: '/contact', label: 'Contact Us' },
];

const SOCIAL = [
  { icon: Share2, href: 'https://facebook.com/liliwtourism', label: 'Facebook' },
  { icon: MessageCircle, href: 'https://instagram.com/liliwtourism', label: 'Instagram' },
  { icon: Send, href: 'https://twitter.com/liliwtourism', label: 'Twitter' },
];

/* ─── iOS How-to Modal ────────────────────────────────────────────── */
function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="ios-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          key="ios-modal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#0F1F3C', border: '1px solid rgba(0,191,179,0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}>
                L
              </div>
              <div>
                <p className="text-white font-bold text-sm">Add to Home Screen</p>
                <p className="text-white/40 text-xs">Liliw Tourism · iOS Safari</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {/* Steps */}
            {[
              { step: 1, icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
              { step: 2, icon: '📋', text: 'Scroll down and tap "Add to Home Screen"' },
              { step: 3, icon: '✅', text: 'Tap "Add" in the top right corner' },
            ].map(({ step, icon, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'rgba(0,191,179,0.2)', color: '#00BFB3' }}
                >
                  {step}
                </span>
                <p className="text-white/70 text-sm leading-snug">
                  <span className="mr-1.5">{icon}</span>{text}
                </p>
              </div>
            ))}

            <div
              className="mt-4 p-3 rounded-xl text-xs text-white/40 leading-relaxed"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Once added, Liliw Tourism will launch like a native app — full screen, no browser bar, works offline.
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 mt-1"
              style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────── */
export default function Footer() {
  const year = new Date().getFullYear();

  // Android / desktop Chrome install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  // iOS detection
  const [isIOS, setIsIOS] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (standalone) { setInstalled(true); return; }

    // Detect iOS (iPhone / iPad / iPod)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (!ios) {
      const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
      const installedHandler = () => { setInstalled(true); setDeferredPrompt(null); };
      window.addEventListener('beforeinstallprompt', handler);
      window.addEventListener('appinstalled', installedHandler);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', installedHandler);
      };
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

  // Decide which install CTA to show
  const showAndroid = !installed && !!deferredPrompt;
  const showIOS = !installed && isIOS;
  const showInstalled = installed;

  return (
    <>
      {/* iOS instruction modal */}
      {iosModalOpen && <IOSInstallModal onClose={() => setIosModalOpen(false)} />}

      <footer className="mt-20 text-white" style={{ backgroundColor: '#0F1F3C' }}>
        {/* Teal accent line */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(to right, transparent 0%, #00BFB3 40%, #00BFB3 60%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        {/* Main grid */}
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14"
          >
            {/* Brand */}
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-bold mb-1" style={{ color: '#00BFB3' }}>Liliw</h3>
              <div className="w-8 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                Discover the natural beauty, cultural heritage, and authentic traditions of Liliw, Laguna.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Tourism', 'Heritage', 'Community'].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: 'rgba(0,191,179,0.12)', color: '#00BFB3', border: '1px solid rgba(0,191,179,0.2)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Explore */}
            <motion.div variants={itemVariants}>
              <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>Explore</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
              <nav className="space-y-2.5">
                {EXPLORE_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>

            {/* Resources */}
            <motion.div variants={itemVariants}>
              <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>Resources</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
              <nav className="space-y-2.5">
                {RESOURCE_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>

            {/* Contact */}
            <motion.div variants={itemVariants}>
              <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>Contact</h4>
              <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
              <div className="space-y-3.5 text-sm text-gray-400">
                {[
                  { Icon: Phone, text: '+63 (49) 501-1234' },
                  { Icon: Mail, text: 'info@liliwtourism.com' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-start gap-3 group">
                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
                      <Icon size={13} style={{ color: '#00BFB3' }} />
                    </div>
                    <span className="group-hover:text-white transition-colors">{text}</span>
                  </div>
                ))}
                <div className="flex items-start gap-3 group">
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
                    <MapPin size={13} style={{ color: '#00BFB3' }} />
                  </div>
                  <span className="group-hover:text-white transition-colors">Liliw, Laguna<br />Philippines 4002</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom bar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pt-6 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Copyright */}
            <motion.p variants={itemVariants} className="text-sm text-gray-500">
              &copy; {year} Liliw Tourism. All rights reserved.
            </motion.p>

            {/* Install CTA — platform-aware */}
            <motion.div variants={itemVariants}>
              {showInstalled && (
                <div
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: 'rgba(0,191,179,0.1)', color: '#00BFB3', border: '1px solid rgba(0,191,179,0.25)' }}
                >
                  <CheckCircle size={15} /> App Installed
                </div>
              )}

              {/* Android / desktop Chrome */}
              {showAndroid && (
                <motion.button
                  onClick={handleAndroidInstall}
                  disabled={installing}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-opacity disabled:opacity-70"
                  style={{ backgroundColor: '#00BFB3', color: '#0F1F3C', boxShadow: '0 0 20px rgba(0,191,179,0.25)' }}
                >
                  {installing
                    ? <><span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(15,31,60,0.3)', borderTopColor: '#0F1F3C' }} /> Installing…</>
                    : <><Download size={15} /> Install App</>
                  }
                </motion.button>
              )}

              {/* iOS Safari */}
              {showIOS && (
                <motion.button
                  onClick={() => setIosModalOpen(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg"
                  style={{ backgroundColor: '#00BFB3', color: '#0F1F3C', boxShadow: '0 0 20px rgba(0,191,179,0.25)' }}
                >
                  <Smartphone size={15} /> Add to Home Screen
                </motion.button>
              )}
            </motion.div>

            {/* Social + Legal */}
            <motion.div variants={itemVariants} className="flex items-center gap-5">
              <div className="flex gap-2">
                {SOCIAL.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                    className="p-2 rounded-full transition hover:opacity-80"
                    style={{ backgroundColor: 'rgba(0,191,179,0.12)', border: '1px solid rgba(0,191,179,0.15)' }}>
                    <s.icon size={15} style={{ color: '#00BFB3' }} />
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
                <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </>
  );
}
