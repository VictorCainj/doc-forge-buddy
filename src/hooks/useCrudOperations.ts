/**
 * Hook simplificado para operações CRUD
 * Elimina duplicação de código para operações de banco de dados
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStandardToast } from '@/utils/toastHelpers';
import { useCrudLoadingStates } from './useLoadingStates';
import { log } from '@/utils/logger';
import { 
  CreateContractData, 
  UpdateContractData, 
  Contract 
} from '@/types/contract';
import { OperationCallbacks, CrudOperation } from '@/types/common';

export interface CrudOptions extends OperationCallbacks<Contract> {
  showToasts?: boolean;
  logErrors?: boolean;
}

/**
 * Hook para operações CRUD com contratos (saved_terms)
 */
export const useContractOperations = (options: CrudOptions = {}) => {
  const {
    onSuccess,
    onError,
    showToasts = true,
    logErrors = true,
  } = options;

  const {
    showSaveSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showLoadError,
    showSaveError,
    showError,
  } = useStandardToast();

  const {
    isCreating,
    isReading,
    isUpdating,
    isDeleting,
    isAnyLoading,
    startCreating,
    stopCreating,
    startReading,
    stopReading,
    startUpdating,
    stopUpdating,
    startDeleting,
    stopDeleting,
  } = useCrudLoadingStates();

  // Criar novo contrato
  const create = useCallback(async (data: CreateContractData): Promise<Contract | null> => {
    startCreating();
    try {
      const { data: result, error } = await supabase
        .from('saved_terms')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      if (showToasts) {
        showSaveSuccess();
      }
      
      const contract = result as Contract;
      onSuccess?.('create', contract);
      return contract;
    } catch (error) {
      const err = error as Error;
      if (logErrors) {
        log.error('Erro ao criar contrato:', err);
      }
      
      if (showToasts) {
        showSaveError();
      }
      
      onError?.('create', err);
      return null;
    } finally {
      stopCreating();
    }
  }, [showToasts, onSuccess, onError, logErrors, startCreating, stopCreating, showSaveSuccess, showSaveError]);

  // Ler contrato por ID
  const read = useCallback(async (id: string): Promise<Contract | null> => {
    startReading();
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const contract = data as Contract;
      onSuccess?.('read', contract);
      return contract;
    } catch (error) {
      const err = error as Error;
      if (logErrors) {
        log.error(`Erro ao ler contrato ${id}:`, err);
      }
      
      if (showToasts) {
        showLoadError();
      }
      
      onError?.('read', err);
      return null;
    } finally {
      stopReading();
    }
  }, [showToasts, onSuccess, onError, logErrors, startReading, stopReading, showLoadError]);

  // Atualizar contrato
  const update = useCallback(async (id: string, data: UpdateContractData): Promise<Contract | null> => {
    startUpdating();
    try {
      const { data: result, error } = await supabase
        .from('saved_terms')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (showToasts) {
        showUpdateSuccess();
      }
      
      const contract = result as Contract;
      onSuccess?.('update', contract);
      return contract;
    } catch (error) {
      const err = error as Error;
      if (logErrors) {
        log.error(`Erro ao atualizar contrato ${id}:`, err);
      }
      
      if (showToasts) {
        showError('save');
      }
      
      onError?.('update', err);
      return null;
    } finally {
      stopUpdating();
    }
  }, [showToasts, onSuccess, onError, logErrors, startUpdating, stopUpdating, showUpdateSuccess, showError]);

  // Remover contrato
  const remove = useCallback(async (id: string): Promise<boolean> => {
    startDeleting();
    try {
      const { error } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (showToasts) {
        showDeleteSuccess();
      }
      
      onSuccess?.('delete', undefined);
      return true;
    } catch (error) {
      const err = error as Error;
      if (logErrors) {
        log.error(`Erro ao remover contrato ${id}:`, err);
      }
      
      if (showToasts) {
        showError('delete');
      }
      
      onError?.('delete', err);
      return false;
    } finally {
      stopDeleting();
    }
  }, [showToasts, onSuccess, onError, logErrors, startDeleting, stopDeleting, showDeleteSuccess, showError]);

  return {
    create,
    read,
    update,
    remove,
    isCreating,
    isReading,
    isUpdating,
    isDeleting,
    isAnyLoading,
  };
};
