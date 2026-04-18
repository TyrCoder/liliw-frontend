'use client';

import { useEffect, useState } from 'react';
import SmartSearchModal from '@/components/SmartSearchModal';

export default function SearchProvider() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      // ESC to close
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  return isSearchOpen ? (
    <SmartSearchModal onClose={() => setIsSearchOpen(false)} />
  ) : null;
}
