'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface FavoriteAttraction {
  id: string;
  name: string;
  type: string;
  category?: string;
}

interface FavoritesContextValue {
  favorites: FavoriteAttraction[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (attraction: FavoriteAttraction) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

function storageKey(userId: string) {
  return `liliw-favorites-${userId}`;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteAttraction[]>([]);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    try {
      const raw = localStorage.getItem(storageKey(user.email));
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch {
      setFavorites([]);
    }
  }, [user?.email]);

  const save = (updated: FavoriteAttraction[]) => {
    if (!user) return;
    try { localStorage.setItem(storageKey(user.email), JSON.stringify(updated)); } catch {}
    setFavorites(updated);
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = (attraction: FavoriteAttraction) => {
    if (!user) return;
    save(
      isFavorite(attraction.id)
        ? favorites.filter((f) => f.id !== attraction.id)
        : [...favorites, attraction],
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
