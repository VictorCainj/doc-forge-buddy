import React, { useMemo, useCallback, useState } from 'react';
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
import { ContractList, ContractModals } from '@/features/contracts/components';
import { splitNames } from '@/utils/nameHelpers';
import { useContractReducer } from '@/features/contracts/hooks/useContractReducer';
import OptimizedSearch from '@/components/ui/optimized-search';
import { useAuth } from '@/hooks/useAuth';
import { exportContractsToExcel } from '@/utils/exportContractsToExcel';

const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();
  const { profile, user } = useAuth();

  // Estados para filtro de mês e ano
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

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
    limit: hasDateFilters ? 1000 : 6, // Carregar mais quando há filtros de data
  });

  // Contratos exibidos (filtro de mês/ano, busca ou paginação normal)
  const displayedContracts = useMemo(() => {
    let contractsToDisplay = contracts;

    // Aplicar filtro de busca primeiro
    if (hasSearched && searchResults.length > 0) {
      contractsToDisplay = searchResults;
    }

    // Função para parsear data brasileira (DD/MM/YYYY) - mesmo padrão usado na criação
    const parseBrazilianDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;

      // Se a data está no formato brasileiro DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [dia, mes, ano] = dateStr.split('/');
        const parsedDate = new Date(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia)
        );

        // Validar se a data é válida
        if (isNaN(parsedDate.getTime())) {
          return null;
        }

        return parsedDate;
      } else {
        // Se já está no formato ISO ou outro formato
        const parsedDate = new Date(dateStr);

        // Validar se a data é válida
        if (isNaN(parsedDate.getTime())) {
          return null;
        }

        return parsedDate;
      }
    };

    // Aplicar filtro de mês e/ou ano se selecionados
    if (selectedMonth || selectedYear) {
      contractsToDisplay = contractsToDisplay.filter((contract) => {
        // Só considerar contratos com dataInicioRescisao válida
        if (!contract.form_data?.dataInicioRescisao) {
          return false; // Excluir contratos sem dataInicioRescisao
        }

        const contractDate = parseBrazilianDate(
          contract.form_data.dataInicioRescisao
        );

        // Se não conseguiu parsear, excluir do resultado
        if (!contractDate || isNaN(contractDate.getTime())) {
          return false;
        }

        const currentYear = new Date().getFullYear();

        if (selectedMonth && selectedYear) {
          // Ambos selecionados: filtrar por mês e ano específicos
          return (
            contractDate.getMonth() + 1 === parseInt(selectedMonth) &&
            contractDate.getFullYear() === parseInt(selectedYear)
          );
        } else if (selectedMonth) {
          // Apenas mês selecionado: filtrar por mês do ano atual
          return (
            contractDate.getMonth() + 1 === parseInt(selectedMonth) &&
            contractDate.getFullYear() === currentYear
          );
        } else if (selectedYear) {
          // Apenas ano selecionado: filtrar por todos os meses daquele ano
          return contractDate.getFullYear() === parseInt(selectedYear);
        }

        return false;
      });
    }

    return contractsToDisplay;
  }, [selectedMonth, selectedYear, hasSearched, searchResults, contracts]);

  // ============================================================
  // DOCUMENT GENERATION HANDLERS
  // ============================================================

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
      <div className="min-h-screen premium-gradient-bg">
        {/* Header Moderno */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/60 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="icon-container w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-2xl flex items-center justify-center scale-on-hover">
                    <FileText className="h-7 w-7 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                      Contratos
                    </h1>
                    <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">
                      Gerencie todos os contratos de locação
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <OptimizedSearch
                    onSearch={performSearch}
                    placeholder="Buscar contratos..."
                    showResultsCount={true}
                    resultsCount={totalResults}
                    isLoading={isSearching}
                    className="w-80"
                  />

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="w-[140px] h-9 border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {meses.map((mes, index) => (
                          <SelectItem
                            key={index}
                            value={(index + 1).toString()}
                          >
                            {mes}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger className="w-[120px] h-9 border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
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
                        className="h-9 px-3 text-neutral-600 hover:text-neutral-900"
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-success-300 bg-white hover:bg-success-50 text-success-700 hover:border-success-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`Exportar ${displayedContracts.length} contrato(s) para Excel`}
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-success-300 border-t-success-700"></div>
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

        {/* Welcome Section */}
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-gradient-border">
            <div className="animate-gradient-border-content flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  Bem-vindo,{' '}
                  <span className="animate-gradient-text inline-block">
                    {profile?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Usuário'}
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-neutral-700 dark:text-neutral-300 font-medium">
                  Com quais contratos iremos trabalhar hoje?
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium uppercase tracking-wide">
                  Hoje
                </p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 relative">
                  <span className="relative inline-block animate-gradient-text">
                    {formatDateBrazilian(new Date())}
                  </span>
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

        {/* Modals */}
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
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
