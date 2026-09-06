'use client';

import { Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { showAchievementToasts } from '@/lib/achievementToast';

/**
 * Brand marks, drawn rather than borrowed.
 *
 * lucide-react dropped its brand icons, and the gap had been filled with
 * whatever looked vaguely close: Facebook was a speech bubble, Twitter was a
 * lightning bolt, and WhatsApp was the literal text "WA". Nobody recognises a
 * share button by its colour alone, so all three read as unlabelled squares.
 *
 * These are the official marks as paths, which is the only way to get them
 * right without another dependency.
 */
const Mark = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]" aria-hidden>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px]" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.79 9.79 0 0 1-1.5-5.22c0-5.4 4.4-9.8 9.82-9.8 2.62 0 5.08 1.03 6.93 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.4-4.4 9.81-9.8 9.81ZM20.52 3.45A11.72 11.72 0 0 0 12.05 0C5.6 0 .35 5.25.34 11.7c0 2.06.54 4.08 1.57 5.86L.24 24l6.58-1.73a11.7 11.7 0 0 0 5.22 1.24h.01c6.45 0 11.7-5.25 11.7-11.7a11.63 11.63 0 0 0-3.43-8.36Z" />
    </svg>
  ),
};

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
  /** When set, sharing this attraction awards points (once per attraction). */
  attractionId?: string;
}

export default function SocialShare({ title, description, url, attractionId }: SocialShareProps) {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);

  // Facebook gives no "share completed" callback, so this fires when the share
  // window opens. Repeat clicks on the same attraction are deduped server-side.
  const recordShare = () => {
    if (!attractionId || !token) return;
    fetch('/api/social/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ attractionId, attractionName: title }),
    })
      .then(r => r.json())
      .then(d => showAchievementToasts(d.unlockedAchievements))
      .catch(() => {});
  };

  /*
   * `url || typeof window !== 'undefined' ? window.location.href : ''` binds as
   * `(url || (typeof window !== 'undefined')) ? …`, so the branch was true
   * whenever there was a browser and the url prop was never once used — every
   * caller that passed an explicit link got the address bar instead. It also
   * meant reading window on the server if a url was ever passed during SSR.
   */
  const pageUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(pageUrl);

  /*
   * The caller has always passed a description and the component has always
   * dropped it, so every share went out as a bare name. One line of context
   * is the difference between "Pho HoaHong" and knowing why it was sent.
   * Trimmed at a word boundary to leave room for the link inside a tweet.
   */
  const blurb = (description ?? '').replace(/\s+/g, ' ').trim();
  const shareText = blurb
    ? `${title} — ${blurb.length > 120 ? `${blurb.slice(0, 120).replace(/\s\S*$/, '')}…` : blurb}`
    : title;
  const encodedTitle = encodeURIComponent(shareText);

  const shareLinks = [
    {
      name: 'Facebook',
      mark: Mark.facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: '#1877F2',
    },
    {
      name: 'X',
      mark: Mark.x,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      bg: '#000000',
    },
    {
      name: 'WhatsApp',
      mark: Mark.whatsapp,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      bg: '#25D366',
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      // Clipboard access can be refused outright — over plain http, or in a
      // browser that gates it behind a permission. Falling through to the
      // copied state would claim something that did not happen.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-gray-500">Share:</span>

      <div className="flex items-center gap-2">
        {shareLinks.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${link.name}`}
            aria-label={`Share on ${link.name}`}
            onClick={recordShare}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm
                       transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: link.bg }}
          >
            {link.mark}
          </a>
        ))}

        {/* Copy sits apart: the three above hand the page to somebody else,
            this one hands it back to you. Outlined rather than filled, so the
            row reads as three brands and an action. */}
        <motion.button
          type="button"
          onClick={copyLink}
          whileTap={{ scale: 0.94 }}
          title={copied ? 'Link copied' : 'Copy link'}
          aria-label={copied ? 'Link copied' : 'Copy link'}
          className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-200
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={copied
            ? { backgroundColor: '#16A34A', borderColor: '#16A34A', color: '#fff' }
            : { backgroundColor: '#fff', borderColor: '#E2E8F0', color: '#475569' }}
        >
          {copied ? <Check className="w-[18px] h-[18px]" /> : <Link2 className="w-[18px] h-[18px]" />}
        </motion.button>
      </div>

      {copied && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-semibold"
          style={{ color: '#16A34A' }}
        >
          Link copied
        </motion.span>
      )}
    </div>
  );
}
