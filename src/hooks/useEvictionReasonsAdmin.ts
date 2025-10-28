import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  EvictionReason,
  UseEvictionReasonsAdminReturn,
} from '@/types/evictionReasons';
import { toast } from 'sonner';

/**
 * Hook para gerenciar motivos de desocupação (apenas para admins)
 * Inclui operações CRUD completas
 */
export function useEvictionReasonsAdmin(): UseEvictionReasonsAdminReturn {
  const queryClient = useQueryClient();

  // Query para buscar todos os motivos (ativos e inativos)
  const { data, isLoading, error } = useQuery({
    queryKey: ['eviction-reasons', 'admin'],
    queryFn: async (): Promise<EvictionReason[]> => {
      const { data: reasons, error: fetchError } = await supabase
        .from('eviction_reasons')
        .select('*')
        .order('is_active', { ascending: false })
        .order('description', { ascending: true });

      if (fetchError) {
        throw new Error(
          `Erro ao buscar motivos de desocupação: ${fetchError.message}`
        );
      }

      return reasons || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar motivo
  const createMutation = useMutation({
    mutationFn: async (description: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('eviction_reasons')
        .insert({
          description: description.trim(),
          is_active: true,
          created_by: user?.id || null,
        });

      if (insertError) {
        throw new Error(
          `Erro ao criar motivo: ${insertError.message}`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eviction-reasons'] });
      toast.success('Motivo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar motivo: ${error.message}`);
    },
  });

  // Mutation para atualizar motivo
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      description,
      is_active,
    }: {
      id: string;
      description: string;
      is_active: boolean;
    }) => {
      const { error: updateError } = await supabase
        .from('eviction_reasons')
        .update({
          description: description.trim(),
          is_active,
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Erro ao atualizar motivo: ${updateError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eviction-reasons'] });
      toast.success('Motivo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar motivo: ${error.message}`);
    },
  });

  // Mutation para deletar motivo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from('eviction_reasons')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`Erro ao deletar motivo: ${deleteError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eviction-reasons'] });
      toast.success('Motivo deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar motivo: ${error.message}`);
    },
  });

  const createReason = async (description: string) => {
    await createMutation.mutateAsync(description);
  };

  const updateReason = async (
    id: string,
    description: string,
    is_active: boolean
  ) => {
    await updateMutation.mutateAsync({ id, description, is_active });
  };

  const deleteReason = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    reasons: data || [],
    isLoading,
    error: error as Error | null,
    createReason,
    updateReason,
    deleteReason,
  };
}
