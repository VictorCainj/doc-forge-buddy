/**
 * Exemplo prático: Como usar o ContractService em componentes React
 * 
 * Este arquivo demonstra:
 * 1. Como substituir o código existente pelo novo ContractService
 * 2. Como usar as novas funcionalidades (renovação, terminação, métricas)
 * 3. Como manter compatibilidade com React Query
 * 4. Como tratar erros e loading states
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  useContracts, 
  useCreateContract, 
  useUpdateContract, 
  useDeleteContract,
  useRenewContract,
  useTerminateContract,
  useContractStats,
  useContractsByProperty,
  useContractMetrics,
  useInvalidateContracts
} from '@/hooks/useContractsQueryNew';

import { LegacyContract, LegacyContractFilters } from '@/services/contracts/contract-service-adapter';

// === COMPONENTE PRINCIPAL: EXEMPLO COMPLETO ===

const ContratosExemplo = () => {
  // Estados locais
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [filters, setFilters] = useState<LegacyContractFilters>({
    status: 'active',
    limit: 50
  });
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);

  // === HOOKS COM CONTRACT SERVICE ===
  
  // Buscar contratos
  const { 
    data: contractsResponse, 
    isLoading: isLoadingContracts,
    error: contractsError,
    refetch: refetchContracts 
  } = useContracts(filters);

  // Buscar estatísticas
  const { data: stats, isLoading: isLoadingStats } = useContractStats();

  // Buscar métricas do contrato selecionado
  const { data: contractMetrics } = useContractMetrics(selectedContract || '');

  // Mutations
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const renewContract = useRenewContract();
  const terminateContract = useTerminateContract();

  // Utility
  const { invalidateAllContracts } = useInvalidateContracts();

  // Dados convertidos
  const contracts = contractsResponse?.contracts || [];
  const totalCount = contractsResponse?.total || 0;

  // === FUNÇÕES DE MANEJO ===

  // Função para criar novo contrato
  const handleCreateContract = async (contractData: Omit<LegacyContract, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newContract = await createContract.mutateAsync(contractData);
      toast.success(`Contrato ${newContract.contractNumber} criado com sucesso!`);
      setFilters({ ...filters }); // Trigger refetch
    } catch (error) {
      toast.error('Erro ao criar contrato');
    }
  };

  // Função para renovar contrato
  const handleRenewContract = async (contractId: string, newEndDate: string) => {
    try {
      await renewContract.mutateAsync({
        id: contractId,
        renewalData: {
          newEndDate,
          newStartDate: new Date().toISOString().split('T')[0],
          renewalReason: 'Renovação solicitada pelo locatário',
          updatedTerms: {
            // Atualizar termos se necessário
            valorAluguel: 2500,
            dataVencimento: '10'
          }
        }
      });
      toast.success('Contrato renovado com sucesso!');
      setShowRenewalModal(false);
    } catch (error) {
      toast.error('Erro ao renovar contrato');
    }
  };

  // Função para terminar contrato
  const handleTerminateContract = async (contractId: string, reason: string) => {
    try {
      await terminateContract.mutateAsync({
        id: contractId,
        terminationData: {
          terminationDate: new Date().toISOString(),
          reason,
          terminationType: 'mutual',
          propertyCondition: 'good',
          returnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias
        }
      });
      toast.success('Contrato terminado com sucesso!');
      setShowTerminationModal(false);
    } catch (error) {
      toast.error('Erro ao terminar contrato');
    }
  };

  // Função para deletar contrato
  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja deletar este contrato?')) {
      return;
    }

    try {
      await deleteContract.mutateAsync(contractId);
      toast.success('Contrato deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar contrato');
    }
  };

  // Função para atualizar contrato
  const handleUpdateContract = async (contractId: string, updates: Partial<LegacyContract>) => {
    try {
      await updateContract.mutateAsync({ id: contractId, updates });
      toast.success('Contrato atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar contrato');
    }
  };

  // Função para refresh completo
  const handleRefreshAll = async () => {
    try {
      await refetchContracts();
      invalidateAllContracts();
      toast.success('Dados atualizados!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    }
  };

  // === RENDER ===
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contratos - Exemplo ContractService</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={isLoadingContracts}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoadingContracts ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button
            onClick={() => handleCreateContract({
              contractNumber: `CONT-${Date.now()}`,
              clientName: 'João Silva',
              property: 'Rua das Flores, 123',
              status: 'pending',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              totalValue: 24000,
              paidValue: 0,
              dueDate: '2024-01-10'
            })}
            disabled={createContract.isPending}
            className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
          >
            {createContract.isPending ? 'Criando...' : 'Criar Contrato'}
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <StatsSection stats={stats} isLoading={isLoadingStats} />

      {/* Contratos */}
      <ContractsList
        contracts={contracts}
        isLoading={isLoadingContracts}
        error={contractsError}
        totalCount={totalCount}
        onSelectContract={setSelectedContract}
        onRenew={handleRenewContract}
        onTerminate={handleTerminateContract}
        onUpdate={handleUpdateContract}
        onDelete={handleDeleteContract}
        renewLoading={renewContract.isPending}
        terminateLoading={terminateContract.isPending}
        updateLoading={updateContract.isPending}
        deleteLoading={deleteContract.isPending}
      />

      {/* Métricas do contrato selecionado */}
      {selectedContract && contractMetrics && (
        <ContractMetricsSection metrics={contractMetrics} />
      )}

      {/* Modais */}
      {showRenewalModal && (
        <RenewalModal
          contractId={selectedContract!}
          onConfirm={handleRenewContract}
          onCancel={() => setShowRenewalModal(false)}
        />
      )}

      {showTerminationModal && (
        <TerminationModal
          contractId={selectedContract!}
          onConfirm={handleTerminateContract}
          onCancel={() => setShowTerminationModal(false)}
        />
      )}
    </div>
  );
};

// === COMPONENTES AUXILIARES ===

interface StatsSectionProps {
  stats?: {
    total: number;
    completionRate: number;
    recentActivity: {
      created: number;
      updated: number;
      terminated: number;
    };
  };
  isLoading: boolean;
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Estatísticas</h2>
        <div className="text-center text-neutral-500">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-lg font-semibold mb-4">Estatísticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-neutral-600">Total de Contratos</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completionRate}%</div>
          <div className="text-sm text-neutral-600">Taxa de Conclusão</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.recentActivity.created}</div>
          <div className="text-sm text-neutral-600">Criados Recentemente</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{stats.recentActivity.terminated}</div>
          <div className="text-sm text-neutral-600">Terminados Recentemente</div>
        </div>
      </div>
    </div>
  );
};

interface ContractsListProps {
  contracts: LegacyContract[];
  isLoading: boolean;
  error?: Error | null;
  totalCount: number;
  onSelectContract: (id: string) => void;
  onRenew: (id: string, newEndDate: string) => Promise<void>;
  onTerminate: (id: string, reason: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<LegacyContract>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  renewLoading?: boolean;
  terminateLoading?: boolean;
  updateLoading?: boolean;
  deleteLoading?: boolean;
}

const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  isLoading,
  error,
  totalCount,
  onSelectContract,
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
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Contratos</h2>
        <div className="text-center text-neutral-500">Carregando contratos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Contratos</h2>
        <div className="text-center text-red-500">
          Erro ao carregar contratos: {error.message}
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Contratos</h2>
        <div className="text-center text-neutral-500">Nenhum contrato encontrado</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-lg font-semibold mb-4">Contratos ({totalCount})</h2>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onSelect={() => onSelectContract(contract.id)}
            onRenew={() => onRenew(contract.id, '2025-12-31')}
            onTerminate={() => onTerminate(contract.id, 'Rescisão por mútuo acordo')}
            onUpdate={() => onUpdate(contract.id, { clientName: 'Nome Atualizado' })}
            onDelete={() => onDelete(contract.id)}
            isRenewLoading={renewLoading}
            isTerminateLoading={terminateLoading}
            isUpdateLoading={updateLoading}
            isDeleteLoading={deleteLoading}
          />
        ))}
      </div>
    </div>
  );
};

interface ContractCardProps {
  contract: LegacyContract;
  onSelect: () => void;
  onRenew: () => void;
  onTerminate: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  isRenewLoading?: boolean;
  isTerminateLoading?: boolean;
  isUpdateLoading?: boolean;
  isDeleteLoading?: boolean;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onSelect,
  onRenew,
  onTerminate,
  onUpdate,
  onDelete,
  isRenewLoading = false,
  isTerminateLoading = false,
  isUpdateLoading = false,
  isDeleteLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="border border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-neutral-300 transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
              {contract.status}
            </span>
          </div>
          
          <p className="text-sm text-neutral-600 mt-1">
            <strong>Cliente:</strong> {contract.clientName}
          </p>
          
          <p className="text-sm text-neutral-600">
            <strong>Propriedade:</strong> {contract.property}
          </p>
          
          <div className="flex gap-4 mt-2 text-sm text-neutral-500">
            <span><strong>Início:</strong> {contract.startDate}</span>
            <span><strong>Fim:</strong> {contract.endDate}</span>
            <span><strong>Valor:</strong> R$ {contract.totalValue?.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Ações do ContractService */}
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onRenew(); }}
              disabled={isRenewLoading}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
            >
              {isRenewLoading ? 'Renovando...' : 'Renovar'}
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onTerminate(); }}
              disabled={isTerminateLoading}
              className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 disabled:opacity-50"
            >
              {isTerminateLoading ? 'Terminando...' : 'Terminar'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate(); }}
              disabled={isUpdateLoading}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
            >
              {isUpdateLoading ? 'Atualizando...' : 'Editar'}
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={isDeleteLoading}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              {isDeleteLoading ? 'Deletando...' : 'Deletar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContractMetricsSectionProps {
  metrics: {
    metrics: {
      total: number;
      completionRate: number;
    };
    insights: string[];
    recommendations: string[];
    alerts: Array<{
      type: 'warning' | 'critical' | 'info';
      message: string;
    }>;
  };
}

const ContractMetricsSection: React.FC<ContractMetricsSectionProps> = ({ metrics }) => {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-lg font-semibold mb-4">Métricas Detalhadas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métricas */}
        <div>
          <h3 className="font-medium mb-2">Métricas</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">{metrics.metrics.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Conclusão:</span>
              <span className="font-medium">{metrics.metrics.completionRate}%</span>
            </div>
          </div>
        </div>
        
        {/* Insights */}
        <div>
          <h3 className="font-medium mb-2">Insights</h3>
          <ul className="text-sm text-neutral-600 space-y-1">
            {metrics.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recomendações */}
        <div>
          <h3 className="font-medium mb-2">Recomendações</h3>
          <ul className="text-sm text-neutral-600 space-y-1">
            {metrics.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Alertas */}
        <div>
          <h3 className="font-medium mb-2">Alertas</h3>
          <ul className="text-sm space-y-1">
            {metrics.alerts.map((alert, index) => (
              <li key={index} className={`flex items-start gap-2 p-2 rounded ${
                alert.type === 'critical' ? 'bg-red-50 text-red-700' :
                alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                <span className="text-sm">
                  {alert.type === 'critical' ? '🚨' : 
                   alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// === MODAIS DE EXEMPLO ===

const RenewalModal: React.FC<{
  contractId: string;
  onConfirm: (id: string, newEndDate: string) => Promise<void>;
  onCancel: () => void;
}> = ({ contractId, onConfirm, onCancel }) => {
  const [newEndDate, setNewEndDate] = useState('2025-12-31');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Renovar Contrato</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Confirma a renovação do contrato {contractId}?
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nova Data de Fim</label>
          <input
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            className="w-full border border-neutral-300 rounded px-3 py-2"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(contractId, newEndDate)}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const TerminationModal: React.FC<{
  contractId: string;
  onConfirm: (id: string, reason: string) => Promise<void>;
  onCancel: () => void;
}> = ({ contractId, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('Rescisão por mútuo acordo');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Terminar Contrato</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Confirma a terminação do contrato {contractId}?
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Motivo</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-neutral-300 rounded px-3 py-2"
          >
            <option value="Rescisão por mútuo acordo">Rescisão por mútuo acordo</option>
            <option value="Vencimento do contrato">Vencimento do contrato</option>
            <option value="Infração contratual">Infração contratual</option>
            <option value="Por iniciativa do locatário">Por iniciativa do locatário</option>
            <option value="Por iniciativa do locador">Por iniciativa do locador</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(contractId, reason)}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContratosExemplo;

// === RESUMO DOS BENEFÍCIOS ===

/**
 * 
 * ✅ BENEFÍCIOS DESTE EXEMPLO:
 * 
 * 1. **Separação de Responsabilidades**:
 *    - Hooks focam apenas na gestão de estado
 *    - Componentes focam apenas na renderização
 *    - Lógica de negócio isolada no service
 * 
 * 2. **Melhor UX**:
 *    - Loading states adequados
 *    - Feedback visual das operações
 *    - Tratamento de erros robusto
 *    - Confirmações para ações destrutivas
 * 
 * 3. **Funcionalidades Avançadas**:
 *    - Renovação de contratos
 *    - Terminação com motivos
 *    - Métricas e insights
 *    - Alertas automáticos
 * 
 * 4. **Performance**:
 *    - Cache inteligente com React Query
 *    - Otimistic updates
 *    - Invalidação automática
 *    - Prefetch de dados
 * 
 * 5. **Manutenibilidade**:
 *    - Código organizado em camadas
 *    - Tipos bem definidos
 *    - Fácil de testar
 *    - Simples de extender
 * 
 * 6. **Robustez**:
 *    - Tratamento completo de erros
 *    - Rollback automático em falhas
 *    - Validações de negócio
 *    - Transações seguras
 * 
 * 
 * 🚀 COMO IMPLEMENTAR:
 * 
 * 1. Substitua o imports antigos pelos novos:
 *    - contractsService.ts → useContractsQueryNew.ts
 * 
 * 2. Atualize os hooks nos componentes:
 *    - useContracts() → useContracts()
 *    - useCreateContract() → useCreateContract()
 *    - + useRenewContract()
 *    - + useTerminateContract()
 *    - + useContractStats()
 * 
 * 3. Adicione novas funcionalidades gradualmente:
 *    - Botões de renovação/terminação
 *    - Seção de métricas
 *    - Modais de confirmação
 * 
 * 4. Teste e monitore:
 *    - Performance das queries
 *    - Feedback dos usuários
 *    - Logs de erro
 *    - Métricas de negócio
 * 
 */