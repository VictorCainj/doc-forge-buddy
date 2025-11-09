import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para ciclo de vida do contrato
export interface ContractStatus {
  id: string;
  contractId: string;
  status: 'draft' | 'active' | 'suspended' | 'terminated' | 'expired';
  previousStatus?: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ContractTransition {
  from: ContractStatus['status'];
  to: ContractStatus['status'];
  isValid: boolean;
  requiredFields?: string[];
  warnings?: string[];
}

export interface ContractValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredFields: string[];
}

export interface UseContractLifecycleOptions {
  autoRefresh?: boolean;
  enableValidation?: boolean;
  enableAudit?: boolean;
}

const STATUS_TRANSITIONS: Record<ContractStatus['status'], ContractStatus['status'][]> = {
  draft: ['active', 'terminated'],
  active: ['suspended', 'terminated', 'expired'],
  suspended: ['active', 'terminated'],
  terminated: [],
  expired: []
};

export function useContractLifecycle(
  contractId: string,
  options: UseContractLifecycleOptions = {}
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    autoRefresh = true,
    enableValidation = true,
    enableAudit = true
  } = options;

  // Estados locais
  const [currentStatus, setCurrentStatus] = useState<ContractStatus['status']>('draft');
  const [validationState, setValidationState] = useState<ContractValidation>({
    isValid: true,
    errors: [],
    warnings: [],
    requiredFields: []
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Buscar status atual do contrato
  const {
    data: contractStatus,
    isLoading: statusLoading,
    error: statusError
  } = useQuery({
    queryKey: ['contract-status', contractId],
    queryFn: async (): Promise<ContractStatus> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: `status-${contractId}`,
        contractId,
        status: 'draft',
        changedBy: user?.id || 'system',
        changedAt: new Date()
      };
    },
    enabled: !!contractId,
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Buscar dados do contrato para validação
  const {
    data: contractData,
    isLoading: contractLoading
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id: contractId,
        status: currentStatus,
        // outros campos do contrato...
      };
    },
    enabled: !!contractId
  });

  // Mutação para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      newStatus,
      reason,
      metadata
    }: {
      newStatus: ContractStatus['status'];
      reason?: string;
      metadata?: Record<string, any>;
    }) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        id: `status-${contractId}-${Date.now()}`,
        contractId,
        status: newStatus,
        previousStatus: currentStatus,
        changedBy: user?.id || 'system',
        changedAt: new Date(),
        reason,
        metadata
      } as ContractStatus;
    },
    onSuccess: (newStatus) => {
      setCurrentStatus(newStatus.status);
      queryClient.setQueryData(['contract-status', contractId], newStatus);
      
      if (enableAudit) {
        // Log de auditoria
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      }
      
      toast({
        title: 'Status atualizado',
        description: `Contrato movido para ${newStatus.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  // Validar transição de status
  const validateTransition = useCallback((newStatus: ContractStatus['status']): ContractValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields: string[] = [];

    // Verificar se a transição é permitida
    if (!STATUS_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      errors.push(`Transição de ${currentStatus} para ${newStatus} não é permitida`);
    }

    // Validações específicas por status
    if (newStatus === 'active' && enableValidation) {
      // Validações para ativar contrato
      if (!contractData) {
        requiredFields.push('Dados do contrato');
      }
      
      // Adicionar outras validações de negócio...
    }

    if (newStatus === 'terminated' && enableValidation) {
      // Validações para rescindir contrato
      if (!reason) {
        requiredFields.push('Motivo da rescisão');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredFields
    };
  }, [currentStatus, contractData, enableValidation]);

  // Obter transições disponíveis
  const availableTransitions = useCallback((): ContractTransition[] => {
    const possibleStatuses = STATUS_TRANSITIONS[currentStatus] || [];
    
    return possibleStatuses.map(status => {
      const validation = validateTransition(status);
      
      return {
        from: currentStatus,
        to: status,
        isValid: validation.isValid,
        requiredFields: validation.requiredFields,
        warnings: validation.warnings
      };
    });
  }, [currentStatus, validateTransition]);

  // Alterar status do contrato
  const changeStatus = useCallback(async (
    newStatus: ContractStatus['status'],
    options?: {
      reason?: string;
      metadata?: Record<string, any>;
      force?: boolean;
    }
  ) => {
    if (isTransitioning) return;

    const validation = validateTransition(newStatus);
    
    if (!validation.isValid && !options?.force) {
      setValidationState(validation);
      toast({
        title: 'Validação falhou',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return false;
    }

    setIsTransitioning(true);
    setValidationState(validation);

    try {
      await updateStatusMutation.mutateAsync({
        newStatus,
        reason: options?.reason,
        metadata: options?.metadata
      });
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [validateTransition, updateStatusMutation, toast, isTransitioning]);

  // Atualizar metadados do status
  const updateMetadata = useCallback(async (metadata: Record<string, any>) => {
    if (!contractStatus) return;

    const newMetadata = {
      ...contractStatus.metadata,
      ...metadata,
      lastUpdated: new Date()
    };

    // Atualizar localmente
    queryClient.setQueryData(['contract-status', contractId], {
      ...contractStatus,
      metadata: newMetadata
    });
  }, [contractStatus, contractId, queryClient]);

  // Efeito para atualizar status atual
  useEffect(() => {
    if (contractStatus?.status) {
      setCurrentStatus(contractStatus.status);
    }
  }, [contractStatus]);

  // Efeito para validação automática
  useEffect(() => {
    if (enableValidation) {
      const validation = validateTransition(currentStatus);
      setValidationState(validation);
    }
  }, [currentStatus, validateTransition, enableValidation]);

  return {
    // Estado
    currentStatus,
    contractStatus,
    contractData,
    validationState,
    isTransitioning,
    statusLoading,
    contractLoading,
    statusError,

    // Transições
    availableTransitions,
    changeStatus,
    validateTransition,

    // Metadados
    updateMetadata,

    // Utilitários
    canTransition: (newStatus: ContractStatus['status']) => 
      validateTransition(newStatus).isValid,
    
    getStatusInfo: (status: ContractStatus['status']) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: getStatusColor(status),
      description: getStatusDescription(status)
    })
  };
}

// Funções auxiliares
function getStatusColor(status: ContractStatus['status']): string {
  const colors = {
    draft: 'gray',
    active: 'green',
    suspended: 'yellow',
    terminated: 'red',
    expired: 'orange'
  };
  return colors[status] || 'gray';
}

function getStatusDescription(status: ContractStatus['status']): string {
  const descriptions = {
    draft: 'Contrato em rascunho',
    active: 'Contrato ativo e vigente',
    suspended: 'Contrato temporariamente suspenso',
    terminated: 'Contrato rescindido',
    expired: 'Contrato expirado'
  };
  return descriptions[status] || 'Status desconhecido';
}