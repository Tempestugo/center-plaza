import React, { createContext, useContext, useState, useEffect } from 'react';

interface Favorite {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  userId: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  addToFavorites: (accommodation: Omit<Favorite, 'userId'>) => void;
  removeFromFavorites: (accommodationId: string) => void;
  isFavorite: (accommodationId: string) => boolean;
  getUserFavorites: (userId: string) => Favorite[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Carregar favoritos do localStorage na inicialização
  useEffect(() => {
    const savedFavorites = localStorage.getItem('centerplaza_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        localStorage.removeItem('centerplaza_favorites');
      }
    }
  }, []);

  // Salvar favoritos no localStorage sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem('centerplaza_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (accommodation: Omit<Favorite, 'userId'>) => {
    const currentUser = JSON.parse(localStorage.getItem('centerplaza_user') || '{}');
    if (!currentUser.id) return;

    const newFavorite: Favorite = {
      ...accommodation,
      userId: currentUser.id
    };

    setFavorites(prev => {
      // Verificar se já existe
      const exists = prev.some(fav => fav.id === accommodation.id && fav.userId === currentUser.id);
      if (exists) return prev;
      
      return [...prev, newFavorite];
    });
  };

  const removeFromFavorites = (accommodationId: string) => {
    const currentUser = JSON.parse(localStorage.getItem('centerplaza_user') || '{}');
    if (!currentUser.id) return;

    setFavorites(prev => 
      prev.filter(fav => !(fav.id === accommodationId && fav.userId === currentUser.id))
    );
  };

  const isFavorite = (accommodationId: string) => {
    const currentUser = JSON.parse(localStorage.getItem('centerplaza_user') || '{}');
    if (!currentUser.id) return false;

    return favorites.some(fav => fav.id === accommodationId && fav.userId === currentUser.id);
  };

  const getUserFavorites = (userId: string) => {
    return favorites.filter(fav => fav.userId === userId);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getUserFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};