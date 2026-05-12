'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

interface AnnouncementBarProps {
  defaultOpen?: boolean;
}

const DEFAULT_TEXT = 'Welcome to Liliw Tourism! Discover authentic traditions, local experiences, and scenic wonders.';

export default function AnnouncementBar({ defaultOpen = true }: AnnouncementBarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [subtext, setSubtext] = useState('');

  useEffect(() => {
    fetch('/api/strapi/news-events?limit=1')
      .then(r => r.json())
      .then(combined => {
        const item = combined?.news?.data?.[0];
        if (item) {
          const a = item.attributes || item;
          if (a.title) setText(a.title);
          if (a.summary || a.excerpt) setSubtext(a.summary || a.excerpt);
        }
      }).catch(() => {});
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm md:text-base leading-tight">{text}</p>
                {subtext && (
                  <p className="text-xs text-white/90 mt-0.5 sm:mt-1 leading-tight hidden sm:block">{subtext}</p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="shrink-0 p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all"
              aria-label="Close announcement"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
