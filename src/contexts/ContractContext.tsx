/**
 * Context específico para operações de contratos
 * Elimina prop drilling e centraliza lógica de contratos
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Contract, DocumentType, VistoriaType, PersonType } from '@/types/contract';
import { useContractList } from '@/hooks/useContractList';
import { useContractModals } from '@/hooks/useContractModals';
import { useDocumentGeneration } from '@/hooks/useDocumentGeneration';
import { useStandardToast } from '@/utils/toastHelpers';
import { supabase } from '@/integrations/supabase/client';

// Interface do contexto
interface ContractContextType {
  // Estados da lista
  contracts: Contract[];
  filteredContracts: Contract[];
  displayedContracts: Contract[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  hasSearched: boolean;
  
  // Estados dos modais
  modals: ReturnType<typeof useContractModals>;
  
  // Ações da lista
  performSearch: (query: string) => void;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
  
  // Ações de contratos
  handleEdit: (contract: Contract) => void;
  handleDelete: (contractId: string) => Promise<void>;
  handleGenerateDocument: (contract: Contract, documentType: DocumentType) => void;
  handleGenerateAgendamento: (contract: Contract) => void;
  handleGenerateNPS: (contract: Contract) => void;
  handleGenerateWhatsApp: (contract: Contract, type: PersonType) => void;
  
  // Geração de documentos
  documentGeneration: ReturnType<typeof useDocumentGeneration>;
}

const ContractContext = createContext<ContractContextType | null>(null);

// Provider
export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contractList = useContractList();
  const modals = useContractModals();
  const documentGeneration = useDocumentGeneration();
  const { showSuccess, showError } = useStandardToast();

  // Ações de contratos
  const handleEdit = (contract: Contract) => {
    modals.openEditModal(contract);
  };

  const handleDelete = async (contractId: string) => {
    try {
      modals.setGeneratingDocument(`${contractId}-delete`);
      
      const { error } = await supabase
        .from('saved_terms')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      // Recarregar a lista
      await contractList.loadMore();
      showSuccess('deleted', { description: 'Contrato excluído com sucesso!' });
    } catch {
      showError('delete');
    } finally {
      modals.setGeneratingDocument(null);
    }
  };

  const handleGenerateDocument = (contract: Contract, documentType: DocumentType) => {
    // Documentos que precisam de assinante
    const documentosComAssinatura = [
      'Termo do Locador',
      'Termo do Locatário',
      'Termo de Recusa de Assinatura - E-mail',
    ];

    if (documentosComAssinatura.includes(documentType)) {
      modals.openAssinanteModal({
        contract,
        template: '', // Template será definido baseado no tipo
        documentType,
      });
    } else {
      // Gerar documento diretamente
      const enhancedData = documentGeneration.applyConjunctions(contract.form_data);
      // Lógica de geração direta
    }
  };

  const handleGenerateAgendamento = (contract: Contract) => {
    modals.openAgendamentoModal(contract);
  };

  const handleGenerateNPS = (contract: Contract) => {
    modals.openNPSModal(contract);
  };

  const handleGenerateWhatsApp = (contract: Contract, type: PersonType) => {
    modals.openWhatsAppModal(contract, type);
  };

  const contextValue: ContractContextType = {
    // Estados da lista
    contracts: contractList.contracts,
    filteredContracts: contractList.filteredContracts,
    displayedContracts: contractList.displayedContracts,
    loading: contractList.loading,
    loadingMore: contractList.loadingMore,
    hasMore: contractList.hasMore,
    hasSearched: contractList.hasSearched,
    
    // Estados dos modais
    modals,
    
    // Ações da lista
    performSearch: contractList.performSearch,
    clearSearch: contractList.clearSearch,
    loadMore: contractList.loadMore,
    
    // Ações de contratos
    handleEdit,
    handleDelete,
    handleGenerateDocument,
    handleGenerateAgendamento,
    handleGenerateNPS,
    handleGenerateWhatsApp,
    
    // Geração de documentos
    documentGeneration,
  };

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
};

// Hook personalizado
export const useContractContext = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContractContext must be used within ContractProvider');
  }
  return context;
};

// Hooks especializados para diferentes aspectos
export const useContractActions = () => {
  const context = useContractContext();
  return {
    handleEdit: context.handleEdit,
    handleDelete: context.handleDelete,
    handleGenerateDocument: context.handleGenerateDocument,
    handleGenerateAgendamento: context.handleGenerateAgendamento,
    handleGenerateNPS: context.handleGenerateNPS,
    handleGenerateWhatsApp: context.handleGenerateWhatsApp,
  };
};

export const useContractData = () => {
  const context = useContractContext();
  return {
    contracts: context.contracts,
    filteredContracts: context.filteredContracts,
    displayedContracts: context.displayedContracts,
    loading: context.loading,
    loadingMore: context.loadingMore,
    hasMore: context.hasMore,
    hasSearched: context.hasSearched,
  };
};

export const useContractSearch = () => {
  const context = useContractContext();
  return {
    performSearch: context.performSearch,
    clearSearch: context.clearSearch,
    hasSearched: context.hasSearched,
  };
};
