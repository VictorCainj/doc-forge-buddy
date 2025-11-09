import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit } from '@/utils/iconMapper';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/shared/contract';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { applyContractConjunctions } from '@/features/contracts/utils/contractConjunctions';
import { processTemplate } from '@/shared/template-processing';
import { ContractBillsSection } from '@/features/contracts/components/ContractBillsSection';
import { OptimizedSearch } from '@/components/ui/optimized-search';

const CONTRACTS_PER_PAGE = 5;

// Hook para buscar contratos do Supabase
const useContracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) {
        setContracts([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: supabaseError } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('document_type', 'contrato')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        // Mapear os dados do Supabase para o tipo Contract
        const processedContracts: Contract[] = (data || []).map((dbTerm) => {
          // Processar form_data se for string JSON
          const formData = typeof dbTerm.form_data === 'string' 
            ? JSON.parse(dbTerm.form_data) 
            : dbTerm.form_data || {};

          return {
            id: dbTerm.id,
            title: dbTerm.title || '',
            content: dbTerm.content || '',
            document_type: dbTerm.document_type || 'contrato',
            form_data: formData,
            created_at: dbTerm.created_at || '',
            updated_at: dbTerm.updated_at || '',
            user_id: dbTerm.user_id
          } as Contract;
        });
        
        setContracts(processedContracts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error('Erro ao buscar contratos');
        setError(errorMessage);
        console.error('Erro ao buscar contratos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContracts();
  }, [user]);
  
  return { data: contracts, isLoading, error };
};

// Reducer hook (removido - usar estado local)
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

// Component de lista de contratos
const ContractList = ({
  contracts,
  isLoading,
  onGenerateDocument,
  hasMore,
  onLoadMore,
}: {
  contracts: Contract[];
  isLoading: boolean;
  onGenerateDocument: (contractId: string, template: string, title: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
        <p className="text-gray-500 mb-6">Comece criando seu primeiro contrato de locação</p>
        <Link
          to="/cadastrar-contrato"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Criar Contrato
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const numeroContrato = contract.form_data?.numeroContrato || 
                              contract.form_data?.numero_contrato || 
                              '[NÚMERO NÃO DEFINIDO]';
        const nomeLocador = contract.form_data?.nomeProprietario || 
                           contract.form_data?.primeiroNomeProprietario || 
                           'Não informado';
        const nomeLocatario = contract.form_data?.nomeLocatario || 
                             contract.form_data?.primeiroLocatario || 
                             contract.form_data?.locatario_nome || 
                             'Não informado';
        const endereco = contract.form_data?.enderecoImovel || 
                        contract.form_data?.imovel_endereco || 
                        'Não informado';

        return (
          <div key={contract.id} className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header com Número do Contrato */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Contrato #{numeroContrato}
                </h3>
              </div>
            </div>

            {/* Informações do Contrato */}
            <div className="space-y-3 mb-4">
              {/* Nome do Locador */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Locador
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {nomeLocador}
                </p>
              </div>

              {/* Nome do Locatário */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Locatário
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {nomeLocatario}
                </p>
              </div>

              {/* Endereço */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Endereço
                </p>
                <p className="text-sm text-gray-700">
                  {endereco}
                </p>
              </div>
            </div>
            
            {/* Contas de Consumo */}
            <div className="mb-4 border-t border-neutral-200 pt-4">
              <ContractBillsSection
                contractId={contract.id}
                formData={contract.form_data}
              />
            </div>
            
            {/* Botões de Ação */}
            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-4">
              {/* Botão de Ações Rápidas - Esquerda */}
              <QuickActionsDropdown
                contractId={contract.id}
                contractNumber={numeroContrato}
                onGenerateDocument={onGenerateDocument}
              />
              
              {/* Botão Editar - Direita */}
              <Link
                to={`/editar-contrato/${contract.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
            </div>
          </div>
        );
      })}
      
      {/* Botão Ver Mais */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ver mais
          </button>
        </div>
      )}
    </div>
  );
};

// Component de estatísticas
const ContractStats = ({ stats }: { stats: any }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <div className="h-6 w-6 bg-yellow-600 rounded"></div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <div className="h-6 w-6 bg-green-600 rounded"></div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Concluídos</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <div className="h-6 w-6 bg-red-600 rounded"></div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Cancelados</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.cancelled || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContractFiltersProps {
  onSearch: (term: string) => void | Promise<void>;
  onClear: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  resultsCount: number;
  totalCount: number;
  resetKey: number;
}

const ContractFilters: React.FC<ContractFiltersProps> = ({
  onSearch,
  onClear,
  isLoading,
  hasSearched,
  resultsCount,
  totalCount,
  resetKey,
}) => {
  const resultMessage = hasSearched
    ? resultsCount === 0
      ? 'Nenhum contrato corresponde à sua busca.'
      : `${resultsCount} ${resultsCount === 1 ? 'contrato encontrado' : 'contratos encontrados'}.`
    : `Você possui ${totalCount} ${totalCount === 1 ? 'contrato' : 'contratos'} cadastrados.`;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm space-y-3">
      <OptimizedSearch
        key={resetKey}
        onSearch={onSearch}
        isLoading={isLoading}
        resultsCount={resultsCount}
        showResultsCount={hasSearched}
        placeholder="Busque por número, locador, locatário ou endereço"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-neutral-600">
        <p className="font-medium">{resultMessage}</p>
        {hasSearched && (
          <button
            type="button"
            onClick={onClear}
            className="text-blue-600 font-semibold hover:underline transition-colors"
          >
            Limpar busca
          </button>
        )}
      </div>
    </div>
  );
};

// Lazy load de modals (simplificado)
const ContractModals = () => null;

// Memoizar funções pesadas
const getContractDate = (contract: any) => {
  const dateStr = contract.form_data.dataInicioRescisao || contract.form_data.dataFirmamentoContrato;
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // Estado para exportação
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Reducer state (substitui ~20 useState)
  const { state, actions } = useContractReducer();

  // Hook para buscar contratos do Supabase
  const { data: contracts, isLoading, error } = useContracts();
  const [displayedContracts, setDisplayedContracts] = useState<Contract[]>(contracts);
  
  // Estado para controlar quantos contratos exibir
  const [visibleCount, setVisibleCount] = useState(CONTRACTS_PER_PAGE);
  
  const [filters, setFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [contractIndex, setContractIndex] = useState(0);
  const [favoritesSet, setFavoritesSet] = useState(new Set());
  const [allTags, setAllTags] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [meses] = useState(['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']);
  const [searchResetCounter, setSearchResetCounter] = useState(0);

  // Atualizar displayedContracts quando contracts mudar
  useEffect(() => {
    setDisplayedContracts(contracts);
    // Resetar contador visível quando novos contratos são carregados
    setVisibleCount(CONTRACTS_PER_PAGE);
  }, [contracts]);
  
  // Calcular contratos visíveis
  const visibleContracts = displayedContracts.slice(0, visibleCount);
  const hasMoreContracts = displayedContracts.length > visibleCount;
  
  // Função para carregar mais contratos
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + CONTRACTS_PER_PAGE, displayedContracts.length));
  };

  // Funções de busca e filtro
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setDisplayedContracts(contracts);
      setVisibleCount(CONTRACTS_PER_PAGE);
      setHasSearched(false);
      return;
    }
    
    const termLower = term.toLowerCase();
    const filtered = contracts.filter(contract => {
      const title = contract.title?.toLowerCase() || '';
      const locatarioNome = contract.form_data?.nomeLocatario?.toLowerCase() || 
                            contract.form_data?.locatario_nome?.toLowerCase() || 
                            contract.form_data?.primeiroLocatario?.toLowerCase() || '';
      const endereco = contract.form_data?.enderecoImovel?.toLowerCase() || 
                       contract.form_data?.imovel_endereco?.toLowerCase() || '';

      const numeroContrato = (
        contract.form_data?.numeroContrato ||
        contract.form_data?.numero_contrato ||
        ''
      ).toString().toLowerCase();

      const nomeLocador = contract.form_data?.nomeProprietario?.toLowerCase() ||
        contract.form_data?.primeiroNomeProprietario?.toLowerCase() ||
        contract.form_data?.nomeLocador?.toLowerCase() ||
        '';
      
      return [title, locatarioNome, endereco, numeroContrato, nomeLocador].some((field) =>
        field.includes(termLower)
      );
    });
    
    setDisplayedContracts(filtered);
    setVisibleCount(CONTRACTS_PER_PAGE);
    setHasSearched(true);
  }, [contracts]);
  
  const clearSearch = useCallback(() => {
    setDisplayedContracts(contracts);
    setVisibleCount(CONTRACTS_PER_PAGE);
    setHasSearched(false);
    setSearchResetCounter((prev) => prev + 1);
  }, [contracts]);
  
  const loadMore = () => {};
  const isFavorite = () => false;
  const getContractTags = () => [];
  const setFilter = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearAllFilters = () => setFilters({});
  
  // Calcular estatísticas
  const stats = React.useMemo(() => ({
    total: contracts.length,
    pending: contracts.filter(c => {
      const status = c.form_data?.status || c.form_data?.statusContrato;
      return status === 'pendente' || status === 'Pendente';
    }).length,
    completed: contracts.filter(c => {
      const status = c.form_data?.status || c.form_data?.statusContrato;
      return status === 'concluido' || status === 'Concluído' || status === 'concluído';
    }).length,
    cancelled: contracts.filter(c => {
      const status = c.form_data?.status || c.form_data?.statusContrato;
      return status === 'cancelado' || status === 'Cancelado';
    }).length
  }), [contracts]);

  // Função para gerar documentos (usada pelo QuickActionsDropdown)
  const handleGenerateDocument = useCallback(async (
    contractId: string,
    template: string,
    title: string
  ) => {
    try {
      // Buscar dados do contrato
      const { data: contractData, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !contractData) {
        showError('Erro ao carregar dados do contrato');
        return;
      }

      // Processar form_data
      const formData = typeof contractData.form_data === 'string'
        ? JSON.parse(contractData.form_data)
        : contractData.form_data || {};

      // Aplicar conjugações e processar template
      const enhancedData = applyContractConjunctions(formData);
      const processedTemplate = processTemplate(template, enhancedData);

      // Determinar o tipo de documento baseado no título
      const documentType = title;

      // Navegar para a página de gerar documento
      navigate('/gerar-documento', {
        state: {
          title: title,
          template: processedTemplate,
          formData: enhancedData,
          documentType: documentType,
          contractId: contractId,
        },
      });
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      showError('Erro ao gerar documento. Tente novamente.');
    }
  }, [navigate, showError]);
  
  const handleGenerateAgendamento = () => console.log('Gerar agendamento');
  const handleGenerateRecusaAssinatura = () => console.log('Gerar recusa');
  const handleGenerateWhatsApp = () => console.log('Gerar WhatsApp');
  const handleGenerateWithAssinante = () => console.log('Gerar com assinante');
  const handleGenerateStatusVistoria = () => console.log('Gerar status');
  const handleExportToExcel = () => console.log('Exportar Excel');
  const handleClearDateFilter = () => console.log('Limpar filtro');
  const generateDocumentWithAssinante = () => console.log('Gerar com assinante');
  
  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar contratos</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white relative">
        {/* Conteúdo principal com z-index */}
        <div className="relative z-10">
          {/* Header Compacto - Todos os elementos visíveis sem scroll */}
          <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 lg:px-8">
              {/* Linha 1: Título e Botão Novo Contrato */}
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

              {/* Linha 2: Busca e Filtros Compactos */}
              <div className="space-y-2">
                <ContractFilters
                  onSearch={performSearch}
                  onClear={clearSearch}
                  isLoading={isLoading}
                  hasSearched={hasSearched}
                  resultsCount={displayedContracts.length}
                  totalCount={contracts.length}
                  resetKey={searchResetCounter}
                />
              </div>
            </div>
          </div>

          {/* Welcome Section Compacta */}
          <div className="max-w-[1400px] mx-auto px-4 py-2 sm:px-6 lg:px-8">
            <div className="bg-white border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                  Bem-vindo,{' '}
                  <span className="inline-block text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {profile?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Usuário'}
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
            {/* Estatísticas */}
            <ContractStats stats={stats} />

            {/* Lista de Contratos */}
            <ContractList
              contracts={visibleContracts}
              isLoading={isLoading}
              onGenerateDocument={handleGenerateDocument}
              hasMore={hasMoreContracts}
              onLoadMore={handleLoadMore}
            />
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