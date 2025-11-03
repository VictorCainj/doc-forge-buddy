// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PromptHistoryItem } from '../types/prompt';
import { log } from '@/utils/logger';
import { toast } from 'sonner';

export const usePromptHistory = () => {
  const queryClient = useQueryClient();

  // Buscar histórico do usuário com cache otimizado
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['prompt-history'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('prompt_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        log.error('Erro ao buscar histórico:', error);
        throw error;
      }

      return (data || []) as PromptHistoryItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - cache mais agressivo para histórico
    gcTime: 10 * 60 * 1000, // 10 minutos - manter em cache por mais tempo
    refetchOnWindowFocus: false, // Não refetch ao focar janela (dados não mudam frequentemente)
    refetchOnMount: false, // Não refetch se dados ainda estão frescos
  });

  // Toggle favorito
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      id,
      isFavorite,
    }: {
      id: string;
      isFavorite: boolean;
    }) => {
      const { error } = await supabase
        .from('prompt_history')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-history'] });
      toast.success('Favorito atualizado');
    },
    onError: (error) => {
      log.error('Erro ao atualizar favorito:', error);
      toast.error('Erro ao atualizar favorito');
    },
  });

  // Deletar item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompt_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-history'] });
      toast.success('Item removido do histórico');
    },
    onError: (error) => {
      log.error('Erro ao deletar item:', error);
      toast.error('Erro ao deletar item');
    },
  });

  // Duplicar item (criar novo no histórico)
  const duplicateMutation = useMutation({
    mutationFn: async (item: PromptHistoryItem) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('prompt_history').insert({
        user_id: user.id,
        original_input: item.original_input,
        enhanced_prompt: item.enhanced_prompt,
        context: item.context,
        metadata: item.metadata,
        is_favorite: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-history'] });
      toast.success('Item duplicado');
    },
    onError: (error) => {
      log.error('Erro ao duplicar item:', error);
      toast.error('Erro ao duplicar item');
    },
  });

  return {
    history,
    isLoading,
    error,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    duplicateItem: duplicateMutation.mutateAsync,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
};

