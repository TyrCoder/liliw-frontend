'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

interface AnnouncementBarProps {
  defaultOpen?: boolean;
}

export default function AnnouncementBar({ defaultOpen = true }: AnnouncementBarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm md:text-base leading-tight">
                  🎉 Welcome to Liliw Tourism! Check out our upcoming Cultural Heritage Week starting next month.
                </p>
                <p className="text-xs text-white/90 mt-0.5 sm:mt-1 leading-tight hidden sm:block">
                  Discover authentic traditions, local experiences, and scenic wonders.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all"
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
