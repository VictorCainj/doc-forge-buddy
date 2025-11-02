import React, { useMemo, useCallback, useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { useStandardToast } from '@/utils/toastHelpers';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/dateFormatter';
import { FileText, Plus, Download } from '@/utils/iconMapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TemplateProcessor } from '@/utils/templateProcessor';
import { Contract } from '@/types/contract';
import { applyContractConjunctions } from '@/features/contracts/utils/contractConjunctions';
import { processTemplate } from '@/shared/template-processing';
import {
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  EMAIL_CONVITE_VISTORIA_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  STATUS_VISTORIA_WHATSAPP_TEMPLATE,
} from '@/templates/documentos';
import { ContractList } from '@/features/contracts/components';
import { splitNames } from '@/utils/nameHelpers';
import { useContractReducer } from '@/features/contracts/hooks/useContractReducer';
import OptimizedSearch from '@/components/ui/optimized-search';
import { useAuth } from '@/hooks/useAuth';
import { exportContractsToExcel } from '@/utils/exportContractsToExcel';
import { createContractIndex, filterContractsByDate } from '@/utils/contractIndex';
import { usePreloadContracts } from '@/hooks/usePreloadContracts';
import { useDebouncedCallback } from '@/utils/debounce';
import { ContractStats } from '@/features/contracts/components/ContractStats';

// Lazy load de modals para code splitting
const ContractModals = lazy(() => import('@/features/contracts/components').then(m => ({ default: m.ContractModals })));

// Memoizar funções pesadas
const getContractDate = (contract: Contract) => {
  const dateStr = contract.form_data.dataInicioRescisao || contract.form_data.dataFirmamentoContrato;
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // Estados para filtro de mês e ano
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Pré-carregamento de contratos em background
  usePreloadContracts({
    enabled: true,
    maxContracts: 50,
    priority: 'low',
  });

  // Reducer state (substitui ~20 useState)
  const { state, actions } = useContractReducer();

  // Sistema de busca otimizado
  const {
    results: searchResults,
    isLoading: isSearching,
    hasSearched,
    totalResults,
    performSearch,
    clearSearch,
  } = useOptimizedSearch({
    documentType: 'contrato',
    searchFields: ['numeroContrato', 'nomeLocatario', 'enderecoImovel'],
    maxResults: 100,
  });

  // Dados principais - quando há filtros de data, usar limite maior
  const hasDateFilters = selectedMonth || selectedYear;
  const {
    data: contracts,
    loading,
    hasMore,
    loadMore,
    totalCount,
  } = useOptimizedData({
    documentType: 'contrato',
    limit: hasDateFilters ? 1000 : 6,
    placeholderData: (previousData) => previousData, // Substituir keepPreviousData
  });

  // Índice de contratos para busca rápida O(1) - DEVE VIR DEPOIS DA DECLARAÇÃO DE contracts
  const contractIndex = useMemo(() => {
    return createContractIndex(contracts);
  }, [contracts]);

  // Contratos exibidos (filtro de mês/ano, busca ou paginação normal) - ULTRA OTIMIZADO
  const displayedContracts = useMemo(() => {
    // Early return para casos simples
    if (!selectedMonth && !selectedYear && !hasSearched) {
      return contracts;
    }

    let contractsToDisplay = contracts;

    // Aplicar filtro de busca primeiro
    if (hasSearched && searchResults.length > 0) {
      contractsToDisplay = searchResults;
    }

    // Aplicar filtro de mês e/ou ano usando índice (busca O(1))
    if (selectedMonth || selectedYear) {
      const month = selectedMonth ? parseInt(selectedMonth) : undefined;
      const year = selectedYear ? parseInt(selectedYear) : undefined;
      const filtered = filterContractsByDate(contractIndex, month, year);
      
      // Se há busca, filtrar apenas os resultados da busca
      if (hasSearched && searchResults.length > 0) {
        const filteredIds = new Set(filtered.map(c => c.id));
        contractsToDisplay = contractsToDisplay.filter(c => filteredIds.has(c.id));
      } else {
        contractsToDisplay = filtered;
      }
    }

    return contractsToDisplay;
  }, [selectedMonth, selectedYear, hasSearched, searchResults, contracts, contractIndex]);

  // ============================================================
  // DOCUMENT GENERATION HANDLERS
  // ============================================================

  // Debounce para busca com 200ms (mais responsivo)
  const debouncedSearch = useDebouncedCallback(
    useCallback((term: string) => {
      if (term.trim()) {
        performSearch(term);
      } else {
        clearSearch();
      }
    }, [performSearch, clearSearch]),
    200
  );

  const generateDocumentWithAssinante = useCallback(
    (
      contract: Contract,
      template: string,
      documentType: string,
      assinante: string
    ) => {
      const formData = contract.form_data;
      const enhancedData = applyContractConjunctions(formData);
      enhancedData.assinanteSelecionado = assinante;

      // Adicionar lógica específica por tipo de documento
      if (documentType.includes('Notificação de Agendamento')) {
        enhancedData.dataAtual = formatDateBrazilian(new Date());
        enhancedData.dataVistoria = state.formData.dataVistoria;
        enhancedData.horaVistoria = state.formData.horaVistoria;
        enhancedData.tipoVistoria = state.formData.tipoVistoria;

        const tipoVistoriaTexto =
          state.formData.tipoVistoria === 'revistoria'
            ? 'Revistoria'
            : 'Vistoria Final';
        enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
        enhancedData.tipoVistoriaTextoMinusculo =
          tipoVistoriaTexto.toLowerCase();
        enhancedData.tipoVistoriaTextoMaiusculo =
          tipoVistoriaTexto.toUpperCase();
      }

      if (documentType.includes('WhatsApp')) {
        const primeiroNome = state.formData.selectedPerson.split(' ')[0];
        const primeiroNomeCapitalizado =
          primeiroNome.charAt(0).toUpperCase() +
          primeiroNome.slice(1).toLowerCase();

        if (state.formData.whatsAppType === 'locador') {
          const generoProprietario = formData.generoProprietario;
          const tratamento =
            generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
          enhancedData.saudacaoProprietario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
        } else {
          const generoLocatario = formData.generoLocatario;
          const tratamento =
            generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
          enhancedData.saudacaoLocatario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
        }
      }

      if (documentType === 'Distrato de Contrato de Locação') {
        // Compatibilidade: verificar tanto tipoGarantia quanto temFiador
        const temFiadores =
          formData.tipoGarantia === 'Fiador' || formData.temFiador === 'sim';
        const fiadores: string[] = [];

        if (temFiadores && formData.nomeFiador) {
          const nomesFiadores = splitNames(formData.nomeFiador);
          fiadores.push(...nomesFiadores);
        }

        enhancedData.temFiadores = temFiadores ? 'sim' : 'nao';
        enhancedData.fiador1 = fiadores[0] || '';
        enhancedData.fiador2 = fiadores[1] || '';
        enhancedData.fiador3 = fiadores[2] || '';
        enhancedData.fiador4 = fiadores[3] || '';
        enhancedData.temFiador2 = fiadores.length > 1 ? 'sim' : 'nao';
        enhancedData.temFiador3 = fiadores.length > 2 ? 'sim' : 'nao';
        enhancedData.temFiador4 = fiadores.length > 3 ? 'sim' : 'nao';
      }

      const processedTemplate = TemplateProcessor.processTemplate(
        template,
        enhancedData
      );

      setTimeout(() => {
        navigate('/gerar-documento', {
          state: {
            title: documentType,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType,
          },
        });
        actions.setLoading('generating', null);
      }, 800);
    },
    [state.formData, actions, navigate]
  );

  const generateDocument = useCallback(
    (contract: Contract, template: string, documentType: string) => {
      actions.setLoading('generating', `${contract.id}-${documentType}`);
      const formData = contract.form_data;

      const documentosSemAssinatura = [
        'Notificação de Desocupação e Agendamento de Vistoria',
        'Devolutiva Locatário',
        'Devolutiva Cobrança de Consumo',
        'Cobrança de Consumo',
        'Devolutiva Caderninho',
        'Caderninho',
        'Notificação de Desocupação - Comercial',
        'Distrato de Contrato de Locação',
        'Notificação de Agendamento',
      ];

      if (documentType === 'Termo do Locador') {
        navigate('/termo-locador', { state: { contractData: formData } });
      } else if (documentType === 'Termo do Locatário') {
        navigate('/termo-locatario', { state: { contractData: formData } });
      } else if (
        documentType === 'Termo de Recusa de Assinatura - E-mail' ||
        documentType === 'Termo de Recusa de Assinatura - PDF'
      ) {
        actions.selectContract(contract);
        actions.setPendingDocument({ contract, template, documentType });
        actions.openModal('recusaAssinatura');
      } else if (documentType === 'Notificação de Agendamento') {
        actions.selectContract(contract);
        actions.openModal('agendamento');
      } else if (documentType === 'Status Vistoria') {
        actions.selectContract(contract);
        actions.openModal('statusVistoria');
        actions.setLoading('generating', null);
      } else if (
        documentType === 'Devolutiva Locador WhatsApp' ||
        documentType === 'Devolutiva Locatário WhatsApp' ||
        documentType === 'WhatsApp - Proprietária' ||
        documentType === 'WhatsApp - Locatária'
      ) {
        actions.selectContract(contract);
        const whatsAppType =
          documentType === 'Devolutiva Locatário WhatsApp' ||
          documentType === 'WhatsApp - Locatária'
            ? 'locatario'
            : 'locador';
        actions.setFormData('whatsAppType', whatsAppType);
        actions.setFormData('selectedPerson', '');
        actions.openModal('whatsapp');
        actions.setLoading('generating', null);
      } else if (documentosSemAssinatura.includes(documentType)) {
        const enhancedData = applyContractConjunctions(formData);
        const processedTemplate = processTemplate(template, enhancedData);
        let documentTitle = `${documentType} - ${contract.title}`;
        if (documentType === 'Devolutiva Comercial') {
          documentTitle = `${documentType} - Rescisão - ${contract.title}`;
        }

        setTimeout(() => {
          navigate('/gerar-documento', {
            state: {
              title: documentTitle,
              template: processedTemplate,
              formData: enhancedData,
              documentType: documentType,
            },
          });
          actions.setLoading('generating', null);
        }, 800);
      } else {
        actions.setPendingDocument({ contract, template, documentType });
        actions.openModal('assinante');
        actions.setLoading('generating', null);
      }
    },
    [actions, navigate]
  );

  // ============================================================
  // MODAL HANDLERS
  // ============================================================

  const handleGenerateAgendamento = useCallback(() => {
    if (
      !state.selectedContract ||
      !state.formData.dataVistoria ||
      !state.formData.horaVistoria
    ) {
      showError('validation', {
        description: 'Por favor, preencha a data e hora da vistoria',
      });
      return;
    }

    const formData = state.selectedContract.form_data;
    const enhancedData = applyContractConjunctions(formData);
    enhancedData.dataAtual = formatDateBrazilian(new Date());

    // Processar data da vistoria
    let dataVistoriaFormatada = state.formData.dataVistoria;
    if (state.formData.dataVistoria.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = state.formData.dataVistoria.split('-');
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      dataVistoriaFormatada = formatDateBrazilian(dateObj);
    } else {
      dataVistoriaFormatada = convertDateToBrazilian(
        state.formData.dataVistoria
      );
    }

    enhancedData.dataVistoria = dataVistoriaFormatada;
    enhancedData.horaVistoria = state.formData.horaVistoria;
    enhancedData.tipoVistoria = state.formData.tipoVistoria;

    const tipoVistoriaTexto =
      state.formData.tipoVistoria === 'revistoria'
        ? 'Revistoria'
        : 'Vistoria Final';
    enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
    enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
    enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

    const processedTemplate = processTemplate(
      NOTIFICACAO_AGENDAMENTO_TEMPLATE,
      enhancedData
    );
    const documentTitle = `Notificação de Agendamento - ${tipoVistoriaTexto} - ${state.selectedContract.title}`;

    // Gerar também o e-mail de convite para Vistoria Final e Revistoria
    let secondaryTemplate: string | null = null;
    if (
      state.formData.tipoVistoria === 'final' ||
      state.formData.tipoVistoria === 'revistoria'
    ) {
      // Sempre definir David Issa como responsável técnico
      enhancedData.nomeVistoriador = 'David Issa';
      secondaryTemplate = processTemplate(
        EMAIL_CONVITE_VISTORIA_TEMPLATE,
        enhancedData
      );
    }

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        secondaryTemplate: secondaryTemplate,
        formData: enhancedData,
        documentType: 'Notificação de Agendamento',
      },
    });

    actions.closeModal('agendamento');
    actions.selectContract(null);
    actions.resetFormData();
  }, [state, actions, navigate, showError]);

  const handleGenerateRecusaAssinatura = useCallback(() => {
    if (
      !state.selectedContract ||
      !state.formData.dataRealizacaoVistoria ||
      !state.formData.assinanteSelecionado ||
      !state.pendingDocument
    ) {
      showError('validation', {
        description: 'Por favor, preencha todos os campos',
      });
      return;
    }

    const formData = state.selectedContract.form_data;
    const enhancedData = applyContractConjunctions(formData);
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataRealizacaoVistoria = state.formData.dataRealizacaoVistoria;
    enhancedData.assinanteSelecionado = state.formData.assinanteSelecionado;

    const tipoVistoriaTexto =
      state.formData.tipoVistoriaRecusa === 'revistoria'
        ? 'revistoria'
        : 'vistoria';
    enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
    enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
    enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

    // Usar dataRealizacaoVistoria como dataVistoria para o template
    enhancedData.dataVistoria = state.formData.dataRealizacaoVistoria;

    // Usar o template correto baseado no tipo de documento
    const template = state.pendingDocument.template;
    const documentType = state.pendingDocument.documentType;

    const processedTemplate = processTemplate(template, enhancedData);
    const documentTitle = `${documentType} - ${state.selectedContract.title}`;

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: documentType,
      },
    });

    actions.closeModal('recusaAssinatura');
    actions.selectContract(null);
    actions.setPendingDocument(null);
    actions.resetFormData();
  }, [state, actions, navigate, showError]);

  const handleGenerateStatusVistoria = useCallback(() => {
    if (!state.selectedContract || !state.formData.assinanteSelecionado) {
      showError('validation', {
        description: 'Por favor, selecione o assinante',
      });
      return;
    }

    const formData = state.selectedContract.form_data;
    const enhancedData = applyContractConjunctions(formData);
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.statusVistoria = state.formData.statusVistoria;
    enhancedData.assinanteSelecionado = state.formData.assinanteSelecionado;
    enhancedData.enderecoImovel =
      formData.endereco || formData.enderecoImovel || '[ENDEREÇO]';
    enhancedData.numeroContrato =
      formData.numeroContrato || '[NÚMERO DO CONTRATO]';

    const primeiroNomeLocatario = (formData.nomeLocatario || '').split(' ')[0];
    enhancedData.primeiroNomeLocatario = primeiroNomeLocatario;
    enhancedData.saudacaoLocatario = primeiroNomeLocatario
      ? `Olá, ${primeiroNomeLocatario}`
      : 'Olá';

    const processedTemplate = processTemplate(
      STATUS_VISTORIA_WHATSAPP_TEMPLATE,
      enhancedData
    );
    const documentTitle = `Status Vistoria - ${state.selectedContract.title}`;

    setTimeout(() => {
      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: 'Status Vistoria',
        },
      });
    }, 800);

    actions.closeModal('statusVistoria');
    actions.selectContract(null);
    actions.resetFormData();
  }, [state, actions, navigate, showError]);

  const handleGenerateWhatsApp = useCallback(() => {
    if (
      !state.selectedContract ||
      !state.formData.selectedPerson ||
      !state.formData.whatsAppType ||
      !state.formData.assinanteSelecionado
    ) {
      toast.error('Por favor, selecione uma pessoa e um assinante');
      return;
    }

    const formData = state.selectedContract.form_data;
    const enhancedData = {
      ...applyContractConjunctions(formData),
      assinanteSelecionado: state.formData.assinanteSelecionado,
    } as Record<string, string>;

    const primeiroNome = state.formData.selectedPerson.split(' ')[0];
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();

    if (state.formData.whatsAppType === 'locador') {
      const generoProprietario = formData.generoProprietario;
      const tratamento =
        generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
      enhancedData.saudacaoProprietario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
    } else {
      const generoLocatario = formData.generoLocatario;
      const tratamento = generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
      enhancedData.saudacaoLocatario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
    }

    const template =
      state.formData.whatsAppType === 'locador'
        ? DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE
        : DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE;

    const processedTemplate = processTemplate(template, enhancedData);
    const documentTitle = `Devolutiva ${state.formData.whatsAppType === 'locador' ? 'Locador' : 'Locatário'} WhatsApp - ${state.selectedContract.title}`;

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: `Devolutiva ${state.formData.whatsAppType === 'locador' ? 'Locador' : 'Locatário'} WhatsApp`,
      },
    });

    actions.closeModal('whatsapp');
    actions.selectContract(null);
    actions.resetFormData();
  }, [state, actions, navigate]);

  const handleGenerateWithAssinante = useCallback(() => {
    if (!state.pendingDocument || !state.formData.assinanteSelecionado) {
      toast.error('Por favor, selecione um assinante');
      return;
    }

    if (state.pendingDocument.contract) {
      generateDocumentWithAssinante(
        state.pendingDocument.contract,
        state.pendingDocument.template,
        state.pendingDocument.documentType,
        state.formData.assinanteSelecionado
      );
    }

    actions.closeModal('assinante');
    actions.setPendingDocument(null);
    actions.resetFormData();
  }, [state, actions, generateDocumentWithAssinante]);

  const handleLoadMore = useCallback(async () => {
    actions.setLoading('loadMore', true);
    try {
      await loadMore();
      actions.setPage(state.currentPage + 1);
    } finally {
      actions.setLoading('loadMore', false);
    }
  }, [loadMore, actions, state.currentPage]);

  // Debounce para filtros de data (evitar recálculos desnecessários)
  const debouncedSetMonth = useDebouncedCallback((month: string) => {
    setSelectedMonth(month);
  }, 300);

  const debouncedSetYear = useDebouncedCallback((year: string) => {
    setSelectedYear(year);
  }, 300);

  // Handler para limpar filtro de mês/ano
  const handleClearDateFilter = useCallback(() => {
    setSelectedMonth('');
    setSelectedYear('');
  }, []);

  // Handler para exportar contratos para Excel
  const handleExportToExcel = useCallback(async () => {
    if (displayedContracts.length === 0) {
      toast.error('Não há contratos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      await exportContractsToExcel(displayedContracts, {
        selectedMonth,
        selectedYear,
        hasSearched,
      });

      toast.success(
        `${displayedContracts.length} contrato(s) exportado(s) com sucesso!`,
        {
          description: 'O arquivo Excel foi baixado automaticamente',
        }
      );
    } catch (error) {
      console.error('Erro ao exportar contratos:', error);
      toast.error('Erro ao exportar contratos', {
        description: 'Tente novamente.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [displayedContracts, selectedMonth, selectedYear, hasSearched]);

  // Gerar lista de anos (últimos 5 anos + próximos 2 anos)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years.reverse();
  }, []);

  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen ai-gradient-bg relative">

        {/* Conteúdo principal com z-index */}
        <div className="relative z-10">
          {/* Header Modernizado com Glassmorphism */}
          <div className="ai-header-glass sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="icon-container w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center scale-on-hover glow-border shadow-lg">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 -z-10" />
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        <span className="animate-gradient-text">Contratos</span>
                      </h1>
                      <p className="text-neutral-600 mt-1.5 text-sm sm:text-base font-medium">
                        Gerencie todos os contratos de locação
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <OptimizedSearch
                      onSearch={performSearch}
                      placeholder="Buscar contratos..."
                      showResultsCount={true}
                      resultsCount={totalResults}
                      isLoading={isSearching}
                      className="w-80 glass-card-enhanced rounded-xl"
                    />

                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedMonth}
                        onValueChange={debouncedSetMonth}
                      >
                        <SelectTrigger className="w-[140px] h-10 ai-select-glass rounded-xl font-medium">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="glass-card-enhanced">
                          {meses.map((mes, index) => (
                            <SelectItem
                              key={index}
                              value={(index + 1).toString()}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                            >
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={selectedYear}
                        onValueChange={debouncedSetYear}
                      >
                        <SelectTrigger className="w-[120px] h-10 ai-select-glass rounded-xl font-medium">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent className="glass-card-enhanced">
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(selectedMonth || selectedYear) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearDateFilter}
                          className="h-10 px-4 text-neutral-600 hover:text-neutral-900 hover:bg-white/80 rounded-xl transition-all duration-300"
                          aria-label="Limpar filtro de data"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>

                    {hasSearched && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSearch}
                        className="inline-flex items-center gap-2 px-4 py-2 h-10 rounded-xl glass-card-enhanced hover:bg-white/90 text-neutral-700 transition-all duration-300"
                      >
                        Limpar
                      </Button>
                    )}

                    {displayedContracts.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToExcel}
                        disabled={isExporting || displayedContracts.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 h-10 rounded-xl glass-card-enhanced hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 text-emerald-700 border-emerald-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Exportar ${displayedContracts.length} contrato(s) para Excel`}
                      >
                        {isExporting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-300 border-t-emerald-700"></div>
                            <span className="hidden sm:inline">
                              Exportando...
                            </span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              Exportar Excel
                            </span>
                          </>
                        )}
                      </Button>
                    )}

                    <Link to="/cadastrar-contrato">
                      <PremiumButton icon={<Plus />} variant="primary">
                        Novo Contrato
                      </PremiumButton>
                    </Link>
                  </div>
              </div>
            </div>
          </div>
        </div>

          {/* Welcome Section Reformulada */}
          <div className="max-w-[1400px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="gradient-border-animated">
              <div className="glass-card-enhanced flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8 p-8 sm:p-10 rounded-[14px]">
                <div className="flex flex-col gap-4">
                  <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                    Bem-vindo,{' '}
                    <span className="animate-gradient-text inline-block text-4xl sm:text-5xl">
                      {profile?.full_name ||
                        user?.email?.split('@')[0] ||
                        'Usuário'}
                    </span>
                  </h2>
                  <p className="text-lg sm:text-xl text-neutral-700 font-semibold">
                    Com quais contratos iremos trabalhar hoje?
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <p className="text-sm sm:text-base text-neutral-600 font-semibold uppercase tracking-wider">
                    Hoje
                  </p>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                    <div className="relative bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/50 shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold relative">
                        <span className="animate-gradient-text text-2xl sm:text-3xl">
                          {formatDateBrazilian(new Date())}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Estatísticas de Contratos */}
            <ContractStats contracts={displayedContracts} />
            
            {/* Lista de Contratos */}
            <ContractList
              contracts={displayedContracts}
              isLoading={loading}
              hasMore={hasMore}
              loadMore={handleLoadMore}
              isLoadingMore={state.loading.loadMore}
              totalCount={totalCount}
              displayedCount={displayedContracts.length}
              hasSearched={hasSearched}
              onGenerateDocument={generateDocument}
            />
          </div>
        </div>

        {/* Modals - Lazy loaded */}
        <Suspense fallback={null}>
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
        </Suspense>
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
