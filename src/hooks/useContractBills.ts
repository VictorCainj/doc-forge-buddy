import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ContractBill,
  BillType,
  BillStatus,
  ContractFormData,
} from '@/types/contract';

interface UseContractBillsProps {
  contractId: string;
  formData: ContractFormData;
}

interface UseContractBillsReturn {
  bills: ContractBill[];
  billStatus: BillStatus;
  isLoading: boolean;
  toggleBillDelivery: (billType: BillType) => Promise<void>;
  refreshBills: () => Promise<void>;
}

/**
 * Hook para gerenciar as contas de consumo de um contrato
 * - Carrega bills existentes do Supabase
 * - Cria bills automaticamente com base no form_data
 * - Permite alternar status de entrega
 */
export function useContractBills({
  contractId,
  formData,
}: UseContractBillsProps): UseContractBillsReturn {
  const [bills, setBills] = useState<ContractBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Determina quais contas devem existir para este contrato
   */
  const getRequiredBillTypes = useCallback((): BillType[] => {
    const required: BillType[] = ['energia']; // Energia sempre é obrigatória

    // Água: se solicitarAgua === 'sim' no cadastro
    if (formData.solicitarAgua?.toLowerCase() === 'sim') {
      required.push('agua');
    }

    // Condomínio: se solicitarCondominio === 'sim'
    if (formData.solicitarCondominio?.toLowerCase() === 'sim') {
      required.push('condominio');
    }

    // Gás: se solicitarGas === 'sim'
    if (formData.solicitarGas?.toLowerCase() === 'sim') {
      required.push('gas');
    }

    return required;
  }, [formData]);

  /**
   * Carrega as bills do contrato do Supabase
   */
  const loadBills = useCallback(async () => {
    if (!contractId) return;

    setIsLoading(true);
    try {
      // Buscar bills existentes
      const { data: existingBills, error } = await supabase
        .from('contract_bills')
        .select('*')
        .eq('contract_id', contractId);

      if (error) throw error;

      const requiredBillTypes = getRequiredBillTypes();
      const existingBillTypes = (existingBills || []).map(
        (b) => b.bill_type as BillType
      );
      const missingBillTypes = requiredBillTypes.filter(
        (type) => !existingBillTypes.includes(type)
      );

      // Criar bills faltantes
      if (missingBillTypes.length > 0) {
        const newBills = missingBillTypes.map((billType) => ({
          contract_id: contractId,
          bill_type: billType,
          delivered: false,
        }));

        const { data: createdBills, error: insertError } = await supabase
          .from('contract_bills')
          .insert(newBills)
          .select();

        if (insertError) throw insertError;

        // Combinar bills existentes com as recém-criadas
        const allBills = [...(existingBills || []), ...(createdBills || [])];
        setBills(allBills as ContractBill[]);
      } else {
        // Filtrar apenas as bills que ainda são necessárias
        const filteredBills = (existingBills || []).filter((bill) =>
          requiredBillTypes.includes(bill.bill_type as BillType)
        );
        setBills(filteredBills as ContractBill[]);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas de consumo');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, getRequiredBillTypes]);

  /**
   * Alterna o status de entrega de uma conta
   */
  const toggleBillDelivery = useCallback(
    async (billType: BillType) => {
      try {
        const bill = bills.find((b) => b.bill_type === billType);

        if (!bill) {
          toast.error('Conta não encontrada');
          return;
        }

        const newDeliveredStatus = !bill.delivered;

        // Atualizar no Supabase
        const { error } = await supabase
          .from('contract_bills')
          .update({
            delivered: newDeliveredStatus,
            delivered_at: newDeliveredStatus ? new Date().toISOString() : null,
          })
          .eq('id', bill.id);

        if (error) throw error;

        // Atualizar estado local
        setBills((prevBills) =>
          prevBills.map((b) =>
            b.id === bill.id
              ? {
                  ...b,
                  delivered: newDeliveredStatus,
                  delivered_at: newDeliveredStatus
                    ? new Date().toISOString()
                    : undefined,
                }
              : b
          )
        );

        // Feedback visual
        const billName = {
          energia: 'Energia',
          agua: 'Água',
          condominio: 'Condomínio',
          gas: 'Gás',
        }[billType];

        toast.success(
          newDeliveredStatus
            ? `${billName} marcada como entregue`
            : `${billName} marcada como não entregue`
        );
      } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        toast.error('Erro ao atualizar status da conta');
      }
    },
    [bills]
  );

  /**
   * Recarrega as bills do servidor
   */
  const refreshBills = useCallback(async () => {
    await loadBills();
  }, [loadBills]);

  /**
   * Gera objeto com status de cada conta
   */
  const billStatus: BillStatus = {
    energia: bills.find((b) => b.bill_type === 'energia')?.delivered,
    agua: bills.find((b) => b.bill_type === 'agua')?.delivered,
    condominio: bills.find((b) => b.bill_type === 'condominio')?.delivered,
    gas: bills.find((b) => b.bill_type === 'gas')?.delivered,
  };

  // Carregar bills quando o componente monta ou contractId muda
  useEffect(() => {
    loadBills();
  }, [loadBills]);

  return {
    bills,
    billStatus,
    isLoading,
    toggleBillDelivery,
    refreshBills,
  };
}
