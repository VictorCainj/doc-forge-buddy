/**
 * Hook para lógica de dados de contratos
 * Centraliza todas as operações de dados relacionadas a contratos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

export interface UseContractDataReturn {
  loading: boolean;
  error: string | null;
  fetchContractById: (id: string) => Promise<Contract | null>;
  fetchContractsByType: (documentType: string) => Promise<Contract[]>;
  deleteContract: (id: string) => Promise<void>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  clearError: () => void;
}

export const useContractData = (): UseContractDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Buscar contrato por ID
  const fetchContractById = useCallback(async (id: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) throw supabaseError;
      if (!data) return null;

      // ✅ Processar dados do contrato
      const processedContract: Contract = {
        ...data,
        form_data: typeof data.form_data === 'string' 
          ? JSON.parse(data.form_data) 
          : data.form_data || {},
      };

      return processedContract;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contrato';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar contrato:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Buscar contratos por tipo
  const fetchContractsByType = useCallback(async (documentType: string): Promise<Contract[]> => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('saved_terms').select('*');
      
      if (documentType !== 'all') {
        query = query.eq('document_type', documentType);
      }
      
      const { data, error: supabaseError } = await query
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      // ✅ Processar dados dos contratos
      const processedContracts: Contract[] = (data || []).map(contract => ({
        ...contract,
        form_data: typeof contract.form_data === 'string' 
          ? JSON.parse(contract.form_data) 
          : contract.form_data || {},
      }));

      return processedContracts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contratos';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar contratos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Deletar contrato
  const deleteContract = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar contrato';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Atualizar contrato
  const updateContract = useCallback(async (id: string, data: Partial<Contract>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('saved_terms')
        .update(data)
        .eq('id', id);

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar contrato';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchContractById,
    fetchContractsByType,
    deleteContract,
    updateContract,
    clearError,
  };
};
