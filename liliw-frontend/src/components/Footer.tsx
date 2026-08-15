'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Download, CheckCircle, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Wave from '@/components/liliw/Wave';

const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';
const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';

/**
 * Drawn inline because lucide-react no longer ships brand marks — the footer
 * had been standing in with Share2, which read as a generic share button
 * rather than a link to the town's page.
 */
const FacebookMark = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
  </svg>
);

// The CHATO page is the town's only account. Instagram and Twitter links were
// pointing at handles that do not exist, so they are not listed.
const FACEBOOK_URL = 'https://www.facebook.com/LiliwCHATO';

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
          style={{ backgroundColor: '#0F5FB5', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: '#F5C518', color: '#0F5FB5', fontFamily: DL }}>L</div>
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
              style={{ backgroundColor: '#F5C518', color: '#0F5FB5', fontFamily: BL }}>
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

      {/* Outside the footer, not inside it.
          Inside, the footer's own blue filled everything above the curve, so
          the wave had blue on both sides of it and read as a gold squiggle
          drawn across a solid band. Out here the page is above the curve and
          the blue only below, which is what makes it a wave. */}
      <Wave facing="up" fill="#0F5FB5" />

      <footer className="mt-0" style={{ backgroundColor: '#0F5FB5' }}>
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-10 text-white">

          {/* Three columns on desktop, stacked and centred on a phone. The
              single centred stack read as one long ribbon of small text with
              no grouping — links, contact and legal all weighted the same. */}
          <div className="grid gap-10 sm:grid-cols-3 text-center sm:text-left">

            {/* Who this is */}
            <div>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0"
                  style={{ backgroundColor: '#F5C518', color: '#0F5FB5', fontFamily: HL }}>
                  <span aria-hidden className="liliw-tread absolute inset-0" style={{ opacity: 0.45 }} />
                  <span className="relative">L</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold leading-none tracking-[0.14em]" style={{ fontFamily: HL }}>LILIW</h3>
                  <p className="text-white/60 text-[10.5px] mt-1 font-medium tracking-wide" style={{ fontFamily: BL }}>
                    Home of the Tsinelas Festival
                  </p>
                </div>
              </div>

              <p className="text-white/70 text-sm mt-4 leading-relaxed" style={{ fontFamily: BL }}>
                The Footwear Capital of the Philippines — heritage, craftsmanship
                and the colour of the Tsinelas Festival, all in one Laguna town.
              </p>

              {/* One account, so it is named rather than reduced to a lone
                  circle that gives no clue where it goes. */}
              <div className="mt-5 flex justify-center sm:justify-start">
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full text-sm font-semibold text-white transition hover:bg-white/25"
                  style={{ backgroundColor: 'rgba(255,255,255,0.14)', fontFamily: BL }}>
                  <FacebookMark size={17} />
                  Follow Liliw CHATO
                </a>
              </div>
            </div>

            {/* Where to go */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 mb-3.5" style={{ fontFamily: HL }}>
                Explore
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {ALL_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    className="text-white/75 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: BL }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* How to reach the office */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 mb-3.5" style={{ fontFamily: HL }}>
                Tourism Office
              </p>
              <div className="space-y-2.5 text-sm text-white/75" style={{ fontFamily: BL }}>
                <a href="mailto:liliwturismo@gmail.com" className="flex items-center gap-2.5 justify-center sm:justify-start hover:text-white transition-colors">
                  <Mail size={13} className="shrink-0 text-white/40" /> liliwturismo@gmail.com
                </a>
                <p className="flex items-start gap-2.5 justify-center sm:justify-start">
                  <MapPin size={13} className="shrink-0 mt-1 text-white/40" /> Municipal Hall, Liliw, Laguna 4002
                </p>
              </div>
              <p className="text-white/40 text-[11px] mt-4 leading-relaxed" style={{ fontFamily: BL }}>
                Culture, History, Arts and Tourism Office
              </p>
            </div>
          </div>

          {/* Install CTA */}
          {(showAndroid || showIOS || showInstalled) && (
            <div className="flex justify-center mt-10">
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
                  style={{ backgroundColor: '#F5C518', color: '#0F5FB5', fontFamily: BL }}>
                  {installing
                    ? <><span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(15,95,181,0.3)', borderTopColor: '#0F5FB5' }} /> Installing…</>
                    : <><Download size={15} /> Install App</>}
                </motion.button>
              )}
              {showIOS && (
                <motion.button onClick={() => setIosModalOpen(true)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                  style={{ backgroundColor: '#F5C518', color: '#0F5FB5', fontFamily: BL }}>
                  <Smartphone size={15} /> Add to Home Screen
                </motion.button>
              )}
            </div>
          )}

          {/* Legal bar — a full-width rule rather than the short centred dash,
              so the small print reads as a footer line and not as more content. */}
          <div className="mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40"
            style={{ borderTop: '1px solid rgba(255,255,255,0.14)', fontFamily: BL }}>
            <span>&copy; {year} Municipality of Liliw, Laguna. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <Link href="/faq" className="hover:text-white transition-colors">Help &amp; FAQ</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Privacy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
