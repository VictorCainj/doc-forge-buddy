import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import {
  ContractOccurrence,
  CreateContractOccurrence,
  mapSupabaseContractOccurrence,
} from '@/types/shared/contract';
import { toSupabaseJson } from '@/types/shared/base';
import { correctTextWithAI } from '@/utils/openai';
import { log } from '@/utils/logger';

const contractOccurrencesKey = (contractId: string) => [
  'contract-occurrences',
  contractId,
];

interface CreateOccurrenceParams {
  content: string;
  aiCorrected?: boolean;
  metadata?: Record<string, unknown> | null;
}

interface UpdateOccurrenceParams extends CreateOccurrenceParams {
  id: string;
}

interface UseContractOccurrencesReturn {
  occurrences: ContractOccurrence[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isImproving: boolean;
  createOccurrence: (params: CreateOccurrenceParams) => Promise<void>;
  updateOccurrence: (params: UpdateOccurrenceParams) => Promise<ContractOccurrence>;
  deleteOccurrence: (id: string) => Promise<void>;
  improveOccurrenceText: (text: string) => Promise<string>;
  refetch: () => Promise<void>;
}

const mapOccurrenceInsertPayload = (
  payload: CreateContractOccurrence,
  userId: string
): Record<string, unknown> => {
  return {
    contract_id: payload.contract_id,
    content: payload.content,
    ai_corrected: payload.ai_corrected ?? false,
    metadata: payload.metadata ? toSupabaseJson(payload.metadata) : null,
    user_id: userId,
  };
};

const mapOccurrenceUpdatePayload = (
  payload: UpdateOccurrenceParams
): Record<string, unknown> => {
  return {
    content: payload.content,
    ai_corrected: payload.aiCorrected ?? false,
    metadata: payload.metadata ? toSupabaseJson(payload.metadata) : null,
  };
};

export const useContractOccurrences = (
  contractId?: string
): UseContractOccurrencesReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError, showSuccess } = useStandardToast();

  const occurrencesQuery = useQuery({
    queryKey: contractId ? contractOccurrencesKey(contractId) : ['contract-occurrences'],
    queryFn: async () => {
      if (!contractId) {
        return [] as ContractOccurrence[];
      }

      const { data, error } = await supabase
        .from('contract_occurrences')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Erro ao carregar ocorrências do contrato', error);
        throw error;
      }

      return (data ?? []).map(mapSupabaseContractOccurrence);
    },
    enabled: Boolean(contractId),
    staleTime: 60 * 1000,
  });

  const occurrences = useMemo(
    () => occurrencesQuery.data ?? [],
    [occurrencesQuery.data]
  );

  const createMutation = useMutation({
    mutationFn: async (params: CreateOccurrenceParams) => {
      if (!contractId) {
        throw new Error('Contrato inválido para registrar ocorrência.');
      }

      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const payload: CreateContractOccurrence = {
        contract_id: contractId,
        content: params.content.trim(),
        ai_corrected: params.aiCorrected,
        metadata: params.metadata ?? null,
      };

      const { data, error } = await supabase
        .from('contract_occurrences')
        .insert(mapOccurrenceInsertPayload(payload, user.id))
        .select('*')
        .single();

      if (error) {
        log.error('Erro ao criar ocorrência de contrato', error);
        throw error;
      }

      return mapSupabaseContractOccurrence(data);
    },
    onSuccess: (newOccurrence) => {
      if (!contractId) {
        return;
      }

      queryClient.setQueryData<ContractOccurrence[]>(
        contractOccurrencesKey(contractId),
        (current) => {
          const existing = current ?? [];
          const withoutDuplicate = existing.filter(
            (occurrence) => occurrence.id !== newOccurrence.id
          );

          return [newOccurrence, ...withoutDuplicate].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      );

      showSuccess('created', {
        title: 'Ocorrência registrada',
        description: 'A ocorrência foi adicionada ao contrato.',
      });
    },
    onError: (error) => {
      log.error('Erro ao registrar ocorrência do contrato', error);
      showError('save', {
        title: 'Não foi possível registrar a ocorrência',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: UpdateOccurrenceParams) => {
      if (!contractId) {
        throw new Error('Contrato inválido para atualizar ocorrência.');
      }

      const { data, error } = await supabase
        .from('contract_occurrences')
        .update(mapOccurrenceUpdatePayload(params))
        .eq('id', params.id)
        .select('*')
        .single();

      if (error) {
        log.error('Erro ao atualizar ocorrência de contrato', error);
        throw error;
      }

      return mapSupabaseContractOccurrence(data);
    },
    onSuccess: (updatedOccurrence) => {
      if (!contractId) {
        return;
      }

      queryClient.setQueryData<ContractOccurrence[]>(
        contractOccurrencesKey(contractId),
        (current) => {
          const existing = current ?? [];
          return existing
            .map((occurrence) =>
              occurrence.id === updatedOccurrence.id ? updatedOccurrence : occurrence
            )
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }
      );

      showSuccess('updated', {
        title: 'Ocorrência atualizada',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      log.error('Erro ao atualizar ocorrência de contrato', error);
      showError('save', {
        title: 'Não foi possível atualizar a ocorrência',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (occurrenceId: string) => {
      const { error } = await supabase
        .from('contract_occurrences')
        .delete()
        .eq('id', occurrenceId);

      if (error) {
        log.error('Erro ao remover ocorrência de contrato', error);
        throw error;
      }

      return occurrenceId;
    },
    onSuccess: (deletedId) => {
      if (!contractId) {
        return;
      }

      queryClient.setQueryData<ContractOccurrence[]>(
        contractOccurrencesKey(contractId),
        (current) => (current ?? []).filter((occurrence) => occurrence.id !== deletedId)
      );

      showSuccess('deleted', {
        title: 'Ocorrência removida',
        description: 'O registro foi excluído do histórico.',
      });
    },
    onError: (error) => {
      log.error('Erro ao remover ocorrência de contrato', error);
      showError('delete', {
        title: 'Não foi possível remover a ocorrência',
      });
    },
  });

  const improveMutation = useMutation({
    mutationFn: async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        throw new Error('Texto da ocorrência não pode estar vazio.');
      }

      return correctTextWithAI(trimmed);
    },
    onError: (error) => {
      log.error('Erro ao melhorar texto da ocorrência', error);
      showError('load', {
        title: 'Não foi possível melhorar o texto',
      });
    },
  });

  const createOccurrence = async (params: CreateOccurrenceParams) => {
    await createMutation.mutateAsync(params);
  };

  const updateOccurrence = async (params: UpdateOccurrenceParams) => {
    return updateMutation.mutateAsync(params);
  };

  const deleteOccurrence = async (occurrenceId: string) => {
    await deleteMutation.mutateAsync(occurrenceId);
  };

  const improveOccurrenceText = async (text: string) => {
    return improveMutation.mutateAsync(text);
  };

  return {
    occurrences,
    isLoading: occurrencesQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isImproving: improveMutation.isPending,
    createOccurrence,
    updateOccurrence,
    deleteOccurrence,
    improveOccurrenceText,
    refetch: occurrencesQuery.refetch,
  };
};
