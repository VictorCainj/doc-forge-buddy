/**
 * Página de Contratos Otimizada para Performance
 * Implementa todas as otimizações de performance identificadas
 */

import React, { memo, useMemo, useCallback, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOptimizedFilters } from '@/hooks/useOptimizedFilters';
import { useContractList } from '@/hooks/useContractList';
import { useContractModalReducer } from '@/hooks/useContractModalReducer';
import { useDocumentGeneration } from '@/hooks/useDocumentGeneration';
import { useStandardToast } from '@/utils/toastHelpers';
import { Contract, PersonType } from '@/types/contract';

// ✅ Lazy loading de componentes pesados
const VirtualizedContractList = React.lazy(() => 
  import('@/components/optimized/VirtualizedContractList').then(module => ({
    default: module.VirtualizedContractList
  }))
);

const OptimizedSearch = React.lazy(() => 
  import('@/components/ui/optimized-search').then(module => ({
    default: module.default
  }))
);

// ✅ Componente de header memoizado
const ContractHeader = memo<{
  totalContracts: number;
  filteredCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}>(({ totalContracts, filteredCount, onRefresh, isRefreshing }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-4">
      <h2 className="text-xl font-semibold text-foreground">
        Contratos Cadastrados
      </h2>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {filteredCount} de {totalContracts} contratos
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>

    <Button asChild>
      <Link to="/cadastrar-contrato">
        <Plus className="h-4 w-4 mr-2" />
        Novo Contrato
      </Link>
    </Button>
  </div>
));

ContractHeader.displayName = 'ContractHeader';

// ✅ Componente de busca memoizado
const SearchSection = memo<{
  onSearch: (term: string) => void;
  isSearching: boolean;
  resultsCount: number;
}>(({ onSearch, isSearching, resultsCount }) => (
  <div className="mb-6">
    <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
      <OptimizedSearch
        onSearch={onSearch}
        placeholder="Digite número do contrato, nome do locatário ou endereço..."
        showResultsCount={true}
        resultsCount={resultsCount}
        className="w-full"
      />
    </Suspense>
    
    {isSearching && (
      <div className="mt-2 text-sm text-muted-foreground">
        Buscando...
      </div>
    )}
  </div>
));

SearchSection.displayName = 'SearchSection';

// ✅ Componente principal otimizado
const ContratosOptimized: React.FC = () => {
  const { showSuccess, showError } = useStandardToast();

  // ✅ Hook para dados de contratos
  const {
    contracts,
    loading,
    hasMore,
    loadMore,
    refetch,
  } = useContractList();

  // ✅ Hook para filtros otimizados
  const {
    searchTerm,
    filteredItems: filteredContracts,
    setSearchTerm,
    isFiltering,
    resultsCount,
  } = useOptimizedFilters(contracts, {
    searchFields: [
      'form_data.numeroContrato',
      'form_data.nomeLocatario',
      'form_data.primeiroLocatario',
      'form_data.enderecoImovel',
      'form_data.endereco',
      'form_data.nomeProprietario',
      'form_data.nomesResumidosLocadores',
    ],
    debounceMs: 300,
    caseSensitive: false,
  });

  // ✅ Hook para modais (usando reducer)
  const { state: modalState, actions: modalActions } = useContractModalReducer();

  // ✅ Hook para geração de documentos
  const { applyConjunctions } = useDocumentGeneration();

  // ✅ Callbacks memoizados para ações
  const handleEdit = useCallback((contract: Contract) => {
    modalActions.openEditModal(contract);
  }, [modalActions]);

  const handleDelete = useCallback(async (contractId: string) => {
    try {
      modalActions.setGeneratingDocument(`${contractId}-delete`);
      
      // Simular operação de delete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('deleted', { description: 'Contrato excluído com sucesso!' });
      refetch();
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      showError('delete');
    } finally {
      modalActions.setGeneratingDocument(null);
    }
  }, [modalActions, showSuccess, showError, refetch]);

  const handleGenerateAgendamento = useCallback((contract: Contract) => {
    modalActions.openAgendamentoModal(contract);
  }, [modalActions]);

  const handleGenerateNPS = useCallback((contract: Contract) => {
    modalActions.openNPSModal(contract);
  }, [modalActions]);

  const handleGenerateWhatsApp = useCallback((contract: Contract, type: PersonType) => {
    modalActions.openWhatsAppModal(contract, type);
  }, [modalActions]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ✅ Dados memoizados para otimizar re-renders
  const listData = useMemo(() => ({
    contracts: filteredContracts,
    loading,
    hasMore: hasMore && !searchTerm, // Não carregar mais durante busca
    onLoadMore: loadMore,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onGenerateAgendamento: handleGenerateAgendamento,
    onGenerateNPS: handleGenerateNPS,
    onGenerateWhatsApp: handleGenerateWhatsApp,
    generatingDocument: modalState.loading.generatingDocument,
  }), [
    filteredContracts,
    loading,
    hasMore,
    searchTerm,
    loadMore,
    handleEdit,
    handleDelete,
    handleGenerateAgendamento,
    handleGenerateNPS,
    handleGenerateWhatsApp,
    modalState.loading.generatingDocument,
  ]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* ✅ Header memoizado */}
          <ContractHeader
            totalContracts={contracts.length}
            filteredCount={resultsCount}
            onRefresh={handleRefresh}
            isRefreshing={loading}
          />

          {/* ✅ Busca memoizada */}
          <SearchSection
            onSearch={setSearchTerm}
            isSearching={isFiltering}
            resultsCount={resultsCount}
          />

          {/* ✅ Lista virtualizada com lazy loading */}
          <Suspense 
            fallback={
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            }
          >
            <VirtualizedContractList {...listData} />
          </Suspense>

          {/* ✅ Modais serão adicionados aqui quando implementados */}
          {/* <AgendamentoModal {...modalState.agendamento} /> */}
          {/* <NPSModal {...modalState.nps} /> */}
          {/* <EditContractModal {...modalState.edit} /> */}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default memo(ContratosOptimized);
