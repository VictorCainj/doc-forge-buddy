/**
 * Gerador de respostas adaptativas humanizadas
 */

import { MessageAnalysis, AdaptiveResponse } from '@/types/conversationProfile';
import { ConversationProfile } from '@/types/conversationProfile';
import { Contract } from '@/hooks/useContractAnalysis';
import { DualResponseResult } from '@/types/dualChat';
import { analyzeMessageContext } from './sentimentAnalysis';
import {
  enrichContextWithContract,
  generateContextualPrompt,
} from './contextEnricher';
import { findBestTemplate, applyTemplate } from './responseTemplates';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import {
  analyzeAdvancedSentiment,
  detectSenderWithSentiment,
  extractContextualMarkers,
} from './advancedSentimentAnalyzer';
import { humanizeResponse } from './responseHumanizer';

/**
 * Gera resposta adaptativa para uma mensagem
 */
export const generateAdaptiveResponse = async (
  message: string,
  profile: ConversationProfile | null,
  contract: Contract | null,
  generateAudio: boolean = false
): Promise<AdaptiveResponse> => {
  try {
    // 1. Analisar mensagem (usar IA para análise mais precisa)
    const analysis = await analyzeMessageWithAI(message);

    // 2. Enriquecer contexto com dados do contrato
    const contextualData = enrichContextWithContract(
      message,
      contract,
      profile?.personType
    );

    // 3. Gerar resposta humanizada usando IA
    const responseText = await generateHumanizedResponseWithAI(
      message,
      analysis,
      profile,
      contextualData,
      contract
    );

    // 4. Gerar áudio se solicitado
    let audioUrl: string | undefined;
    if (generateAudio && responseText) {
      try {
        audioUrl = await generateAudioResponse(responseText);
      } catch (error) {
        log.warn('Erro ao gerar áudio:', error);
        // Continue sem áudio se houver erro
      }
    }

    // 5. Gerar sugestões baseadas na análise
    const suggestions = generateResponseSuggestions(analysis, contextualData);

    return {
      text: responseText,
      tone: analysis.suggestedTone,
      emotion: analysis.emotion,
      confidence: analysis.confidence,
      audioUrl,
      suggestions,
    };
  } catch (error) {
    log.error('Erro ao gerar resposta adaptativa:', error);
    throw new Error('Erro ao gerar resposta adaptativa');
  }
};

/**
 * Analisa mensagem usando IA para maior precisão
 */
const analyzeMessageWithAI = async (
  message: string
): Promise<MessageAnalysis> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'analyzeMessageContext',
        data: { message },
      },
    });

    if (error) {
      log.warn('Erro na análise IA, usando análise local:', error);
      // Fallback para análise local
      return await analyzeMessageContext(message);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na análise da mensagem');
    }

    return data.content as MessageAnalysis;
  } catch (error) {
    log.warn('Erro na análise IA, usando análise local:', error);
    // Fallback para análise local
    return await analyzeMessageContext(message);
  }
};

/**
 * Gera resposta humanizada usando IA
 */
const generateHumanizedResponseWithAI = async (
  message: string,
  analysis: MessageAnalysis,
  profile: ConversationProfile | null,
  contextualData: any,
  contract: Contract | null
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'generateHumanizedResponse',
        data: {
          message,
          analysis,
          profile,
          context: generateContextualPrompt(message, contextualData, contract),
        },
      },
    });

    if (error) {
      log.warn('Erro na geração IA, usando template:', error);
      // Fallback para template
      return generateResponseFromTemplate(
        message,
        analysis,
        profile,
        contextualData
      );
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na geração da resposta');
    }

    return data.content;
  } catch (error) {
    log.warn('Erro na geração IA, usando template:', error);
    // Fallback para template
    return generateResponseFromTemplate(
      message,
      analysis,
      profile,
      contextualData
    );
  }
};

/**
 * Gera resposta usando template como fallback
 */
const generateResponseFromTemplate = (
  message: string,
  analysis: MessageAnalysis,
  profile: ConversationProfile | null,
  contextualData: any
): string => {
  // Determinar situação baseada na análise
  const situation = determineSituation(analysis);

  // Encontrar template adequado
  const template = findBestTemplate(analysis, situation);

  if (!template) {
    // Template genérico se não encontrar específico
    return generateGenericResponse(message, analysis, profile);
  }

  // Preparar variáveis para o template
  const variables: Record<string, string> = {
    nome: contextualData.personName || 'Prezado(a)',
    contexto: extractContextFromMessage(message),
  };

  // Aplicar template
  return applyTemplate(template, variables);
};

/**
 * Determina situação baseada na análise
 */
const determineSituation = (analysis: MessageAnalysis): string => {
  if (analysis.intent === 'question') {
    return 'information';
  }

  if (analysis.intent === 'complaint') {
    return 'complaint';
  }

  if (
    analysis.context.includes('vistoria') ||
    analysis.context.includes('agendamento')
  ) {
    return 'inspection';
  }

  if (
    analysis.context.includes('contrato') ||
    analysis.context.includes('documento')
  ) {
    return 'contract';
  }

  if (
    analysis.context.includes('pagamento') ||
    analysis.context.includes('valor')
  ) {
    return 'payment';
  }

  return 'information';
};

/**
 * Extrai contexto da mensagem
 */
const extractContextFromMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('tinta') || lowerMessage.includes('pintura')) {
    return 'cor da tinta';
  }

  if (lowerMessage.includes('vistoria')) {
    return 'vistoria';
  }

  if (lowerMessage.includes('documento')) {
    return 'documentos necessários';
  }

  if (lowerMessage.includes('data') || lowerMessage.includes('quando')) {
    return 'datas disponíveis';
  }

  return 'as informações solicitadas';
};

/**
 * Gera resposta genérica quando não há template específico
 */
const generateGenericResponse = (
  message: string,
  analysis: MessageAnalysis,
  profile: ConversationProfile | null
): string => {
  const personName = profile?.personName || 'Prezado(a)';

  let greeting = '';
  let closing = '';

  // Sempre usar tom formal
  greeting = `Prezado(a) ${personName},\n\n`;
  closing = '\n\nAtenciosamente.';

  let response = greeting;

  if (analysis.emotion === 'frustrated' || analysis.emotion === 'concerned') {
    response += 'Reconhecemos sua preocupação e lamentamos o inconveniente. ';
  }

  if (analysis.intent === 'question') {
    response +=
      'Vamos verificar as informações solicitadas e retornaremos com as respostas no menor prazo possível.';
  } else if (analysis.intent === 'request') {
    response +=
      'Vamos analisar sua solicitação e implementar as medidas necessárias. Retornaremos em breve com as informações.';
  } else {
    response +=
      'Vamos analisar a situação e retornaremos com as informações necessárias em breve.';
  }

  if (analysis.urgency === 'high') {
    response += ' Esta solicitação será priorizada.';
  }

  response += closing;

  return response;
};

/**
 * Gera respostas duais para locador e locatário
 */
export const generateDualResponses = async (
  message: string,
  names: { locador?: string; locatario?: string },
  contract: Contract | null,
  hasUsedGreeting: boolean = false
): Promise<DualResponseResult> => {
  try {
    log.info('Gerando respostas duais para mensagem:', {
      message,
      names,
      hasUsedGreeting,
    });

    // 1. Analisar sentimento da mensagem
    const sentimentAnalysis = analyzeAdvancedSentiment(message);

    // 2. Detectar quem enviou a mensagem com análise de sentimento
    const detectionResult = detectSenderWithSentiment(message);
    const detectedSender = detectionResult.sender;
    const detectionConfidence = detectionResult.confidence;

    // 3. Extrair nomes se não foram fornecidos
    const extractedNames =
      names.locador && names.locatario
        ? names
        : await extractNamesFromMessage(message);

    // 4. Gerar respostas usando IA
    log.info('Chamando função openai-proxy com dados:', {
      action: 'generateDualResponses',
      message,
      names: extractedNames,
      detectedSender,
      hasUsedGreeting,
      contract: contract ? 'presente' : 'ausente',
    });

    const response = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'generateDualResponses',
        data: {
          message,
          names: extractedNames,
          detectedSender,
          sentiment: sentimentAnalysis,
          detectionConfidence,
          hasUsedGreeting,
          contract: contract
            ? {
                address: contract.address,
                title: contract.title,
                startDate: contract.startDate,
                endDate: contract.endDate,
                monthlyRent: contract.monthlyRent,
              }
            : null,
        },
      },
    });

    log.info('Resposta da função openai-proxy:', {
      error: response.error,
      data: response.data,
      status: response.status,
    });

    if (response.error) {
      log.error('Erro detalhado da IA:', response.error);
      throw new Error(`Erro na IA: ${response.error.message}`);
    }

    if (!response.data) {
      log.error('Resposta vazia da IA');
      throw new Error('Resposta vazia da IA');
    }

    // A resposta pode vir em diferentes formatos
    let result: DualResponseResult;

    if (response.data.content) {
      // Se a resposta tem um campo 'content' com JSON string
      try {
        result = JSON.parse(response.data.content);
      } catch (parseError) {
        log.error('Erro ao fazer parse do JSON:', parseError);
        throw new Error('Resposta da IA em formato inválido');
      }
    } else {
      // Se a resposta já é o objeto direto
      result = response.data as DualResponseResult;
    }

    // 5. Humanizar respostas baseado no sentimento
    result.locadorResponse = humanizeResponse(
      result.locadorResponse,
      sentimentAnalysis,
      'locador'
    );

    result.locatarioResponse = humanizeResponse(
      result.locatarioResponse,
      sentimentAnalysis,
      'locatario'
    );

    // 6. Adicionar análises de sentimento ao resultado
    result.locadorSentiment = {
      ...sentimentAnalysis,
      contextualMarkers: extractContextualMarkers(message, 'locador'),
    };

    result.locatarioSentiment = {
      ...sentimentAnalysis,
      contextualMarkers: extractContextualMarkers(message, 'locatario'),
    };

    result.detectionConfidence = detectionConfidence;

    log.info('Respostas duais geradas e humanizadas com sucesso:', result);
    return result;
  } catch (error) {
    log.error('Erro ao gerar respostas duais:', error);

    // Fallback: gerar respostas básicas
    return generateFallbackDualResponses(message, names, hasUsedGreeting);
  }
};

/**
 * Detecta quem enviou a mensagem baseado no contexto (versão simplificada para fallback)
 */
const detectSender = (message: string): 'locador' | 'locatario' | 'unknown' => {
  const detectionResult = detectSenderWithSentiment(message);
  return detectionResult.sender;
};

/**
 * Extrai nomes do locador e locatário da mensagem
 */
const extractNamesFromMessage = async (
  message: string
): Promise<{
  locador?: string;
  locatario?: string;
}> => {
  try {
    // Tentar usar IA para extrair nomes
    const response = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'extractNames',
        data: {
          message,
        },
      },
    });

    if (response.error) {
      throw new Error(`Erro na IA: ${response.error.message}`);
    }

    return response.data || {};
  } catch (error) {
    log.warn('Erro ao extrair nomes com IA, usando fallback:', error);

    // Fallback: regex simples
    const namePattern =
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(?(locador|locatário|locatario)\)?/gi;
    const matches = Array.from(message.matchAll(namePattern));

    const names: { locador?: string; locatario?: string } = {};

    matches.forEach((match) => {
      const name = match[1].trim();
      const type = match[2].toLowerCase();

      if (type.includes('locador')) {
        names.locador = name;
      } else if (type.includes('locatário') || type.includes('locatario')) {
        names.locatario = name;
      }
    });

    return names;
  }
};

/**
 * Gera respostas de fallback quando a IA falha
 */
const generateFallbackDualResponses = (
  message: string,
  names: { locador?: string; locatario?: string },
  hasUsedGreeting: boolean
): DualResponseResult => {
  const detectedSender = detectSender(message);
  const lowerMessage = message.toLowerCase();

  const greeting = hasUsedGreeting ? '' : 'Prezado(a)';
  const locadorName = names.locador || 'Locador';
  const locatarioName = names.locatario || 'Locatário';

  let locadorResponse = '';
  let locatarioResponse = '';

  // Análise inteligente do contexto para respostas mais específicas
  const isPaintQuestion =
    lowerMessage.includes('tinta') ||
    lowerMessage.includes('cor') ||
    lowerMessage.includes('pintura');
  const isAuthorizationRequest =
    lowerMessage.includes('autorização') ||
    lowerMessage.includes('permissão') ||
    lowerMessage.includes('pode');
  const isMaintenanceIssue =
    lowerMessage.includes('problema') ||
    lowerMessage.includes('defeito') ||
    lowerMessage.includes('reparo');

  if (detectedSender === 'locatario') {
    // Locatário enviou, gerar resposta específica para locador
    if (isPaintQuestion) {
      locadorResponse = hasUsedGreeting
        ? `Boa tarde Sr ${locadorName}, tudo bem? O locatário gostaria de gentilmente verificar com o senhor a cor da tinta usada nas paredes do imóvel. O senhor se recorda?`
        : `Boa tarde Sr ${locadorName}, tudo bem? O locatário gostaria de gentilmente verificar com o senhor a cor da tinta usada nas paredes do imóvel. O senhor se recorda?`;
    } else if (isAuthorizationRequest) {
      locadorResponse = hasUsedGreeting
        ? `Boa tarde Sr ${locadorName}, tudo bem? O locatário solicitou uma autorização. O senhor pode revisar e nos informar sua decisão?`
        : `Boa tarde Sr ${locadorName}, tudo bem? O locatário solicitou uma autorização. O senhor pode revisar e nos informar sua decisão?`;
    } else if (isMaintenanceIssue) {
      locadorResponse = hasUsedGreeting
        ? `Boa tarde Sr ${locadorName}, tudo bem? O locatário relatou um problema no imóvel. Como devemos proceder para resolver a questão?`
        : `Boa tarde Sr ${locadorName}, tudo bem? O locatário relatou um problema no imóvel. Como devemos proceder para resolver a questão?`;
    } else {
      locadorResponse = hasUsedGreeting
        ? `Boa tarde Sr ${locadorName}, tudo bem? Recebemos uma solicitação do locatário. Vamos analisar e retornaremos com uma resposta em breve.`
        : `Boa tarde Sr ${locadorName}, tudo bem? Recebemos uma solicitação do locatário. Vamos analisar e retornaremos com uma resposta em breve.`;
    }

    locatarioResponse = hasUsedGreeting
      ? `Bom dia Sr ${locatarioName}, tudo bem obrigado. Maravilha, irei verificar com o locador e retorno assim que possível.`
      : `Bom dia Sr ${locatarioName}, tudo bem obrigado. Maravilha, irei verificar com o locador e retorno assim que possível.`;
  } else if (detectedSender === 'locador') {
    // Locador enviou, gerar resposta específica para locatário
    locadorResponse = hasUsedGreeting
      ? `Sua mensagem foi recebida. Vamos processar as informações e retornaremos em breve.\n\nAtenciosamente.`
      : `${greeting} ${locadorName},\n\nSua mensagem foi recebida. Vamos processar as informações e retornaremos em breve.\n\nAtenciosamente.`;

    locatarioResponse = hasUsedGreeting
      ? `Recebemos a comunicação do locador. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`
      : `${greeting} ${locatarioName},\n\nRecebemos a comunicação do locador. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`;
  } else {
    // Remetente desconhecido, gerar respostas genéricas
    locadorResponse = hasUsedGreeting
      ? `Recebemos a comunicação. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`
      : `${greeting} ${locadorName},\n\nRecebemos a comunicação. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`;

    locatarioResponse = hasUsedGreeting
      ? `Recebemos a comunicação. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`
      : `${greeting} ${locatarioName},\n\nRecebemos a comunicação. Vamos analisar e retornaremos com as informações necessárias em breve.\n\nAtenciosamente.`;
  }

  return {
    locadorResponse,
    locatarioResponse,
    detectedSender,
    extractedNames: names,
  };
};

/**
 * Gera resposta em áudio
 */
const generateAudioResponse = async (text: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'textToSpeech',
        data: { text },
      },
    });

    if (error) {
      throw new Error(error.message || 'Erro ao gerar áudio');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro ao gerar áudio');
    }

    // Converter base64 para URL de dados
    const audioBase64 = data.content;
    return `data:audio/mp3;base64,${audioBase64}`;
  } catch (error) {
    log.error('Erro ao gerar áudio:', error);
    throw error;
  }
};

/**
 * Gera sugestões de resposta
 */
const generateResponseSuggestions = (
  analysis: MessageAnalysis,
  contextualData: any
): string[] => {
  const suggestions: string[] = [];

  // Sugestões baseadas na emoção
  switch (analysis.emotion) {
    case 'frustrated':
      suggestions.push('Demonstre compreensão e ofereça solução');
      suggestions.push('Seja empático e reconheça a frustração');
      break;
    case 'concerned':
      suggestions.push('Tranquilize e ofereça esclarecimentos');
      suggestions.push('Seja reconfortante e prestativo');
      break;
    case 'urgent':
      suggestions.push('Priorize rapidez na resposta');
      suggestions.push('Confirme urgência e dê prazo');
      break;
    case 'grateful':
      suggestions.push('Agradeça o feedback positivo');
      suggestions.push('Mantenha o tom cordial');
      break;
  }

  // Sugestões baseadas na intenção
  switch (analysis.intent) {
    case 'question':
      suggestions.push('Forneça informação clara e completa');
      break;
    case 'complaint':
      suggestions.push('Reconheça o problema e ofereça solução');
      break;
    case 'request':
      suggestions.push('Confirme o que será feito e quando');
      break;
  }

  // Sugestões baseadas no contexto
  if (contextualData.relevantInfo?.paintInfo?.mentioned) {
    suggestions.push('Prepare informações sobre pintura');
  }

  if (contextualData.relevantInfo?.inspectionInfo?.mentioned) {
    suggestions.push('Considere agendar vistoria');
  }

  return suggestions;
};

/**
 * Valida resposta gerada
 */
export const validateResponse = (
  response: string
): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (!response || response.trim().length === 0) {
    issues.push('Resposta vazia');
  }

  if (response.length < 10) {
    issues.push('Resposta muito curta');
  }

  if (response.length > 1000) {
    issues.push('Resposta muito longa');
  }

  // Verificar se contém informações básicas
  if (
    !response.includes('vou') &&
    !response.includes('Vou') &&
    !response.includes('retorno')
  ) {
    issues.push('Resposta pode não ser suficientemente informativa');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * Analisa imagem do WhatsApp e extrai texto
 */
export const analyzeWhatsAppImage = async (
  base64Image: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'analyzeImage',
        data: {
          imageBase64: base64Image,
          userPrompt:
            'Extraia todo o texto desta imagem de mensagem do WhatsApp. Retorne apenas o texto da mensagem, sem formatação adicional.',
        },
      },
    });

    if (error) throw error;
    return data.content || data;
  } catch (error) {
    log.error('Erro ao analisar imagem do WhatsApp:', error);
    throw new Error('Não foi possível extrair texto da imagem');
  }
};

/**
 * Melhora resposta baseada em feedback
 */
export const improveResponse = async (
  originalResponse: string,
  feedback: 'positive' | 'negative' | 'neutral',
  suggestions?: string[]
): Promise<string> => {
  if (feedback === 'positive') {
    return originalResponse; // Não precisa melhorar se foi positiva
  }

  // Para feedback negativo ou neutro, tentar melhorar
  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        action: 'improveText',
        data: {
          text: originalResponse,
          context:
            'Esta é uma resposta para um locador/locatário. Melhore para ser mais clara, empática e profissional.',
          suggestions: suggestions || [],
        },
      },
    });

    if (error || !data.success) {
      return originalResponse; // Retornar original se houver erro
    }

    return data.content;
  } catch (error) {
    log.warn('Erro ao melhorar resposta:', error);
    return originalResponse;
  }
};
