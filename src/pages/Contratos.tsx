import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { useContractsWithPendingBills } from '@/hooks/useContractsWithPendingBills';
import { useStandardToast } from '@/utils/toastHelpers';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/dateFormatter';
import { AlertCircle, Building2, Plus } from '@/utils/iconMapper';
import { TemplateProcessor } from '@/utils/templateProcessor';
import { Contract } from '@/types/contract';
import { applyContractConjunctions } from '@/features/contracts/utils/contractConjunctions';
import { processContractTemplate } from '@/features/contracts/utils/templateProcessor';
import {
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  STATUS_VISTORIA_WHATSAPP_TEMPLATE,
} from '@/templates/documentos';
import { ContractList, ContractModals } from '@/features/contracts/components';
import { splitNames } from '@/utils/nameHelpers';
import { useContractReducer } from '@/features/contracts/hooks/useContractReducer';
import OptimizedSearch from '@/components/ui/optimized-search';

const Contratos = () => {
  const navigate = useNavigate();
  const { showError } = useStandardToast();

  // Estado para controlar filtro de pendências
  const [showPendingOnly, setShowPendingOnly] = useState(false);

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

  // Dados principais
  const {
    data: contracts,
    loading,
    hasMore,
    loadMore,
    totalCount,
  } = useOptimizedData({
    documentType: 'contrato',
    limit: 6,
  });

  // Hook para buscar contratos com pendências
  const { data: pendingContracts, loading: loadingPending } =
    useContractsWithPendingBills({
      enabled: showPendingOnly,
    });

  // Contratos exibidos (filtro de pendências, busca ou paginação normal)
  const displayedContracts = useMemo(() => {
    if (showPendingOnly) {
      return pendingContracts; // Exibir apenas contratos com pendências
    }
    if (hasSearched && searchResults.length > 0) {
      return searchResults; // Exibir resultados da busca
    }
    return contracts; // Exibir todos os contratos
  }, [
    showPendingOnly,
    pendingContracts,
    hasSearched,
    searchResults,
    contracts,
  ]);

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
        const temFiadores = formData.temFiador === 'sim';
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
        const processedTemplate = processContractTemplate(
          template,
          enhancedData
        );
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

    const processedTemplate = processContractTemplate(
      NOTIFICACAO_AGENDAMENTO_TEMPLATE,
      enhancedData
    );
    const documentTitle = `Notificação de Agendamento - ${tipoVistoriaTexto} - ${state.selectedContract.title}`;

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
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

    const processedTemplate = processContractTemplate(template, enhancedData);
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

    const processedTemplate = processContractTemplate(
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

    const processedTemplate = processContractTemplate(template, enhancedData);
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

  // Handler para toggle do filtro de pendências
  const handleTogglePendingFilter = useCallback(() => {
    if (!showPendingOnly) {
      // Ativando filtro: limpar busca
      clearSearch();
    }
    setShowPendingOnly(!showPendingOnly);
  }, [showPendingOnly, clearSearch]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        {/* Header Moderno */}
        <div className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                    <Building2 className="h-7 w-7 text-white" />
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

                  <Button
                    variant={showPendingOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleTogglePendingFilter}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
                    disabled={loadingPending}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Pendentes
                    {showPendingOnly && pendingContracts.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-neutral-100 rounded">
                        {pendingContracts.length}
                      </span>
                    )}
                  </Button>

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

                  <Link to="/cadastrar-contrato">
                    <Button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                      <Plus className="h-4 w-4" />
                      Novo Contrato
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Lista de Contratos */}
          <ContractList
            contracts={displayedContracts}
            isLoading={showPendingOnly ? loadingPending : loading}
            hasMore={showPendingOnly ? false : hasMore}
            loadMore={handleLoadMore}
            isLoadingMore={state.loading.loadMore}
            totalCount={showPendingOnly ? pendingContracts.length : totalCount}
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
