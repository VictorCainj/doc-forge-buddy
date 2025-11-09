/**
 * Exemplo de migração do componente Contratos.tsx para usar o novo ContractService
 * 
 * Este arquivo mostra como substituir gradualmente o código existente pelo novo service
 * mantendo a compatibilidade com React Query
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from '@/utils/iconMapper';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { useDebouncedCallback } from '@/utils/core/debounce';

// === HOOKS ANTIGOS (serão substituídos gradualmente) ===
// import { useContracts, useCreateContract } from '@/services/contractsService';

// === NOVOS HOOKS (usando ContractService) ===
import { 
  useContracts, 
  useCreateContract, 
  useUpdateContract, 
  useDeleteContract,
  useRenewContract,
  useTerminateContract,
  useContractStats,
  useInvalidateContracts
} from '@/hooks/useContractsQueryNew';

// === TIPOS ===
import { LegacyContract, LegacyContractFilters } from '@/services/contracts/contract-service-adapter';

// === EXEMPLO 1: COMPONENTE ATUALIZADO PARA USAR O NOVO SERVICE ===

const ContratosUpdated = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // Estados locais
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filters, setFilters] = useState<LegacyContractFilters>({});

  // === NOVO: HOOKS USANDO CONTRACT SERVICE ===
  
  // Buscar contratos com o novo service
  const { 
    data: contractsResponse, 
    isLoading, 
    error,
    refetch 
  } = useContracts(filters);

  // Buscar estatísticas com o novo service
  const { data: stats } = useContractStats();

  // Mutations usando o novo service
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const renewContract = useRenewContract();
  const terminateContract = useTerminateContract();

  // Utility hooks
  const { invalidateAllContracts } = useInvalidateContracts();

  // === DADOS CONVERTIDOS PARA COMPATIBILIDADE ===
  const contracts = contractsResponse?.contracts || [];
  const totalCount = contractsResponse?.total || 0;

  // === FUNÇÕES DE NEGÓCIO COM NOVAS FUNCIONALIDADES ===

  const handleRenewContract = async (contractId: string, newEndDate: string) => {
    try {
      await renewContract.mutateAsync({
        id: contractId,
        renewalData: {
          newEndDate,
          renewalReason: 'Renovação automática'
        }
      });
    } catch (error) {
      showError('Erro ao renovar contrato');
    }
  };

  const handleTerminateContract = async (contractId: string, reason: string) => {
    try {
      await terminateContract.mutateAsync({
        id: contractId,
        terminationData: {
          terminationDate: new Date().toISOString(),
          reason,
          terminationType: 'mutual'
        }
      });
    } catch (error) {
      showError('Erro ao terminar contrato');
    }
  };

  const handleCreateContract = async (contractData: Omit<LegacyContract, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createContract.mutateAsync(contractData);
      navigate('/contratos');
    } catch (error) {
      showError('Erro ao criar contrato');
    }
  };

  const handleUpdateContract = async (id: string, updates: Partial<LegacyContract>) => {
    try {
      await updateContract.mutateAsync({ id, updates });
    } catch (error) {
      showError('Erro ao atualizar contrato');
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteContract.mutateAsync(id);
    } catch (error) {
      showError('Erro ao deletar contrato');
    }
  };

  const handleFilterChange = (newFilters: LegacyContractFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    refetch();
    invalidateAllContracts();
  };

  // === RENDER ===
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white relative">
        <div className="relative z-10">
          {/* Header */}
          <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="icon-container w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                      Contratos
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 font-medium truncate">
                      Gerencie todos os contratos de locação
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* NOVO: Botão de refresh com nova funcionalidade */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {isLoading ? 'Carregando...' : 'Atualizar'}
                  </button>

                  <Link to="/cadastrar-contrato" className="flex-shrink-0">
                    <button className="inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">Novo Contrato</span>
                      <span className="sm:hidden">Novo</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="max-w-[1400px] mx-auto px-4 py-2 sm:px-6 lg:px-8">
            <div className="bg-white border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                  Bem-vindo,{' '}
                  <span className="inline-block text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Com quais contratos iremos trabalhar hoje?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Hoje
                </p>
                <div className="bg-white/90 px-3 py-1.5 rounded-lg border border-white/50">
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                    {formatDateBrazilian(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* === NOVO: Estatísticas com dados do ContractService === */}
            <ContractStatsNew stats={stats} />

            {/* === ATUALIZADO: Lista com novas funcionalidades === */}
            <ContractListNew
              contracts={contracts}
              isLoading={isLoading}
              onRenew={handleRenewContract}
              onTerminate={handleTerminateContract}
              onUpdate={handleUpdateContract}
              onDelete={handleDeleteContract}
              renewLoading={renewContract.isPending}
              terminateLoading={terminateContract.isPending}
              updateLoading={updateContract.isPending}
              deleteLoading={deleteContract.isPending}
            />

            {/* Exibir estatísticas do ContractService */}
            {stats && (
              <div className="bg-white p-6 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-semibold mb-4">Métricas do ContractService</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-neutral-600">Total de Contratos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                    <div className="text-sm text-neutral-600">Taxa de Conclusão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.recentActivity.created}</div>
                    <div className="text-sm text-neutral-600">Criados Recentemente</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// === COMPONENTES AUXILIARES ATUALIZADOS ===

interface ContractStatsNewProps {
  stats?: {
    total: number;
    byStatus: Record<string, number>;
    completionRate: number;
    recentActivity: {
      created: number;
      updated: number;
      terminated: number;
    };
  };
}

const ContractStatsNew: React.FC<ContractStatsNewProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
        <div className="text-center text-neutral-500">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-neutral-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.byStatus.active || 0}</div>
          <div className="text-sm text-neutral-600">Ativos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending || 0}</div>
          <div className="text-sm text-neutral-600">Pendentes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.recentActivity.terminated}</div>
          <div className="text-sm text-neutral-600">Terminados</div>
        </div>
      </div>
    </div>
  );
};

interface ContractListNewProps {
  contracts: LegacyContract[];
  isLoading: boolean;
  onRenew: (contractId: string, newEndDate: string) => Promise<void>;
  onTerminate: (contractId: string, reason: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<LegacyContract>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  renewLoading?: boolean;
  terminateLoading?: boolean;
  updateLoading?: boolean;
  deleteLoading?: boolean;
}

const ContractListNew: React.FC<ContractListNewProps> = ({
  contracts,
  isLoading,
  onRenew,
  onTerminate,
  onUpdate,
  onDelete,
  renewLoading = false,
  terminateLoading = false,
  updateLoading = false,
  deleteLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <div className="text-center text-neutral-500">Carregando contratos...</div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <div className="text-center text-neutral-500">Nenhum contrato encontrado</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <h3 className="text-lg font-semibold mb-4">Contratos ({contracts.length})</h3>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div key={contract.id} className="border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{contract.contractNumber}</h4>
                <p className="text-sm text-neutral-600">{contract.clientName}</p>
                <p className="text-sm text-neutral-500">{contract.property}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    contract.status === 'active' ? 'bg-green-100 text-green-800' :
                    contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
              
              {/* === NOVAS AÇÕES DO CONTRACT SERVICE === */}
              <div className="flex gap-2">
                <button
                  onClick={() => onRenew(contract.id, '2025-12-31')}
                  disabled={renewLoading}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                >
                  Renovar
                </button>
                <button
                  onClick={() => onTerminate(contract.id, 'Rescisão por mútuo acordo')}
                  disabled={terminateLoading}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                >
                  Terminar
                </button>
                <button
                  onClick={() => onDelete(contract.id)}
                  disabled={deleteLoading}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContratosUpdated;

// === EXEMPLO 2: MIGRAÇÃO PASSO A PASSO ===

/**
 * PASSO 1: Substituir imports
 * 
 * ANTES:
 * import { useContracts, useCreateContract } from '@/services/contractsService';
 * 
 * DEPOIS:
 * import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useContractsQueryNew';
 * import { contractServiceAdapter } from '@/services/contracts/contract-service-adapter';
 */

/**
 * PASSO 2: Atualizar hooks
 * 
 * ANTES:
 * const { data: contracts = [], isLoading, error } = useContracts(filters);
 * const createContract = useCreateContract();
 * 
 * DEPOIS:
 * const { data: contractsResponse, isLoading, error } = useContracts(filters);
 * const contracts = contractsResponse?.contracts || [];
 * const createContract = useCreateContract();
 * const updateContract = useUpdateContract();
 * const deleteContract = useDeleteContract();
 * const renewContract = useRenewContract();
 * const terminateContract = useTerminateContract();
 */

/**
 * PASSO 3: Adicionar novas funcionalidades
 * 
 * const handleRenewContract = async (contractId: string, newEndDate: string) => {
 *   try {
 *     await renewContract.mutateAsync({
 *       id: contractId,
 *       renewalData: {
 *         newEndDate,
 *         renewalReason: 'Renovação automática'
 *       }
 *     });
 *   } catch (error) {
 *     showError('Erro ao renovar contrato');
 *   }
 * };
 */

/**
 * PASSO 4: Atualizar UI com novos botões
 * 
 * <button onClick={() => handleRenewContract(contract.id, '2025-12-31')}>
 *   Renovar Contrato
 * </button>
 * 
 * <button onClick={() => handleTerminateContract(contract.id, 'Rescisão')}>
 *   Terminar Contrato
 * </button>
 */