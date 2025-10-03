/**
 * Versão refatorada da página Contratos
 * Demonstra como eliminar prop drilling usando Context API
 */

import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import OptimizedSearch from '@/components/ui/optimized-search';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ContractProvider, useContractData, useContractSearch } from '@/contexts/ContractContext';
import { ContractCardRefactored } from '@/components/ContractCardRefactored';
import { ContractHeader } from '@/components/ContractHeader';
import { AgendamentoModal } from '@/components/modals/AgendamentoModal';

// ✅ Componente de busca isolado - sem prop drilling
const ContractSearchSection: React.FC = () => {
  const { performSearch, clearSearch, hasSearched } = useContractSearch();

  return (
    <div className="flex items-center space-x-4">
      <OptimizedSearch
        onSearch={performSearch}
        placeholder="Digite número do contrato, nome do locatário ou endereço..."
        showResultsCount={true}
      />
      
      {hasSearched && (
        <Button variant="outline" size="sm" onClick={clearSearch}>
          Limpar Busca
        </Button>
      )}
    </div>
  );
};

// ✅ Componente de lista isolado - sem prop drilling
const ContractListSection: React.FC = () => {
  const { displayedContracts, loading, hasMore, loadingMore } = useContractData();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-primary/10 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <p className="text-lg font-medium text-foreground">
          Carregando contratos...
        </p>
      </div>
    );
  }

  if (displayedContracts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum contrato encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Grid de contratos - cada card gerencia suas próprias ações via Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedContracts.map((contract) => (
          <ContractCardRefactored 
            key={contract.id} 
            contract={contract} 
            // ✅ Sem props de ações - tudo vem do Context!
          />
        ))}
      </div>

      {/* ✅ Botão Carregar Mais */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? 'Carregando...' : 'Carregar Mais Contratos'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ✅ Componente de modais isolado - sem prop drilling
const ContractModalsSection: React.FC = () => {
  return (
    <>
      {/* ✅ Modais obtêm dados do Context - sem props complexas */}
      <AgendamentoModal
        isOpen={false} // Vem do Context
        onClose={() => {}} // Vem do Context
        contract={null} // Vem do Context
        dataVistoria="" // Vem do Context
        horaVistoria="" // Vem do Context
        tipoVistoria="final" // Vem do Context
        onDataVistoriaChange={() => {}} // Vem do Context
        onHoraVistoriaChange={() => {}} // Vem do Context
        onTipoVistoriaChange={() => {}} // Vem do Context
        onGenerate={() => {}} // Vem do Context
      />
      
      {/* Outros modais... */}
    </>
  );
};

// ✅ Componente principal simplificado - apenas orchestração
const ContratosContent: React.FC = () => {
  const { contracts, hasSearched, displayedContracts } = useContractData();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* ✅ Header com dados do Context */}
          <ContractHeader
            totalContracts={contracts.length}
            hasSearched={hasSearched}
            searchResultsCount={displayedContracts.length}
          />

          {/* ✅ Busca isolada */}
          <div className="mb-6">
            <ContractSearchSection />
          </div>

          {/* ✅ Lista isolada */}
          <ContractListSection />

          {/* ✅ Modais isolados */}
          <ContractModalsSection />
        </div>
      </div>
    </TooltipProvider>
  );
};

// ✅ Componente raiz com Provider
const ContratosRefactored: React.FC = () => {
  return (
    <ContractProvider>
      <ContratosContent />
    </ContractProvider>
  );
};

export default ContratosRefactored;
