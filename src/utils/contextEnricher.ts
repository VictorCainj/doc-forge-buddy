/**
 * Utilitários para enriquecer contexto com dados de contratos
 */

import { Contract } from '@/types/contract';
import { ContextualData } from '@/types/conversationProfile';
import { log } from '@/utils/logger';

/**
 * Enriquece contexto com dados do contrato
 */
export const enrichContextWithContract = (
  message: string,
  contract: Contract | null,
  personType?: 'locador' | 'locatario'
): ContextualData => {
  if (!contract) {
    return {
      relevantInfo: {},
    };
  }

  const formData = contract.form_data;
  const contextualData: ContextualData = {
    contractId: contract.id,
    relevantInfo: {
      address: formData.enderecoImovel,
      contractNumber: formData.numeroContrato,
      dates: {
        start: formData.dataFirmamentoContrato,
        end: formData.dataTerminoRescisao,
        inspection: formData.dataRealizacaoVistoria,
      },
      values: {
        rent: extractRentValue(formData),
        deposit: extractDepositValue(formData),
      },
    },
  };

  // Determinar nome da pessoa baseado no tipo
  if (personType === 'locador') {
    contextualData.personName =
      formData.nomeProprietario || formData.nomesResumidosLocadores;
    contextualData.personType = 'locador';
  } else if (personType === 'locatario') {
    contextualData.personName =
      formData.nomeLocatario || formData.primeiroLocatario;
    contextualData.personType = 'locatario';
  }

  // Buscar informações relevantes na mensagem
  const relevantInfo = extractRelevantInfoFromMessage(message, formData);
  contextualData.relevantInfo = {
    ...contextualData.relevantInfo,
    ...relevantInfo,
  };

  log.debug('Contexto enriquecido:', contextualData);
  return contextualData;
};

/**
 * Extrai informações relevantes da mensagem
 */
const extractRelevantInfoFromMessage = (message: string, _formData: any) => {
  const lowerMessage = message.toLowerCase();
  const relevantInfo: any = {};

  // Detectar menções a pintura/tinta
  if (
    lowerMessage.includes('tinta') ||
    lowerMessage.includes('pintura') ||
    lowerMessage.includes('cor')
  ) {
    relevantInfo.paintInfo = {
      mentioned: true,
      context: extractPaintContext(lowerMessage),
    };
  }

  // Detectar menções a vistoria
  if (lowerMessage.includes('vistoria') || lowerMessage.includes('inspeção')) {
    relevantInfo.inspectionInfo = {
      mentioned: true,
      context: extractInspectionContext(lowerMessage),
    };
  }

  // Detectar menções a datas
  const dateMentions = extractDateMentions(lowerMessage);
  if (dateMentions.length > 0) {
    relevantInfo.dateMentions = dateMentions;
  }

  // Detectar menções a valores/pagamentos
  const valueMentions = extractValueMentions(lowerMessage);
  if (valueMentions.length > 0) {
    relevantInfo.valueMentions = valueMentions;
  }

  return relevantInfo;
};

/**
 * Extrai contexto sobre pintura
 */
const extractPaintContext = (message: string): string => {
  if (message.includes('qual a cor') || message.includes('cor da tinta')) {
    return 'solicitação_cor';
  }
  if (message.includes('pintar') || message.includes('pintura')) {
    return 'solicitação_pintura';
  }
  if (
    message.includes('tinta') &&
    (message.includes('problema') || message.includes('defeito'))
  ) {
    return 'problema_tinta';
  }
  return 'geral';
};

/**
 * Extrai contexto sobre vistoria
 */
const extractInspectionContext = (message: string): string => {
  if (message.includes('agendar') || message.includes('marcar')) {
    return 'agendamento';
  }
  if (message.includes('apontamento') || message.includes('problema')) {
    return 'apontamentos';
  }
  if (message.includes('quando') || message.includes('data')) {
    return 'data_vistoria';
  }
  return 'geral';
};

/**
 * Extrai menções a datas
 */
const extractDateMentions = (message: string): string[] => {
  const datePatterns = [
    /\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/g,
    /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    /\b(hoje|amanhã|ontem|próxima semana|semana que vem)\b/g,
  ];

  const mentions: string[] = [];
  datePatterns.forEach((pattern) => {
    const matches = message.match(pattern);
    if (matches) {
      mentions.push(...matches);
    }
  });

  return [...new Set(mentions)]; // Remove duplicatas
};

/**
 * Extrai menções a valores
 */
const extractValueMentions = (message: string): string[] => {
  const valuePatterns = [
    /\bR\$\s*\d+[.,]?\d*\b/g,
    /\b\d+[.,]?\d*\s*reais?\b/g,
    /\b(aluguel|valor|preço|custo|taxa)\b/g,
  ];

  const mentions: string[] = [];
  valuePatterns.forEach((pattern) => {
    const matches = message.match(pattern);
    if (matches) {
      mentions.push(...matches);
    }
  });

  return [...new Set(mentions)]; // Remove duplicatas
};

/**
 * Extrai valor do aluguel dos dados do contrato
 */
const extractRentValue = (formData: any): string | undefined => {
  // Tentar diferentes campos onde o valor do aluguel pode estar
  const possibleFields = [
    'valorAluguel',
    'aluguel',
    'valor',
    'valorMensal',
    'renda',
  ];

  for (const field of possibleFields) {
    if (formData[field]) {
      return formatCurrency(formData[field]);
    }
  }

  return undefined;
};

/**
 * Extrai valor do depósito dos dados do contrato
 */
const extractDepositValue = (formData: any): string | undefined => {
  // Tentar diferentes campos onde o valor do depósito pode estar
  const possibleFields = [
    'valorDeposito',
    'deposito',
    'caucao',
    'valorCaucao',
    'garantia',
  ];

  for (const field of possibleFields) {
    if (formData[field]) {
      return formatCurrency(formData[field]);
    }
  }

  return undefined;
};

/**
 * Formata valor como moeda
 */
const formatCurrency = (value: string | number): string => {
  if (!value) return '';

  const numValue =
    typeof value === 'string'
      ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
      : value;

  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Busca informações específicas mencionadas na mensagem
 */
export const searchRelevantContractInfo = (
  message: string,
  contract: Contract | null
): Record<string, any> => {
  if (!contract) return {};

  const formData = contract.form_data;
  const lowerMessage = message.toLowerCase();
  const relevantInfo: Record<string, any> = {};

  // Buscar informações específicas baseadas na mensagem
  if (lowerMessage.includes('nome') || lowerMessage.includes('quem')) {
    relevantInfo.names = {
      locador: formData.nomeProprietario || formData.nomesResumidosLocadores,
      locatario: formData.nomeLocatario || formData.primeiroLocatario,
    };
  }

  if (lowerMessage.includes('endereço') || lowerMessage.includes('local')) {
    relevantInfo.address = formData.enderecoImovel;
  }

  if (
    lowerMessage.includes('telefone') ||
    lowerMessage.includes('celular') ||
    lowerMessage.includes('contato')
  ) {
    relevantInfo.contacts = {
      locador: formData.celularProprietario,
      locatario: formData.celularLocatario,
    };
  }

  if (lowerMessage.includes('email')) {
    relevantInfo.emails = {
      locador: formData.emailProprietario,
      locatario: formData.emailLocatario,
    };
  }

  if (lowerMessage.includes('data') || lowerMessage.includes('quando')) {
    relevantInfo.dates = {
      contrato: formData.dataFirmamentoContrato,
      inicio: formData.dataInicioRescisao,
      fim: formData.dataTerminoRescisao,
      vistoria: formData.dataRealizacaoVistoria,
    };
  }

  if (
    lowerMessage.includes('valor') ||
    lowerMessage.includes('preço') ||
    lowerMessage.includes('aluguel')
  ) {
    relevantInfo.values = {
      aluguel: extractRentValue(formData),
      deposito: extractDepositValue(formData),
    };
  }

  return relevantInfo;
};

/**
 * Gera contexto textual para a IA
 */
export const generateContextualPrompt = (
  message: string,
  contextualData: ContextualData,
  contract: Contract | null
): string => {
  if (!contract) return '';

  const formData = contract.form_data;
  const contextParts: string[] = [];

  // Informações básicas do contrato
  contextParts.push(`CONTRATO: ${formData.numeroContrato || 'N/A'}`);
  contextParts.push(`ENDEREÇO: ${formData.enderecoImovel || 'N/A'}`);

  // Informações da pessoa
  if (contextualData.personName) {
    contextParts.push(
      `PESSOA: ${contextualData.personName} (${contextualData.personType || 'N/A'})`
    );
  }

  // Informações relevantes extraídas da mensagem
  if (contextualData.relevantInfo) {
    const info = contextualData.relevantInfo;

    if (info.paintInfo?.mentioned) {
      contextParts.push(`CONTEXTO PINTURA: ${info.paintInfo.context}`);
    }

    if (info.inspectionInfo?.mentioned) {
      contextParts.push(`CONTEXTO VISTORIA: ${info.inspectionInfo.context}`);
    }

    if (info.dateMentions?.length > 0) {
      contextParts.push(`DATAS MENCIONADAS: ${info.dateMentions.join(', ')}`);
    }

    if (info.valueMentions?.length > 0) {
      contextParts.push(
        `VALORES MENCIONADOS: ${info.valueMentions.join(', ')}`
      );
    }
  }

  return contextParts.join('\n');
};
