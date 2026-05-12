'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, token, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteAttraction[]>([]);

  const loadFavorites = useCallback(async () => {
    if (!token) { setFavorites([]); return; }
    try {
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites((data.favorites || []).map((row: any) => ({
          id: row.attraction_id,
          name: row.name,
          type: row.type,
          category: row.category,
        })));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!authLoading) loadFavorites();
  }, [authLoading, loadFavorites]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = async (attraction: FavoriteAttraction) => {
    if (!user || !token) return;
    const wasFavorite = isFavorite(attraction.id);

    // Optimistic update
    setFavorites(prev =>
      wasFavorite
        ? prev.filter(f => f.id !== attraction.id)
        : [...prev, attraction]
    );

    try {
      if (wasFavorite) {
        await fetch(`/api/favorites?attraction_id=${encodeURIComponent(attraction.id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            attraction_id: attraction.id,
            name: attraction.name,
            type: attraction.type,
            category: attraction.category,
          }),
        });
      }
    } catch {
      // Revert on failure
      setFavorites(prev =>
        wasFavorite
          ? [...prev, attraction]
          : prev.filter(f => f.id !== attraction.id)
      );
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
