'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, MessageCircle, Send, Download, CheckCircle, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';

const ALL_LINKS = [
  { href: '/about',       label: 'About' },
  { href: '/attractions', label: 'Attractions' },
  { href: '/heritage',    label: 'Heritage' },
  { href: '/dining',      label: 'Dining' },
  { href: '/itineraries', label: 'Itineraries' },
  { href: '/news',        label: 'News & Events' },
  { href: '/community',   label: 'Participate' },
  { href: '/faq',         label: 'FAQ' },
  { href: '/contact',     label: 'Contact' },
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
          style={{ backgroundColor: '#1565C0', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: DL }}>L</div>
              <div>
                <p className="text-white font-bold text-sm" style={{ fontFamily: HL }}>Add to Home Screen</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: BL }}>Liliw Tourism · iOS Safari</p>
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
                  style={{ backgroundColor: 'rgba(245,197,24,0.2)', color: '#F5C518', fontFamily: HL }}>{step}</span>
                <p className="text-white/70 text-sm leading-snug" style={{ fontFamily: BL }}><span className="mr-1.5">{icon}</span>{text}</p>
              </div>
            ))}
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 mt-1"
              style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: BL }}>
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

  return (
    <>
      {iosModalOpen && <IOSInstallModal onClose={() => setIosModalOpen(false)} />}

      <footer className="mt-0" style={{ backgroundColor: '#1565C0' }}>
        {/* Wave top — white wave on blue */}
        <div style={{ lineHeight: 0, backgroundColor: '#fff' }}>
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width: '100%', height: 70, display: 'block' }}>
            <path d="M0,0 C480,70 960,0 1440,70 L1440,70 L0,70 Z" fill="#1565C0" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-8 pb-12 text-center text-white">

          {/* Logo */}
          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: DL }}>L</div>
            <div className="text-left">
              <h3 className="text-xl font-bold leading-none" style={{ fontFamily: HL }}>Liliw Tourism</h3>
              <p className="text-white/50 text-xs mt-0.5" style={{ fontFamily: BL }}>Laguna, Philippines</p>
            </div>
          </div>

          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto" style={{ fontFamily: BL }}>
            Discover the beauty, heritage, and vibrant culture of Liliw — your ultimate guide to experiencing this Laguna gem.
          </p>

          {/* Social icons */}
          <div className="flex justify-center gap-3 mb-6">
            {SOCIAL.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <s.icon size={16} className="text-white" />
              </a>
            ))}
          </div>

          {/* Install CTA */}
          {(showAndroid || showIOS || showInstalled) && (
            <div className="flex justify-center mb-6">
              {showInstalled && (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: 'rgba(245,197,24,0.2)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.3)', fontFamily: BL }}>
                  <CheckCircle size={15} /> App Installed
                </div>
              )}
              {showAndroid && (
                <motion.button onClick={handleAndroidInstall} disabled={installing}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-opacity disabled:opacity-70"
                  style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: BL }}>
                  {installing
                    ? <><span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(21,101,192,0.3)', borderTopColor: '#1565C0' }} /> Installing…</>
                    : <><Download size={15} /> Install App</>}
                </motion.button>
              )}
              {showIOS && (
                <motion.button onClick={() => setIosModalOpen(true)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                  style={{ backgroundColor: '#F5C518', color: '#1565C0', fontFamily: BL }}>
                  <Smartphone size={15} /> Add to Home Screen
                </motion.button>
              )}
            </div>
          )}

          {/* Nav links */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6">
            {ALL_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className="text-white/60 hover:text-white text-sm transition-colors"
                style={{ fontFamily: BL }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact mini-row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mb-6 text-xs text-white/40" style={{ fontFamily: BL }}>
            <span className="flex items-center gap-1.5"><Phone size={11} /> +63 (49) 501-1234</span>
            <span className="flex items-center gap-1.5"><Mail size={11} /> info@liliwtourism.com</span>
            <span className="flex items-center gap-1.5"><MapPin size={11} /> Liliw, Laguna 4002</span>
          </div>

          {/* Divider */}
          <div className="w-16 h-px mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* Legal + copyright */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-white/30" style={{ fontFamily: BL }}>
            <span>&copy; {year} Liliw Tourism. All rights reserved.</span>
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>

        </div>
      </footer>
    </>
  );
}
