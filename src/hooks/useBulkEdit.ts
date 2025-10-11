import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EntityType, BulkUpdatePayload, BulkUpdateResult } from '@/types/admin';
import { toast } from 'sonner';

/**
 * Hook para gerenciar edições em massa
 */
export const useBulkEdit = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * Selecionar/deselecionar um item
   */
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /**
   * Selecionar todos os itens
   */
  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  /**
   * Limpar seleção
   */
  const clearSelection = () => {
    setSelectedIds([]);
  };

  /**
   * Verificar se um item está selecionado
   */
  const isSelected = (id: string) => {
    return selectedIds.includes(id);
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.length,
  };
};

/**
 * Hook para executar atualização em massa
 */
export const useBulkUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: BulkUpdatePayload
    ): Promise<BulkUpdateResult> => {
      const { table, ids, data } = payload;

      let successCount = 0;
      let failCount = 0;
      const errors: Array<{ id: string; error: string }> = [];

      // Atualizar cada item individualmente para ter controle de erros
      for (const id of ids) {
        try {
          const { error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id);

          if (error) {
            failCount++;
            errors.push({ id, error: error.message });
          } else {
            successCount++;
          }
        } catch (err: any) {
          failCount++;
          errors.push({ id, error: err.message || 'Erro desconhecido' });
        }
      }

      return {
        success: failCount === 0,
        updated: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    onSuccess: (result, variables) => {
      // Invalidar queries relacionadas à entidade atualizada
      const queryKeys: Record<EntityType, string[]> = {
        contracts: ['contracts'],
        prestadores: ['prestadores'],
        vistoria_analises: ['vistoria-analises', 'analises'],
        saved_terms: ['saved-terms', 'documents'],
      };

      const keys = queryKeys[variables.table];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      if (result.success) {
        toast.success(
          `${result.updated} ${result.updated === 1 ? 'item atualizado' : 'itens atualizados'} com sucesso!`
        );
      } else {
        toast.warning(
          `${result.updated} ${result.updated === 1 ? 'item atualizado' : 'itens atualizados'}. ${result.failed} ${result.failed === 1 ? 'falhou' : 'falharam'}.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao executar atualização em massa');
    },
  });
};

/**
 * Hook para deletar múltiplos itens
 */
export const useBulkDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      table,
      ids,
    }: {
      table: EntityType;
      ids: string[];
    }): Promise<BulkUpdateResult> => {
      let successCount = 0;
      let failCount = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const id of ids) {
        try {
          const { error } = await supabase.from(table).delete().eq('id', id);

          if (error) {
            failCount++;
            errors.push({ id, error: error.message });
          } else {
            successCount++;
          }
        } catch (err: any) {
          failCount++;
          errors.push({ id, error: err.message || 'Erro desconhecido' });
        }
      }

      return {
        success: failCount === 0,
        updated: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    onSuccess: (result, variables) => {
      const queryKeys: Record<EntityType, string[]> = {
        contracts: ['contracts'],
        prestadores: ['prestadores'],
        vistoria_analises: ['vistoria-analises', 'analises'],
        saved_terms: ['saved-terms', 'documents'],
      };

      const keys = queryKeys[variables.table];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      if (result.success) {
        toast.success(
          `${result.updated} ${result.updated === 1 ? 'item removido' : 'itens removidos'} com sucesso!`
        );
      } else {
        toast.warning(
          `${result.updated} ${result.updated === 1 ? 'item removido' : 'itens removidos'}. ${result.failed} ${result.failed === 1 ? 'falhou' : 'falharam'}.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao executar remoção em massa');
    },
  });
};
