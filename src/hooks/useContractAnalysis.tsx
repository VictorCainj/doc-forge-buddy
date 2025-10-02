// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  useCompleteContractData,
  CompleteContractData,
} from './useCompleteContractData';

export interface Contract {
  id: string;
  numero_contrato: string;
  nome_locatario: string;
  endereco_imovel: string;
  nome_proprietario: string;
  email_proprietario: string;
  data_comunicacao: string;
  data_inicio_desocupacao: string;
  data_termino_desocupacao: string;
  prazo_dias: string;
  created_at: string;
  updated_at: string;
}

interface UseContractAnalysisReturn {
  contracts: Contract[];
  completeContracts: CompleteContractData[];
  isLoading: boolean;
  error: string | null;
  getAllContracts: () => Promise<Contract[]>;
  getContractById: (id: string) => Promise<Contract | null>;
  searchContracts: (query: string) => Promise<Contract[]>;
  refreshContracts: () => Promise<void>;
  // Métodos para dados completos
  getAllCompleteContracts: () => Promise<CompleteContractData[]>;
  getCompleteContractById: (id: string) => Promise<CompleteContractData | null>;
  searchCompleteContracts: (query: string) => Promise<CompleteContractData[]>;
  refreshCompleteContracts: () => Promise<void>;
}

export const useContractAnalysis = (): UseContractAnalysisReturn => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook para dados completos
  const {
    contracts: completeContracts,
    isLoading: isLoadingComplete,
    error: errorComplete,
    getAllCompleteContracts,
    getCompleteContractById,
    searchCompleteContracts,
    refreshCompleteContracts,
  } = useCompleteContractData();

  const getAllContracts = async (): Promise<Contract[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContracts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar contratos';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getContractById = async (id: string): Promise<Contract | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar contrato';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const searchContracts = async (query: string): Promise<Contract[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(
          `numero_contrato.ilike.%${query}%,nome_locatario.ilike.%${query}%,nome_proprietario.ilike.%${query}%,endereco_imovel.ilike.%${query}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar contratos';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContracts = async (): Promise<void> => {
    await getAllContracts();
  };

  // Carregar contratos automaticamente ao inicializar
  useEffect(() => {
    getAllContracts();
  }, []);

  return {
    contracts,
    completeContracts,
    isLoading: isLoading || isLoadingComplete,
    error: error || errorComplete,
    getAllContracts,
    getContractById,
    searchContracts,
    refreshContracts,
    // Métodos para dados completos
    getAllCompleteContracts,
    getCompleteContractById,
    searchCompleteContracts,
    refreshCompleteContracts,
  };
};
