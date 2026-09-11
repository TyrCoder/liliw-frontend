'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { browserSiteUrl } from '@/lib/siteUrl';
import { Download, Copy, QrCode, X } from 'lucide-react';

/**
 * Share the whole site, not one place in it.
 *
 * Every existing QR and share component here points at one attraction —
 * QRCodeGenerator and QRPoster build a check-in link, SocialShare on an
 * attraction page shares that attraction. None of them share the site
 * itself, so there was no answer to "how do people who aren't already here
 * find this" short of typing the address out by hand.
 *
 * Deliberately plain rather than a styled, printable poster like QRPoster:
 * that component's copy ("scan to check in, earn points") is about visiting
 * one place in person, which is the wrong message for a link meant to travel
 * ahead of anyone arriving — on a slide, a social post, a flyer that isn't
 * standing at an entrance.
 */
/** lucide-react carries no brand icons; drawn as a path instead of standing
 *  in with a generic icon that would read as the wrong brand entirely. */
function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export default function ShareSite() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = browserSiteUrl();
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return; // clipboard access can be refused; claiming success it did not have is worse than saying nothing
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = async () => {
    try {
      const res = await fetch(qrImg);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = 'liliw-tourism-qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      // Same-tab fallback: opening the image directly still lets a visitor
      // save it by hand even if the fetch-and-blob download was refused.
      window.open(qrImg, '_blank', 'noopener');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition hover:bg-white/10"
        style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)' }}
      >
        <QrCode className="w-3.5 h-3.5" /> Share this site
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-bold text-lg mb-1" style={{ color: '#0B3D91' }}>
                Share Liliw Tourism
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Scan the code or copy the link below to send someone straight here.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImg} alt="QR code linking to the Liliw Tourism homepage" className="w-44 h-44" />
              </div>

              <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 break-all">
                {url}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={downloadQr}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  <Download className="w-4 h-4" /> Save QR
                </button>
              </div>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: '#1877F2' }}
              >
                <FacebookMark /> Share on Facebook
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
