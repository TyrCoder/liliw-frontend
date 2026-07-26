'use client';

import { Share2, MessageCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { showAchievementToasts } from '@/lib/achievementToast';

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
  const pageUrl = url || typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: MessageCircle,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Twitter',
      icon: Zap,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      name: 'WhatsApp',
      icon: () => <span className="text-xs font-bold">WA</span>,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600">Share:</span>
      <div className="flex gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name}
            onClick={recordShare}
            className={`p-2.5 rounded-lg text-white transition transform hover:scale-110 ${link.color}`}
          >
            <link.icon size={18} />
          </a>
        ))}
        <motion.button
          onClick={copyLink}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-lg text-white transition"
          style={{ backgroundColor: copied ? '#1565C0' : '#6b7280' }}
          title="Copy link"
        >
          {copied ? <Zap size={18} /> : <Share2 size={18} />}
        </motion.button>
      </div>
      {copied && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="text-sm text-green-600 font-medium"
        >
          Link copied!
        </motion.span>
      )}
    </div>
  );
}
