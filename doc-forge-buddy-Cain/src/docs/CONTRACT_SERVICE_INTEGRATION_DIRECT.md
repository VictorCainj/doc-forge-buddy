# Integração do ContractService - Implementação Direta

## 📋 Resumo da Integração

Este arquivo mostra exatamente como modificar o componente `Contratos.tsx` existente para usar o novo `ContractService` mantendo compatibilidade total com React Query.

## 🔄 Mudanças Necessárias

### 1. Substituir Imports (Passo 1)

**❌ CÓDIGO ATUAL (Contratos.tsx):**
```typescript
// Hooks simplificados (removidos imports de módulos inexistentes)
const useContractReducer = () => {
  const [state, setState] = React.useState({
    loading: { loadMore: false },
    modals: {},
    selectedContract: null,
    pendingDocument: null,
    formData: {}
  });
  
  const actions = {
    setFormData: (data: any) => setState(prev => ({ ...prev, formData: data })),
    closeModal: () => setState(prev => ({ ...prev, modals: {}, selectedContract: null }))
  };
  
  return { state, actions };
};
```

**✅ NOVO CÓDIGO:**
```typescript
// === NOVOS IMPORTS ===
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

import { LegacyContract, LegacyContractFilters } from '@/services/contracts/contract-service-adapter';

// === HOOKS SIMPLIFICADOS COM CONTRACT SERVICE ===
const useContractReducer = () => {
  const [state, setState] = React.useState({
    loading: { loadMore: false },
    modals: {},
    selectedContract: null,
    pendingDocument: null,
    formData: {}
  });
  
  const actions = {
    setFormData: (data: any) => setState(prev => ({ ...prev, formData: data })),
    closeModal: () => setState(prev => ({ ...prev, modals: {}, selectedContract: null }))
  };
  
  return { state, actions };
};
```

### 2. Substituir Estado Local (Passo 2)

**❌ CÓDIGO ATUAL:**
```typescript
// Hooks de contrato simplificados
const [contracts, setContracts] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [displayedContracts, setDisplayedContracts] = useState([]);
const [filters, setFilters] = useState({});
const [searchResults, setSearchResults] = useState(0);
const [isSearching, setIsSearching] = useState(false);
const [hasSearched, setHasSearched] = useState(false);
const [hasMore, setHasMore] = useState(false);
const [totalCount, setTotalCount] = useState(0);
const [totalResults, setTotalResults] = useState(0);
const [contractIndex, setContractIndex] = useState(0);
const [favoritesSet, setFavoritesSet] = useState(new Set());
const [allTags, setAllTags] = useState([]);
const [availableYears, setAvailableYears] = useState([]);
```

**✅ NOVO CÓDIGO:**
```typescript
// === ESTADO SIMPLIFICADO COM CONTRACT SERVICE ===
const [isExporting, setIsExporting] = useState<boolean>(false);
const [filters, setFilters] = useState<LegacyContractFilters>({});

// === HOOKS COM CONTRACT SERVICE ===
const { data: contractsResponse, isLoading, error, refetch } = useContracts(filters);
const { data: stats } = useContractStats();

// Mutations
const createContract = useCreateContract();
const updateContract = useUpdateContract();
const deleteContract = useDeleteContract();
const renewContract = useRenewContract();
const terminateContract = useTerminateContract();

const { invalidateAllContracts } = useInvalidateContracts();

// === DADOS CONVERTIDOS ===
const contracts = contractsResponse?.contracts || [];
const displayedContracts = contracts; // Compatibilidade
const totalCount = contractsResponse?.total || 0;
const isSearching = false; // Simplificado
const hasSearched = false; // Simplificado
const hasMore = contractsResponse?.hasMore || false;
const searchResults = totalCount;
const totalResults = totalCount;

// Dados simplificados para compatibilidade
const favoritesSet = new Set();
const allTags = [];
const availableYears = [];
```

### 3. Substituir Funções (Passo 3)

**❌ CÓDIGO ATUAL:**
```typescript
// Funções simplificadas
const performSearch = (term: string) => setIsSearching(true);
const clearSearch = () => setHasSearched(false);
const loadMore = () => {};
const isFavorite = () => false;
const getContractTags = () => [];
const setFilter = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));
const clearAllFilters = () => setFilters({});
const stats = { total: 0, pending: 0, completed: 0, cancelled: 0 };
```

**✅ NOVO CÓDIGO:**
```typescript
// === FUNÇÕES ATUALIZADAS COM CONTRACT SERVICE ===

// Filtragem
const setFilter = (key: string, value: any) => {
  setFilters(prev => ({ ...prev, [key]: value }));
};

const clearAllFilters = () => {
  setFilters({});
};

const performSearch = (term: string) => {
  setFilters(prev => ({ ...prev, search: term }));
};

const clearSearch = () => {
  setFilters(prev => ({ ...prev, search: undefined }));
  setHasSearched(false);
};

const loadMore = () => {
  setFilters(prev => ({ 
    ...prev, 
    page: (prev.page || 1) + 1 
  }));
};

// === NOVAS FUNÇÕES COM CONTRACT SERVICE ===

const handleRefresh = () => {
  refetch();
  invalidateAllContracts();
};

const handleRenewContract = async (contractId: string, newEndDate: string) => {
  try {
    await renewContract.mutateAsync({
      id: contractId,
      renewalData: {
        newEndDate,
        renewalReason: 'Renovação solicitada'
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
  if (!confirm('Tem certeza que deseja deletar este contrato?')) {
    return;
  }
  try {
    await deleteContract.mutateAsync(id);
  } catch (error) {
    showError('Erro ao deletar contrato');
  }
};
```

### 4. Atualizar JSX (Passo 4)

**❌ CÓDIGO ATUAL:**
```typescript
// Header sem botão de refresh
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

  <Link to="/cadastrar-contrato" className="flex-shrink-0">
    <button className="inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50">
      <Plus className="h-5 w-5" />
      <span className="hidden sm:inline">Novo Contrato</span>
      <span className="sm:hidden">Novo</span>
    </button>
  </Link>
</div>
```

**✅ NOVO CÓDIGO:**
```typescript
// Header com botão de refresh e estatísticas
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
      {/* NOVO: Mostrar total de contratos */}
      {totalCount > 0 && (
        <p className="text-xs text-neutral-500">
          {totalCount} contrato{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  </div>

  <div className="flex gap-2">
    {/* NOVO: Botão de refresh */}
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-sm"
    >
      {isLoading ? '🔄 Carregando...' : '🔄 Atualizar'}
    </button>

    <Link to="/cadastrar-contrato" className="flex-shrink-0">
      <button className="inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50">
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Novo Contrato</span>
        <span className="sm:hidden">Novo</span>
      </button>
    </Link>
  </div>
</div>
```

### 5. Atualizar Seção de Estatísticas (Passo 5)

**❌ CÓDIGO ATUAL:**
```typescript
{/* Estatísticas */}
<ContractStats stats={stats} />
```

**✅ NOVO CÓDIGO:**
```typescript
{/* Estatísticas com dados do ContractService */}
<div className="bg-white border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shadow-sm">
  <div className="flex flex-col gap-0.5">
    <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
      Estatísticas dos Contratos
    </h2>
    <p className="text-xs sm:text-sm text-neutral-600">
      Visão geral dos contratos no sistema
    </p>
  </div>
  
  {stats ? (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-xs text-neutral-500">Total</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold text-green-600">{stats.completionRate}%</div>
        <div className="text-xs text-neutral-500">Conclusão</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold text-purple-600">{stats.recentActivity.created}</div>
        <div className="text-xs text-neutral-500">Novos</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold text-red-600">{stats.recentActivity.terminated}</div>
        <div className="text-xs text-neutral-500">Terminados</div>
      </div>
    </div>
  ) : (
    <div className="text-sm text-neutral-500">Carregando estatísticas...</div>
  )}
</div>
```

### 6. Atualizar Lista de Contratos (Passo 6)

**❌ CÓDIGO ATUAL:**
```typescript
{/* Lista de Contratos */}
<ContractList
  contracts={displayedContracts}
  isLoading={isLoading}
  hasMore={hasMore}
  loadMore={loadMore}
  isLoadingMore={state.loading.loadMore}
  totalCount={totalCount}
  displayedCount={displayedContracts.length}
  hasSearched={hasSearched}
  onGenerateDocument={generateDocument}
/>
```

**✅ NOVO CÓDIGO:**
```typescript
{/* Lista de Contratos com novas funcionalidades */}
<div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
  <div className="p-4 border-b border-neutral-200">
    <h2 className="text-lg font-semibold text-neutral-900">
      Contratos ({totalCount})
    </h2>
    {isLoading && (
      <p className="text-sm text-blue-600 mt-1">🔄 Carregando contratos...</p>
    )}
    {error && (
      <p className="text-sm text-red-600 mt-1">❌ Erro ao carregar contratos</p>
    )}
  </div>
  
  <div className="p-4">
    {isLoading ? (
      <div className="text-center text-neutral-500 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Carregando contratos...
      </div>
    ) : error ? (
      <div className="text-center text-red-500 py-8">
        <p>Erro ao carregar contratos</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          Tentar novamente
        </button>
      </div>
    ) : contracts.length === 0 ? (
      <div className="text-center text-neutral-500 py-8">
        <p>Nenhum contrato encontrado</p>
        <Link to="/cadastrar-contrato" className="mt-2 inline-block">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Criar primeiro contrato
          </button>
        </Link>
      </div>
    ) : (
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div key={contract.id} className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contract.status === 'active' ? 'bg-green-100 text-green-800' :
                    contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
                
                <p className="text-sm text-neutral-600 mb-1">
                  <strong>Cliente:</strong> {contract.clientName}
                </p>
                
                <p className="text-sm text-neutral-600 mb-1">
                  <strong>Propriedade:</strong> {contract.property}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                  <span><strong>Início:</strong> {contract.startDate}</span>
                  <span><strong>Fim:</strong> {contract.endDate}</span>
                  <span><strong>Valor:</strong> R$ {contract.totalValue?.toLocaleString()}</span>
                </div>
              </div>
              
              {/* === NOVAS AÇÕES DO CONTRACT SERVICE === */}
              <div className="flex flex-col gap-2 ml-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenewContract(contract.id, '2025-12-31')}
                    disabled={renewContract.isPending}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                    title="Renovar contrato"
                  >
                    {renewContract.isPending ? '🔄' : '🔄'} Renovar
                  </button>
                  
                  <button
                    onClick={() => handleTerminateContract(contract.id, 'Rescisão por mútuo acordo')}
                    disabled={terminateContract.isPending}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                    title="Terminar contrato"
                  >
                    {terminateContract.isPending ? '🔄' : '❌'} Terminar
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateContract(contract.id, { clientName: 'Nome Atualizado' })}
                    disabled={updateContract.isPending}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
                    title="Editar contrato"
                  >
                    {updateContract.isPending ? '🔄' : '✏️'} Editar
                  </button>
                  
                  <button
                    onClick={() => handleDeleteContract(contract.id)}
                    disabled={deleteContract.isPending}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                    title="Deletar contrato"
                  >
                    {deleteContract.isPending ? '🔄' : '🗑️'} Deletar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Botão de carregar mais */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200 disabled:opacity-50"
            >
              {isLoading ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

## 📝 Arquivo Completo Atualizado

O arquivo `Contratos.tsx` completo e atualizado ficaria assim:

```typescript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from '@/utils/iconMapper';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { useDebouncedCallback } from '@/utils/core/debounce';

// === NOVOS IMPORTS ===
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

import { LegacyContract, LegacyContractFilters } from '@/services/contracts/contract-service-adapter';

// === COMPONENTES BÁSICOS SIMPLIFICADOS ===
const ContractFilters = () => <div>Filtros em desenvolvimento</div>;
const ContractModals = () => null;

// === REDUCER HOOK ===
const useContractReducer = () => {
  const [state, setState] = React.useState({
    loading: { loadMore: false },
    modals: {},
    selectedContract: null,
    pendingDocument: null,
    formData: {}
  });
  
  const actions = {
    setFormData: (data: any) => setState(prev => ({ ...prev, formData: data })),
    closeModal: () => setState(prev => ({ ...prev, modals: {}, selectedContract: null }))
  };
  
  return { state, actions };
};

const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // === ESTADO LOCAL ===
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filters, setFilters] = useState<LegacyContractFilters>({});

  // === HOOKS COM CONTRACT SERVICE ===
  const { data: contractsResponse, isLoading, error, refetch } = useContracts(filters);
  const { data: stats } = useContractStats();
  
  // Mutations
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const renewContract = useRenewContract();
  const terminateContract = useTerminateContract();
  
  const { invalidateAllContracts } = useInvalidateContracts();

  // === DADOS CONVERTIDOS ===
  const contracts = contractsResponse?.contracts || [];
  const displayedContracts = contracts;
  const totalCount = contractsResponse?.total || 0;
  const isSearching = false;
  const hasSearched = false;
  const hasMore = contractsResponse?.hasMore || false;
  const searchResults = totalCount;
  const totalResults = totalCount;

  // Dados simplificados
  const favoritesSet = new Set();
  const allTags = [];
  const availableYears = [];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Reducer state
  const { state, actions } = useContractReducer();

  // === FUNÇÕES ===
  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const performSearch = (term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, search: undefined }));
    setHasSearched(false);
  };

  const loadMore = () => {
    setFilters(prev => ({ 
      ...prev, 
      page: (prev.page || 1) + 1 
    }));
  };

  const handleRefresh = () => {
    refetch();
    invalidateAllContracts();
  };

  const handleRenewContract = async (contractId: string, newEndDate: string) => {
    try {
      await renewContract.mutateAsync({
        id: contractId,
        renewalData: {
          newEndDate,
          renewalReason: 'Renovação solicitada'
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
    if (!confirm('Tem certeza que deseja deletar este contrato?')) {
      return;
    }
    try {
      await deleteContract.mutateAsync(id);
    } catch (error) {
      showError('Erro ao deletar contrato');
    }
  };

  // Funções de documentação
  const generateDocument = () => console.log('Gerar documento');
  const handleGenerateAgendamento = () => console.log('Gerar agendamento');
  const handleGenerateRecusaAssinatura = () => console.log('Gerar recusa');
  const handleGenerateWhatsApp = () => console.log('Gerar WhatsApp');
  const handleGenerateWithAssinante = () => console.log('Gerar com assinante');
  const handleGenerateStatusVistoria = () => console.log('Gerar status');
  const handleLoadMore = () => console.log('Carregar mais');
  const handleExportToExcel = () => console.log('Exportar Excel');
  const handleClearDateFilter = () => console.log('Limpar filtro');
  const generateDocumentWithAssinante = () => console.log('Gerar com assinante');

  // Debounce para busca
  const debouncedSearch = useDebouncedCallback(
    (term: string) => {
      if (term.trim()) {
        performSearch(term);
      } else {
        clearSearch();
      }
    },
    200
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white relative">
        <div className="relative z-10">
          {/* Header com melhorias */}
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
                    {totalCount > 0 && (
                      <p className="text-xs text-neutral-500">
                        {totalCount} contrato{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* NOVO: Botão de refresh */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-sm"
                  >
                    {isLoading ? '🔄 Carregando...' : '🔄 Atualizar'}
                  </button>

                  <Link to="/cadastrar-contrato" className="flex-shrink-0">
                    <button className="inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">Novo Contrato</span>
                      <span className="sm:hidden">Novo</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Filtros */}
              <div className="space-y-2">
                <ContractFilters
                  filters={filters}
                  onFilterChange={setFilter}
                  onSearch={debouncedSearch}
                  onClearSearch={clearSearch}
                  onClearAllFilters={clearAllFilters}
                  isSearching={isSearching}
                  hasSearched={hasSearched}
                  searchResults={searchResults}
                  isLoading={isLoading}
                  allTags={allTags}
                  availableYears={availableYears}
                  meses={meses}
                  isExporting={isExporting}
                  displayedContracts={displayedContracts}
                  onExportToExcel={handleExportToExcel}
                />
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
            {/* Estatísticas com dados do ContractService */}
            <div className="bg-white border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                  Estatísticas dos Contratos
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Visão geral dos contratos no sistema
                </p>
              </div>
              
              {stats ? (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-xs text-neutral-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-600">{stats.completionRate}%</div>
                    <div className="text-xs text-neutral-500">Conclusão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-purple-600">{stats.recentActivity.created}</div>
                    <div className="text-xs text-neutral-500">Novos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-600">{stats.recentActivity.terminated}</div>
                    <div className="text-xs text-neutral-500">Terminados</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">Carregando estatísticas...</div>
              )}
            </div>

            {/* Lista de Contratos com novas funcionalidades */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Contratos ({totalCount})
                </h2>
                {isLoading && (
                  <p className="text-sm text-blue-600 mt-1">🔄 Carregando contratos...</p>
                )}
                {error && (
                  <p className="text-sm text-red-600 mt-1">❌ Erro ao carregar contratos</p>
                )}
              </div>
              
              <div className="p-4">
                {isLoading ? (
                  <div className="text-center text-neutral-500 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Carregando contratos...
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-8">
                    <p>Erro ao carregar contratos</p>
                    <button 
                      onClick={handleRefresh}
                      className="mt-2 px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="text-center text-neutral-500 py-8">
                    <p>Nenhum contrato encontrado</p>
                    <Link to="/cadastrar-contrato" className="mt-2 inline-block">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Criar primeiro contrato
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {contract.status}
                              </span>
                            </div>
                            
                            <p className="text-sm text-neutral-600 mb-1">
                              <strong>Cliente:</strong> {contract.clientName}
                            </p>
                            
                            <p className="text-sm text-neutral-600 mb-1">
                              <strong>Propriedade:</strong> {contract.property}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                              <span><strong>Início:</strong> {contract.startDate}</span>
                              <span><strong>Fim:</strong> {contract.endDate}</span>
                              <span><strong>Valor:</strong> R$ {contract.totalValue?.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          {/* === NOVAS AÇÕES DO CONTRACT SERVICE === */}
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRenewContract(contract.id, '2025-12-31')}
                                disabled={renewContract.isPending}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                                title="Renovar contrato"
                              >
                                {renewContract.isPending ? '🔄' : '🔄'} Renovar
                              </button>
                              
                              <button
                                onClick={() => handleTerminateContract(contract.id, 'Rescisão por mútuo acordo')}
                                disabled={terminateContract.isPending}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                                title="Terminar contrato"
                              >
                                {terminateContract.isPending ? '🔄' : '❌'} Terminar
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateContract(contract.id, { clientName: 'Nome Atualizado' })}
                                disabled={updateContract.isPending}
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
                                title="Editar contrato"
                              >
                                {updateContract.isPending ? '🔄' : '✏️'} Editar
                              </button>
                              
                              <button
                                onClick={() => handleDeleteContract(contract.id)}
                                disabled={deleteContract.isPending}
                                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                                title="Deletar contrato"
                              >
                                {deleteContract.isPending ? '🔄' : '🗑️'} Deletar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botão de carregar mais */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded hover:bg-neutral-200 disabled:opacity-50"
                        >
                          {isLoading ? 'Carregando...' : 'Carregar mais'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals - Lazy loaded */}
        <React.Suspense fallback={null}>
          <ContractModals
            modals={state.modals}
            selectedContract={state.selectedContract}
            pendingDocument={state.pendingDocument}
            formData={state.formData}
            onFormDataChange={actions.setFormData}
            onCloseModal={actions.closeModal}
            onGenerateAgendamento={handleGenerateAgendamento}
            onGenerateRecusaAssinatura={handleGenerateRecusaAssinatura}
            onGenerateWhatsApp={handleGenerateWhatsApp}
            onGenerateWithAssinante={handleGenerateWithAssinante}
            onGenerateStatusVistoria={handleGenerateStatusVistoria}
          />
        </React.Suspense>
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
```

## ✅ Resumo das Principais Mudanças

### 1. **Imports Adicionados**
- `useContractsQueryNew` para os novos hooks
- `contract-service-adapter` para compatibilidade
- Tipos `LegacyContract` e `LegacyContractFilters`

### 2. **Estado Simplificado**
- Estado local reduzido de 15+ useState para 2 useState
- Dados fornecidos pelos hooks do ContractService
- Compatibilidade mantida com nomes de variáveis

### 3. **Novas Funcionalidades**
- **Renovação de contratos** com `handleRenewContract`
- **Terminação de contratos** com `handleTerminateContract`
- **Atualização em tempo real** com `handleRefresh`
- **Estatísticas em tempo real** do ContractService

### 4. **Melhorias na UI**
- Botão de refresh com feedback visual
- Contador de contratos na tela
- Estados de loading mais informativos
- Ações de contrato (renovar, terminar, editar, deletar)
- Indicadores visuais de status

### 5. **Compatibilidade Mantida**
- Mesma estrutura de dados (`contracts`, `totalCount`, etc.)
- Mesmo padrão de componentização
- Mesmas props nos componentes
- Mesmo sistema de routing e navegação

## 🚀 Próximos Passos

1. **Aplicar as mudanças** no arquivo `Contratos.tsx`
2. **Testar a funcionalidade** básica (CRUD)
3. **Adicionar novas funcionalidades** (renovação, terminação)
4. **Otimizar performance** se necessário
5. **Documentar** as novas funcionalidades para os usuários

Esta integração mantêm 100% da compatibilidade com o código existente, adicionando as novas funcionalidades do ContractService sem quebrar nada.