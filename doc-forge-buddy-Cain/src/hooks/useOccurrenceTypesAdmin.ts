import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  OccurrenceType,
  UseOccurrenceTypesAdminReturn,
} from '@/types/business/occurrenceTypes';
import { toast } from 'sonner';

/**
 * Hook para gerenciar tipos de ocorrência (apenas para admins)
 * Inclui operações CRUD completas
 */
export function useOccurrenceTypesAdmin(): UseOccurrenceTypesAdminReturn {
  const queryClient = useQueryClient();

  // Query para buscar todos os tipos (ativos e inativos)
  const { data, isLoading, error } = useQuery({
    queryKey: ['occurrence-types', 'admin'],
    queryFn: async (): Promise<OccurrenceType[]> => {
      const { data: types, error: fetchError } = await supabase
        .from('occurrence_types')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name', { ascending: true });

      if (fetchError) {
        throw new Error(
          `Erro ao buscar tipos de ocorrência: ${fetchError.message}`
        );
      }

      return types || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar tipo
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('occurrence_types')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          is_active: true,
          created_by: user?.id || null,
        });

      if (insertError) {
        throw new Error(
          `Erro ao criar tipo de ocorrência: ${insertError.message}`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrence-types'] });
      toast.success('Tipo de ocorrência criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tipo de ocorrência: ${error.message}`);
    },
  });

  // Mutation para atualizar tipo
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      is_active,
    }: {
      id: string;
      name: string;
      description: string | null;
      is_active: boolean;
    }) => {
      const { error: updateError } = await supabase
        .from('occurrence_types')
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          is_active,
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(
          `Erro ao atualizar tipo de ocorrência: ${updateError.message}`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrence-types'] });
      toast.success('Tipo de ocorrência atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tipo de ocorrência: ${error.message}`);
    },
  });

  // Mutation para deletar tipo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from('occurrence_types')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(
          `Erro ao deletar tipo de ocorrência: ${deleteError.message}`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrence-types'] });
      toast.success('Tipo de ocorrência deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar tipo de ocorrência: ${error.message}`);
    },
  });

  const createType = async (name: string, description?: string) => {
    await createMutation.mutateAsync({ name, description });
  };

  const updateType = async (
    id: string,
    name: string,
    description: string | null,
    is_active: boolean
  ) => {
    await updateMutation.mutateAsync({ id, name, description, is_active });
  };

  const deleteType = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    types: data || [],
    isLoading,
    error: error as Error | null,
    createType,
    updateType,
    deleteType,
  };
}

