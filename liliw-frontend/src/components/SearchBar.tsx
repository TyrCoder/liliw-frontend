'use client';

import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  variant?: 'default' | 'compact';
  resultCount?: number;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  variant = 'default',
  resultCount,
}: SearchBarProps) {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  if (variant === 'compact') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative group"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:transition-colors" style={{ color: 'rgb(156, 163, 175)' }} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" style={{ '--tw-ring-color': '#00BFB3' } as any}
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl opacity-0 group-focus-within:opacity-10 blur transition-opacity duration-300" style={{ backgroundImage: 'linear-gradient(to right, #00BFB3, #00CED1)' }} />
        <div className="relative bg-white rounded-xl border-2 border-gray-200 group-focus-within:border-teal-500 transition-colors duration-300" style={{ borderColor: 'currentColor' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#00BFB3')} onBlur={(e) => (e.currentTarget.style.borderColor = 'rgb(229, 231, 235)')}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-teal-500 transition-colors" style={{ color: 'rgb(156, 163, 175)' }} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-14 pr-12 py-4 bg-transparent text-lg text-black focus:outline-none"
          />
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </motion.button>
          )}
        </div>
      </div>
      
      {value && resultCount !== undefined && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 px-1"
        >
          Found {resultCount} result{resultCount !== 1 ? 's' : ''}
        </motion.p>
      )}
    </motion.div>
  );
}
