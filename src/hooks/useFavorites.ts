import { useState, useEffect, useCallback } from "react";

export interface FavoriteItem {
  id: string;
  type: "document" | "process" | "dispatch" | "page";
  title: string;
  href: string;
  addedAt: number;
}

const FAVORITES_KEY = "minagrif_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Sync with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(FAVORITES_KEY);
      setFavorites(stored ? JSON.parse(stored) : []);
    };

    window.addEventListener("favorites-updated", handleStorageChange);
    return () => window.removeEventListener("favorites-updated", handleStorageChange);
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">) => {
    const updated = [...favorites, { ...item, addedAt: Date.now() }];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("favorites-updated"));
  }, [favorites]);

  const removeFavorite = useCallback((id: string) => {
    const updated = favorites.filter((item) => item.id !== id);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("favorites-updated"));
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">) => {
    if (favorites.some((f) => f.id === item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((item) => item.id === id);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
