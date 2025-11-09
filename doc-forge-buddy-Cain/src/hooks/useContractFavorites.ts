/**
 * Hook para gerenciar favoritos de contratos
 * Usa localStorage inicialmente, pode ser migrado para Supabase depois
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const STORAGE_KEY = 'contract_favorites';

/**
 * Interface para favorito armazenado
 */
interface StoredFavorite {
  contract_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Hook para gerenciar favoritos de contratos
 */
export function useContractFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Carregar favoritos do localStorage
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const favoritesData: StoredFavorite[] = JSON.parse(stored);
        const userFavorites = favoritesData
          .filter((f) => f.user_id === user.id)
          .map((f) => f.contract_id);
        setFavorites(new Set(userFavorites));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Salvar favoritos no localStorage
  const saveFavorites = useCallback(
    (newFavorites: Set<string>) => {
      if (!user?.id) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const allFavorites: StoredFavorite[] = stored ? JSON.parse(stored) : [];

        // Remover favoritos do usuário atual
        const otherUsersFavorites = allFavorites.filter((f) => f.user_id !== user.id);

        // Adicionar favoritos atuais do usuário
        const userFavorites: StoredFavorite[] = Array.from(newFavorites).map((contractId) => ({
          contract_id: contractId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        }));

        const updated = [...otherUsersFavorites, ...userFavorites];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error);
        toast.error('Erro ao salvar favorito');
      }
    },
    [user?.id]
  );

  // Verificar se um contrato é favorito
  const isFavorite = useCallback(
    (contractId: string): boolean => {
      return favorites.has(contractId);
    },
    [favorites]
  );

  // Alternar favorito (adicionar/remover)
  const toggleFavorite = useCallback(
    (contractId: string) => {
      if (!user?.id) {
        toast.error('Você precisa estar logado para favoritar contratos');
        return;
      }

      const newFavorites = new Set(favorites);
      if (newFavorites.has(contractId)) {
        newFavorites.delete(contractId);
        toast.success('Favorito removido');
      } else {
        newFavorites.add(contractId);
        toast.success('Adicionado aos favoritos');
      }

      setFavorites(newFavorites);
      saveFavorites(newFavorites);
    },
    [favorites, user?.id, saveFavorites]
  );

  // Obter todos os favoritos
  const getFavorites = useCallback((): string[] => {
    return Array.from(favorites);
  }, [favorites]);

  // Remover favorito
  const removeFavorite = useCallback(
    (contractId: string) => {
      if (!user?.id) return;

      const newFavorites = new Set(favorites);
      newFavorites.delete(contractId);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      toast.success('Favorito removido');
    },
    [favorites, user?.id, saveFavorites]
  );

  // Adicionar favorito
  const addFavorite = useCallback(
    (contractId: string) => {
      if (!user?.id) {
        toast.error('Você precisa estar logado para favoritar contratos');
        return;
      }

      const newFavorites = new Set(favorites);
      newFavorites.add(contractId);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      toast.success('Adicionado aos favoritos');
    },
    [favorites, user?.id, saveFavorites]
  );

  return {
    favorites: getFavorites(),
    favoritesSet: favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isLoading,
  };
}

