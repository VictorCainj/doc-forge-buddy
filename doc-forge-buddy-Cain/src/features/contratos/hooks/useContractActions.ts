/**
 * Hook para ações de contratos
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Contract, ContractFormData, DocumentTemplate } from '../types';
import { TemplateProcessor } from '@/utils/templateProcessor';
import { applyContractConjunctions } from '@/features/contracts/utils/contractConjunctions';
import { processTemplate } from '@/shared/template-processing';
import { NotificationAutoCreator } from '@/features/notifications/utils/notificationAutoCreator';
import { supabase } from '@/integrations/supabase/client';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/core/dateFormatter';
import {
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  EMAIL_CONVITE_VISTORIA_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  STATUS_VISTORIA_WHATSAPP_TEMPLATE,
} from '@/templates/documentos';
import { splitNames } from '@/utils/nameHelpers';
import { useAuth } from '@/hooks/useAuth';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { anonymizeContractData } from '@/utils/privacyUtils';
import { exportContractsToExcel } from '@/utils/exportContractsToExcel';
import { ContractReducerState, ContractReducerActions } from '../types';

export interface UseContractActionsProps {
  state: ContractReducerState;
  actions: ContractReducerActions;
  displayedContracts: Contract[];
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  showError: (type: string, data: any) => void;
}

export interface UseContractActionsReturn {
  // Document handlers
  generateDocument: (contract: Contract, template: string, documentType: string) => void;
  handleGenerateAgendamento: () => void;
  handleGenerateRecusaAssinatura: () => void;
  handleGenerateWhatsApp: () => void;
  handleGenerateWithAssinante: (assinante: string) => void;
  handleGenerateStatusVistoria: () => void;
  
  // Utility handlers
  handleLoadMore: () => void;
  handleExportToExcel: () => Promise<void>;
  handleClearDateFilter: () => void;
  
  // Document generation helpers
  generateDocumentWithAssinante: (
    contract: Contract,
    template: string,
    documentType: string,
    assinante: string
  ) => void;
}

export const useContractActions = ({
  state,
  actions,
  displayedContracts,
  isExporting,
  setIsExporting,
  showError,
}: UseContractActionsProps): UseContractActionsReturn => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPrivacyModeActive } = usePrivacyMode();

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

      // Aplicar anonimização se necessário
      const finalData = isPrivacyModeActive
        ? anonymizeContractData(enhancedData)
        : enhancedData;

      const processedTemplate = TemplateProcessor.processTemplate(
        template,
        finalData
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
    [state.formData, actions, navigate, isPrivacyModeActive]
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
        const finalData = isPrivacyModeActive
          ? anonymizeContractData(enhancedData)
          : enhancedData;
        const processedTemplate = processTemplate(template, finalData);
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

    // Aplicar anonimização se necessário
    const finalData = isPrivacyModeActive
      ? anonymizeContractData(enhancedData)
      : enhancedData;

    const processedTemplate = processTemplate(
      NOTIFICACAO_AGENDAMENTO_TEMPLATE,
      finalData
    );
    const documentTitle = `Notificação de Agendamento - ${tipoVistoriaTexto} - ${state.selectedContract.title}`;

    // Registrar agendamento na tabela vistoria_analises e criar notificação
    try {
      const contractNumber = state.selectedContract.form_data?.numeroContrato || 'N/A';
      const vistoriaDate = dataVistoriaFormatada || state.formData.dataVistoria;
      const vistoriaType = state.formData.tipoVistoria === 'revistoria' ? 'revistoria' : 'final';
      
      const dadosVistoria = {
        locatario: state.selectedContract.form_data?.nomeLocatario || '',
        endereco: state.selectedContract.form_data?.enderecoImovel || '',
        dataVistoria: state.formData.dataVistoria,
        tipoVistoria: state.formData.tipoVistoria === 'revistoria' ? 'revistoria' : 'final',
        responsavel: enhancedData.nomeVistoriador || 'David Issa',
        observacoes: `Vistoria agendada para ${dataVistoriaFormatada} às ${state.formData.horaVistoria}`,
      };

      const { data: vistoriaData, error: vistoriaError } = await supabase
        .from('vistoria_analises')
        .insert({
          title: `Agendamento ${tipoVistoriaTexto} - ${contractNumber}`,
          contract_id: state.selectedContract.id,
          dados_vistoria: dadosVistoria,
          apontamentos: [],
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (vistoriaError) {
        console.error('Erro ao registrar agendamento no banco:', vistoriaError);
      } else {
        console.log('Agendamento registrado no banco:', vistoriaData.id);
        
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
  }, [state, actions, navigate, showError, user]);

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

    enhancedData.dataVistoria = state.formData.dataRealizacaoVistoria;

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

  const handleLoadMore = useCallback(async () => {
    actions.setLoading('loadMore', true);
    try {
      // Note: This should be implemented to call the actual loadMore function from the data hook
      // For now, just close the loading state
      actions.setLoading('loadMore', false);
    } finally {
      actions.setLoading('loadMore', false);
    }
  }, [actions]);

  const handleExportToExcel = useCallback(async () => {
    if (displayedContracts.length === 0) {
      toast.error('Não há contratos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      // Note: This needs access to the filters to pass to the export function
      await exportContractsToExcel(displayedContracts, {});

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
  }, [displayedContracts, setIsExporting]);

  const handleClearDateFilter = useCallback(() => {
    // This should be handled by the filters hook
  }, []);

  return {
    generateDocument,
    handleGenerateAgendamento,
    handleGenerateRecusaAssinatura,
    handleGenerateWhatsApp,
    handleGenerateWithAssinante,
    handleGenerateStatusVistoria,
    handleLoadMore,
    handleExportToExcel,
    handleClearDateFilter,
    generateDocumentWithAssinante,
  };
};