import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BillStatus } from '@/types/contract';
import { log } from '@/utils/logger';

interface UseContractBillsSyncProps {
  contractId: string;
}

interface UseContractBillsSyncReturn {
  billStatus: BillStatus;
  isLoading: boolean;
  refreshBillStatus: () => Promise<void>;
}

/**
 * Hook para sincronizar status das contas de consumo do banco de dados
 * - Carrega status das bills de um contrato específico
 * - Usado para sincronizar dados entre páginas
 * - Fonte única de verdade para status das contas
 */
export function useContractBillsSync({
  contractId,
}: UseContractBillsSyncProps): UseContractBillsSyncReturn {
  const [billStatus, setBillStatus] = useState<BillStatus>({
    energia: false,
    agua: false,
    condominio: false,
    gas: false,
    notificacao_rescisao: false,
    entrega_chaves: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadBillStatus = async () => {
    if (!contractId) {
      setIsLoading(false);
      return;
    }

    try {
      // Primeiro, buscar o ID real do contrato na tabela saved_terms
      // Usar ilike para busca mais flexível e evitar problemas com caracteres especiais
      const { data: contractData, error: contractError } = await supabase
        .from('saved_terms')
        .select('id')
        .eq('document_type', 'contrato')
        .ilike('form_data->>numeroContrato', contractId)
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro quando não há resultados

      if (contractError) {
        log.error('Erro ao buscar contrato:', contractError);
        setIsLoading(false);
        return;
      }

      if (!contractData?.id) {
        log.warn('Contrato não encontrado:', contractId);
        setIsLoading(false);
        return;
      }

      // Agora buscar as bills usando o ID correto (UUID)
      const { data, error } = await supabase
        .from('contract_bills')
        .select('bill_type, delivered')
        .eq('contract_id', contractData.id);

      if (error) {
        console.error('Erro ao carregar status das bills:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const status: BillStatus = {
          energia: false,
          agua: false,
          condominio: false,
          gas: false,
          notificacao_rescisao: false,
          entrega_chaves: false,
        };

        data.forEach((bill) => {
          if (bill.bill_type in status) {
            status[bill.bill_type] = bill.delivered;
          }
        });

        setBillStatus(status);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillStatus();
  }, [contractId]);

  const refreshBillStatus = async () => {
    setIsLoading(true);
    await loadBillStatus();
  };

  return {
    billStatus,
    isLoading,
    refreshBillStatus,
  };
}
