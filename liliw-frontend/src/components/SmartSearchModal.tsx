'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAlgolia, SearchResult } from '@/lib/algolia';

interface SmartSearchProps {
  onClose?: () => void;
}

export default function SmartSearchModal({ onClose }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        const searchResults = await searchAlgolia(query);
        setResults(searchResults);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'heritage':
        return 'bg-blue-100 text-blue-700';
      case 'spot':
        return 'bg-green-100 text-green-700';
      case 'faq':
        return 'bg-purple-100 text-purple-700';
      case 'event':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Header */}
            <div
              className="p-4 flex items-center gap-3 border-b"
              style={{ borderBottomColor: '#00BFB3' }}
            >
              <Search size={24} style={{ color: '#00BFB3' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search attractions, FAQs, events, itineraries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-lg"
              />
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block"
                  >
                    <Zap size={24} style={{ color: '#00BFB3' }} />
                  </motion.div>
                  <p className="text-gray-500 mt-2">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-4 space-y-2">
                  {results.map((result, idx) => (
                    <Link
                      key={`${result.objectID}-${idx}`}
                      href={result.url || '/'}
                      onClick={handleClose}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 rounded-lg border hover:shadow-md transition cursor-pointer"
                        style={{ borderColor: '#00BFB3' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">
                              {result.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(result.type)}`}>
                                {result.type}
                              </span>
                              {result.location && (
                                <span className="text-xs text-gray-500">
                                  📍 {result.location}
                                </span>
                              )}
                              {result.rating && (
                                <span className="text-xs text-yellow-600">
                                  ⭐ {result.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : query.length > 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-2">Try searching for attractions or keywords</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>Type at least 3 characters to search</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="p-3 text-center text-xs text-gray-500 border-t"
              style={{ borderTopColor: '#e5e7eb' }}
            >
              Press <kbd className="bg-gray-100 px-2 py-1 rounded">ESC</kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
