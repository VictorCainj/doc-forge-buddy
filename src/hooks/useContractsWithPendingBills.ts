import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateContractsList, type Contract } from '@/utils/dataValidator';
import { dbLogger } from '@/utils/logger';
import { toast } from 'sonner';

interface UseContractsWithPendingBillsOptions {
  enabled?: boolean;
}

interface UseContractsWithPendingBillsReturn {
  data: Contract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar contratos que possuem pelo menos uma conta de consumo pendente
 *
 * Usa INNER JOIN entre saved_terms e contract_bills para encontrar contratos
 * onde EXISTS pelo menos uma conta com delivered = false
 *
 * @param options.enabled - Se false, não executa a query
 */
export const useContractsWithPendingBills = (
  options: UseContractsWithPendingBillsOptions = {}
): UseContractsWithPendingBillsReturn => {
  const { enabled = true } = options;

  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca contratos com contas pendentes
   */
  const fetchPendingContracts = useCallback(async () => {
    if (!enabled) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query que retorna contratos DISTINTOS que possuem pelo menos uma conta não entregue
      // Usa INNER JOIN para garantir que só retorna contratos que têm bills pendentes
      const { data: rawData, error: queryError } = await supabase
        .from('saved_terms')
        .select(
          `
          id,
          title,
          document_type,
          form_data,
          created_at,
          updated_at,
          contract_bills!inner (
            id,
            bill_type,
            delivered
          )
        `
        )
        .eq('document_type', 'contrato')
        .eq('contract_bills.delivered', false)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // Remover duplicatas (um contrato pode ter múltiplas bills pendentes)
      // e filtrar para garantir estrutura correta
      const uniqueContracts = rawData
        ? Array.from(
            new Map(rawData.map((contract) => [contract.id, contract])).values()
          )
        : [];

      // Validar estrutura dos contratos
      const validatedData = validateContractsList(uniqueContracts);

      dbLogger.debug(`Contratos com contas pendentes: ${validatedData.length}`);
      setData(validatedData);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      dbLogger.error('Erro ao buscar contratos com contas pendentes:', err);
      setError(errorMessage);
      toast.error('Erro ao carregar contratos com pendências');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  /**
   * Função para recarregar os dados
   */
  const refetch = useCallback(async () => {
    await fetchPendingContracts();
  }, [fetchPendingContracts]);

  // Carregar dados quando enabled mudar
  useEffect(() => {
    if (enabled) {
      fetchPendingContracts();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [enabled, fetchPendingContracts]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
