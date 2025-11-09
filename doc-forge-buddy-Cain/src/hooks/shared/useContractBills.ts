import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BillType, BillStatus, ContractBill, ContractFormData } from '@/types/contract';
import { toast } from 'sonner';
import { log } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';

interface ContractBillsOptions {
  contractId: string;
  formData: ContractFormData;
  autoSync?: boolean;
  syncInterval?: number;
}

interface UseContractBillsReturn {
  // Data
  bills: ContractBill[];
  billStatus: BillStatus;
  isLoading: boolean;
  error: string | null;
  lastSync: number;
  
  // Actions
  toggleBillDelivery: (billType: BillType) => Promise<void>;
  updateBillWithDate: (billType: BillType, deliveryDate: Date) => Promise<void>;
  refreshBills: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  
  // Computed
  completedBillsCount: number;
  totalBillsCount: number;
  completionPercentage: number;
  isFullyCompleted: boolean;
}

/**
 * Hook consolidado para gerenciamento de contas de contrato
 * Unifica funcionalidades de:
 * - useContractBills (gerenciamento completo)
 * - useContractBillsSync (sincronização com servidor)
 */
export const useContractBills = ({
  contractId,
  formData,
  autoSync = true,
  syncInterval = 30000, // 30 segundos
}: ContractBillsOptions): UseContractBillsReturn => {
  // State
  const [bills, setBills] = useState<ContractBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache local
  const [billsCache, setBillsCache] = useLocalStorage<Record<string, ContractBill[]>>(
    'contract-bills-cache', 
    {}
  );
  const [lastSync, setLastSync] = useLocalStorage<number>('bills-last-sync', 0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Determina tipos de contas necessárias
  const requiredBillTypes = useMemo((): BillType[] => {
    const required: BillType[] = ['energia']; // Energia sempre obrigatória

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

    // Notificação de Rescisão: sempre obrigatória
    required.push('notificacao_rescisao');

    // Entrega de Chaves: sempre obrigatória
    required.push('entrega_chaves');

    return required;
  }, [formData]);

  /**
   * Busca o ID real do contrato na tabela saved_terms
   */
  const getRealContractId = useCallback(async (): Promise<string | null> => {
    try {
      // Usar ilike para busca mais flexível
      const { data, error } = await supabase
        .from('saved_terms')
        .select('id')
        .eq('document_type', 'contrato')
        .ilike('form_data->>numeroContrato', contractId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        log.error('Erro ao buscar contrato:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      log.error('Erro ao buscar ID real do contrato:', err);
      return null;
    }
  }, [contractId]);

  /**
   * Carrega bills do servidor com cache inteligente
   */
  const loadBills = useCallback(async (forceRefresh = false) => {
    if (!contractId) return;

    // Verificar cache primeiro (se não for refresh forçado)
    const cacheKey = `bills-${contractId}`;
    if (!forceRefresh && billsCache[cacheKey]) {
      const cached = billsCache[cacheKey];
      const cacheAge = Date.now() - (cached as any)?._timestamp || 0;
      
      // Usar cache se não tiver mais de 5 minutos
      if (cacheAge < 5 * 60 * 1000) {
        setBills(cached.filter((bill: ContractBill) => 
          requiredBillTypes.includes(bill.bill_type as BillType)
        ));
        setLastSync((cached as any)._timestamp || 0);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const realContractId = await getRealContractId();
      if (!realContractId) {
        setError('Contrato não encontrado');
        return;
      }

      // Buscar bills existentes
      const { data: existingBills, error } = await supabase
        .from('contract_bills')
        .select('*')
        .eq('contract_id', realContractId);

      if (error) throw error;

      const existingBillTypes = (existingBills || []).map(b => b.bill_type as BillType);
      const missingBillTypes = requiredBillTypes.filter(
        type => !existingBillTypes.includes(type)
      );

      // Criar bills faltantes
      if (missingBillTypes.length > 0) {
        const newBills = missingBillTypes.map(billType => ({
          contract_id: realContractId,
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
        const processedBills = allBills.filter(bill =>
          requiredBillTypes.includes(bill.bill_type as BillType)
        ) as ContractBill[];

        setBills(processedBills);
        
        // Atualizar cache
        setBillsCache(prev => ({
          ...prev,
          [cacheKey]: [...processedBills, { _timestamp: Date.now() } as any],
        }));
      } else {
        // Filtrar apenas as bills necessárias
        const filteredBills = (existingBills || []).filter(bill =>
          requiredBillTypes.includes(bill.bill_type as BillType)
        ) as ContractBill[];

        setBills(filteredBills);
        
        // Atualizar cache
        setBillsCache(prev => ({
          ...prev,
          [cacheKey]: [...filteredBills, { _timestamp: Date.now() } as any],
        }));
      }

      setLastSync(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contas';
      log.error('Erro ao carregar contas:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractId, requiredBillTypes, getRealContractId, billsCache, setBillsCache]);

  /**
   * Sincroniza com o servidor (background)
   */
  const syncFromServer = useCallback(async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    try {
      await loadBills(true); // Force refresh
    } finally {
      setSyncInProgress(false);
    }
  }, [loadBills, syncInProgress]);

  /**
   * Alterna status de entrega de uma conta
   */
  const toggleBillDelivery = useCallback(async (billType: BillType) => {
    try {
      const bill = bills.find(b => b.bill_type === billType);
      if (!bill) {
        toast.error('Conta não encontrada');
        return;
      }

      const newDeliveredStatus = !bill.delivered;
      const realContractId = await getRealContractId();
      if (!realContractId) {
        toast.error('Contrato não encontrado');
        return;
      }

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
      setBills(prevBills =>
        prevBills.map(b =>
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
      const billNames = {
        energia: 'Energia',
        agua: 'Água',
        condominio: 'Condomínio',
        gas: 'Gás',
        notificacao_rescisao: 'Notificação de Rescisão',
        entrega_chaves: 'Entrega de Chaves',
      };

      toast.success(
        newDeliveredStatus
          ? `${billNames[billType]} concluída`
          : `${billNames[billType]} marcada como não entregue`
      );

      // Limpar cache para forçar reload na próxima vez
      const cacheKey = `bills-${contractId}`;
      setBillsCache(prev => {
        const updated = { ...prev };
        delete updated[cacheKey];
        return updated;
      });
    } catch (error) {
      log.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar status da conta');
    }
  }, [bills, getRealContractId, contractId, setBillsCache]);

  /**
   * Atualiza uma conta com data específica
   */
  const updateBillWithDate = useCallback(
    async (billType: BillType, deliveryDate: Date) => {
      try {
        const bill = bills.find(b => b.bill_type === billType);
        if (!bill) {
          toast.error('Conta não encontrada');
          return;
        }

        const realContractId = await getRealContractId();
        if (!realContractId) {
          toast.error('Contrato não encontrado');
          return;
        }

        // Atualizar no Supabase
        const { error } = await supabase
          .from('contract_bills')
          .update({
            delivered: true,
            delivered_at: deliveryDate.toISOString(),
          })
          .eq('id', bill.id);

        if (error) throw error;

        // Atualizar estado local
        setBills(prevBills =>
          prevBills.map(b =>
            b.id === bill.id
              ? {
                  ...b,
                  delivered: true,
                  delivered_at: deliveryDate.toISOString(),
                }
              : b
          )
        );

        // Feedback visual
        const billNames = {
          energia: 'Energia',
          agua: 'Água',
          condominio: 'Condomínio',
          gas: 'Gás',
          notificacao_rescisao: 'Notificação de Rescisão',
          entrega_chaves: 'Entrega de Chaves',
        };

        toast.success(`${billNames[billType]} concluída`);

        // Limpar cache
        const cacheKey = `bills-${contractId}`;
        setBillsCache(prev => {
          const updated = { ...prev };
          delete updated[cacheKey];
          return updated;
        });
      } catch (error) {
        log.error('Erro ao atualizar conta:', error);
        toast.error('Erro ao atualizar status da conta');
        throw error;
      }
    },
    [bills, getRealContractId, contractId, setBillsCache]
  );

  /**
   * Recarrega as bills do servidor
   */
  const refreshBills = useCallback(async () => {
    await loadBills(true);
  }, [loadBills]);

  // Gerar status das contas
  const billStatus: BillStatus = useMemo(() => ({
    energia: bills.find(b => b.bill_type === 'energia')?.delivered || false,
    agua: bills.find(b => b.bill_type === 'agua')?.delivered || false,
    condominio: bills.find(b => b.bill_type === 'condominio')?.delivered || false,
    gas: bills.find(b => b.bill_type === 'gas')?.delivered || false,
    notificacao_rescisao: bills.find(b => b.bill_type === 'notificacao_rescisao')?.delivered || false,
    entrega_chaves: bills.find(b => b.bill_type === 'entrega_chaves')?.delivered || false,
  }), [bills]);

  // Computed values
  const completedBillsCount = bills.filter(bill => bill.delivered).length;
  const totalBillsCount = requiredBillTypes.length;
  const completionPercentage = totalBillsCount > 0 
    ? Math.round((completedBillsCount / totalBillsCount) * 100) 
    : 0;
  const isFullyCompleted = completedBillsCount === totalBillsCount;

  // Auto-sync com o servidor
  useEffect(() => {
    if (!autoSync) return;

    loadBills();

    const interval = setInterval(() => {
      const timeSinceSync = Date.now() - lastSync;
      if (timeSinceSync >= syncInterval) {
        syncFromServer();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, loadBills, syncFromServer, lastSync, syncInterval]);

  return {
    // Data
    bills,
    billStatus,
    isLoading,
    error,
    lastSync,
    
    // Actions
    toggleBillDelivery,
    updateBillWithDate,
    refreshBills,
    syncFromServer,
    
    // Computed
    completedBillsCount,
    totalBillsCount,
    completionPercentage,
    isFullyCompleted,
  };
};

export default useContractBills;