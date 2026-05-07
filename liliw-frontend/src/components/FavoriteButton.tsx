'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';

interface Props {
  attractionId: string;
  attractionName: string;
  attractionType: string;
  attractionCategory?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({
  attractionId, attractionName, attractionType, attractionCategory, className, size = 'md',
}: Props) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!user) return null;

  const faved = isFavorite(attractionId);
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padCls  = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      animate={{ scale: faved ? [1, 1.3, 1] : 1 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite({ id: attractionId, name: attractionName, type: attractionType, category: attractionCategory });
      }}
      className={`${padCls} rounded-full transition-all ${
        faved
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
          : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white shadow'
      } ${className ?? ''}`}
      title={faved ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Heart className={`${iconCls} ${faved ? 'fill-current' : ''}`} />
    </motion.button>
  );
}
