import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompleteContractData {
  id: string;
  title: string;
  content: string;
  form_data: Record<string, unknown>;
  document_type: string;
  created_at: string;
  updated_at: string;
}

interface UseCompleteContractDataReturn {
  contracts: CompleteContractData[];
  isLoading: boolean;
  error: string | null;
  getAllCompleteContracts: () => Promise<CompleteContractData[]>;
  getCompleteContractById: (id: string) => Promise<CompleteContractData | null>;
  searchCompleteContracts: (query: string) => Promise<CompleteContractData[]>;
  refreshCompleteContracts: () => Promise<void>;
}

export const useCompleteContractData = (): UseCompleteContractDataReturn => {
  const [contracts, setContracts] = useState<CompleteContractData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllCompleteContracts = async (): Promise<CompleteContractData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContracts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao buscar contratos completos';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCompleteContractById = async (
    id: string
  ): Promise<CompleteContractData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .eq('document_type', 'contrato')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar contrato completo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const searchCompleteContracts = async (
    query: string
  ): Promise<CompleteContractData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .or(`title.ilike.%${query}%,form_data::text.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao buscar contratos completos';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCompleteContracts = async (): Promise<void> => {
    await getAllCompleteContracts();
  };

  // Carregar contratos automaticamente ao inicializar
  useEffect(() => {
    getAllCompleteContracts();
  }, []);

  return {
    contracts,
    isLoading,
    error,
    getAllCompleteContracts,
    getCompleteContractById,
    searchCompleteContracts,
    refreshCompleteContracts,
  };
};
