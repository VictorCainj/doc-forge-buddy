// @ts-nocheck
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
import { NotificationAutoCreator } from '@/features/notifications/utils/notificationAutoCreator';
import { supabase } from '@/integrations/supabase/client';
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
import { useContractFavorites } from '@/hooks/useContractFavorites';
import { useContractTags } from '@/hooks/useContractTags';
import { usePreloadContracts } from '@/hooks/usePreloadContracts';
import { exportContractsToExcel } from '@/utils/exportContractsToExcel';
import { createContractIndex, filterContractsByDate } from '@/utils/contractIndex';
import { useDebouncedCallback } from '@/utils/debounce';
import { Star, Tag } from '@/utils/iconMapper';

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');

  // Hooks de favoritos e tags
  const { favoritesSet, isFavorite } = useContractFavorites();
  const { getAllTags, getContractTags } = useContractTags();
  const allTags = getAllTags();
  
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

  // Contratos exibidos (filtro de mês/ano, busca, favoritos, tags ou paginação normal) - ULTRA OTIMIZADO
  const displayedContracts = useMemo(() => {
    let contractsToDisplay = contracts;

    // Aplicar filtro de busca primeiro
    if (hasSearched && searchResults.length > 0) {
      contractsToDisplay = searchResults;
    }

    // Aplicar filtro de favoritos
    if (showFavoritesOnly) {
      contractsToDisplay = contractsToDisplay.filter((c) => isFavorite(c.id));
    }

    // Aplicar filtro de tags
    if (selectedTagFilter) {
      contractsToDisplay = contractsToDisplay.filter((c) => {
        const contractTags = getContractTags(c.id);
        return contractTags.some((t) => t.tag_name.toLowerCase() === selectedTagFilter.toLowerCase());
      });
    }

    // Aplicar filtro de mês e/ou ano usando índice (busca O(1))
    if (selectedMonth || selectedYear) {
      const month = selectedMonth ? parseInt(selectedMonth) : undefined;
      const year = selectedYear ? parseInt(selectedYear) : undefined;
      const filtered = filterContractsByDate(contractIndex, month, year);
      
      // Se há outros filtros, filtrar apenas os resultados já filtrados
      const filteredIds = new Set(filtered.map(c => c.id));
      contractsToDisplay = contractsToDisplay.filter(c => filteredIds.has(c.id));
    }

    // Early return para casos simples (sem filtros)
    if (!selectedMonth && !selectedYear && !hasSearched && !showFavoritesOnly && !selectedTagFilter) {
      return contracts;
    }

    return contractsToDisplay;
  }, [selectedMonth, selectedYear, hasSearched, searchResults, contracts, contractIndex, showFavoritesOnly, selectedTagFilter, isFavorite, getContractTags]);

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

  const handleGenerateAgendamento = useCallback(async () => {
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

    // Registrar agendamento na tabela vistoria_analises e criar notificação
    try {
      const contractNumber = state.selectedContract.form_data?.numeroContrato || 'N/A';
      // Usar a data formatada ou a data original se não houver formatação
      const vistoriaDate = dataVistoriaFormatada || state.formData.dataVistoria;
      const vistoriaType = state.formData.tipoVistoria === 'revistoria' ? 'revistoria' : 'vistoria final';
      
      // Preparar dados da vistoria para salvar no banco
      const dadosVistoria = {
        locatario: state.selectedContract.form_data?.nomeLocatario || '',
        endereco: state.selectedContract.form_data?.enderecoImovel || '',
        dataVistoria: state.formData.dataVistoria, // Data no formato ISO (YYYY-MM-DD)
        tipoVistoria: state.formData.tipoVistoria === 'revistoria' ? 'revistoria' : 'final', // Garantir que está no formato correto
        responsavel: enhancedData.nomeVistoriador || 'David Issa',
        observacoes: `Vistoria agendada para ${dataVistoriaFormatada} às ${state.formData.horaVistoria}`,
      };

      // Criar entrada na tabela vistoria_analises para registrar o agendamento
      const { data: vistoriaData, error: vistoriaError } = await supabase
        .from('vistoria_analises')
        .insert({
          title: `Agendamento ${tipoVistoriaTexto} - ${contractNumber}`,
          contract_id: state.selectedContract.id,
          dados_vistoria: dadosVistoria,
          apontamentos: [], // Ainda sem apontamentos, será preenchido quando a vistoria for realizada
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (vistoriaError) {
        console.error('Erro ao registrar agendamento no banco:', vistoriaError);
        // Continuar mesmo se falhar o registro no banco
      } else {
        console.log('Agendamento registrado no banco:', vistoriaData.id);
        
        // Criar notificação com o ID real da vistoria
        await NotificationAutoCreator.onVistoriaScheduled(
          vistoriaData.id,
          state.selectedContract.id,
          contractNumber,
          vistoriaDate,
          vistoriaType
        );
      }
    } catch (error) {
      console.warn('Erro ao criar notificação de vistoria agendada (não crítico):', error);
    }

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
                  <PremiumButton icon={<Plus className="text-white" />} variant="primary" className="h-9 sm:h-10 px-3 sm:px-4 text-sm text-white">
                    <span className="hidden sm:inline text-white">Novo Contrato</span>
                    <span className="sm:hidden text-white">Novo</span>
                  </PremiumButton>
                </Link>
              </div>

              {/* Linha 2: Busca e Filtros Compactos */}
              <div className="space-y-2">
                {/* Campo de Busca */}
                <div className="flex-shrink-0">
                  <OptimizedSearch
                    onSearch={performSearch}
                    placeholder="Buscar contratos..."
                    showResultsCount={true}
                    resultsCount={totalResults}
                    isLoading={isSearching}
                    className="w-full"
                  />
                </div>

                {/* Filtros em Grid Responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {/* Filtro de Favoritos */}
                  <Button
                    variant={showFavoritesOnly ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`h-9 bg-white rounded-lg border border-neutral-300 transition-all duration-200 font-medium text-xs sm:text-sm ${
                      showFavoritesOnly
                        ? 'border-amber-300/50 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-white/20 hover:border-white/30 text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                    }`}
                    aria-label={showFavoritesOnly ? 'Mostrar todos os contratos' : 'Mostrar apenas favoritos'}
                  >
                    <Star className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${showFavoritesOnly ? 'fill-current' : ''} sm:mr-1.5`} />
                    <span className="hidden sm:inline">Favoritos</span>
                  </Button>

                  {/* Filtro de Tags */}
                  {allTags.length > 0 && (
                    <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
                      <SelectTrigger 
                        className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
                        aria-label="Filtrar por tag"
                      >
                        <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                        <SelectValue placeholder="Tags" className="text-xs sm:text-sm" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200">
                        <SelectItem 
                          value="" 
                          className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
                        >
                          Todas as tags
                        </SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem
                            key={tag.id}
                            value={tag.tag_name}
                            className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer flex items-center gap-2 text-sm"
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.tag_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Filtro de Mês */}
                  <Select
                    value={selectedMonth}
                    onValueChange={debouncedSetMonth}
                  >
                    <SelectTrigger 
                      className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
                      aria-label="Selecione o mês"
                    >
                      <SelectValue placeholder="Mês" className="text-xs sm:text-sm" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      {meses.map((mes, index) => (
                        <SelectItem
                          key={index}
                          value={(index + 1).toString()}
                          className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
                        >
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro de Ano */}
                  <Select
                    value={selectedYear}
                    onValueChange={debouncedSetYear}
                  >
                    <SelectTrigger 
                      className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-neutral-700 font-medium text-xs sm:text-sm"
                      aria-label="Selecione o ano"
                    >
                      <SelectValue placeholder="Ano" className="text-xs sm:text-sm" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      {availableYears.map((year) => (
                        <SelectItem 
                          key={year} 
                          value={year.toString()} 
                          className="hover:bg-purple-50 transition-colors duration-150 cursor-pointer text-sm"
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Botão Limpar Filtros */}
                  {(selectedMonth || selectedYear || showFavoritesOnly || selectedTagFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleClearDateFilter();
                        setShowFavoritesOnly(false);
                        setSelectedTagFilter('');
                      }}
                      className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-200 font-medium text-xs sm:text-sm col-span-2 lg:col-span-1"
                      aria-label="Limpar todos os filtros"
                    >
                      <span className="hidden sm:inline">Limpar</span>
                      <span className="sm:hidden">Limpar</span>
                    </Button>
                  )}

                  {/* Botão Limpar Busca */}
                  {hasSearched && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="h-9 bg-white rounded-lg border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-300 font-medium text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Limpar Busca</span>
                      <span className="sm:hidden">Busca</span>
                    </Button>
                  )}

                  {/* Botão Exportar Excel */}
                  {displayedContracts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportToExcel}
                      disabled={isExporting || displayedContracts.length === 0}
                      className="h-9 bg-white rounded-lg border border-success-300 hover:border-success-400 text-success-700 hover:text-success-800 hover:bg-success-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm col-span-2 lg:col-span-1"
                      title={`Exportar ${displayedContracts.length} contrato(s) para Excel`}
                    >
                      {isExporting ? (
                        <div className="flex items-center gap-1.5">
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent"></div>
                          <span className="hidden sm:inline text-xs">Exportando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-xs">Exportar</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
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
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
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
