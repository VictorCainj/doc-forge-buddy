/**
 * Analisador de sentimento avançado para chat dual
 */

import {
  AdvancedSentimentAnalysis,
  DetectionResult,
} from '@/types/sentimentAnalysis';

/**
 * Analisa sentimento avançado de uma mensagem
 */
export const analyzeAdvancedSentiment = (
  message: string
): AdvancedSentimentAnalysis => {
  const lowerMessage = message.toLowerCase();
  const contextualMarkers: string[] = [];

  // Detecção de emoção
  const emotion = detectEmotion(message, contextualMarkers);

  // Análise de tom
  const tone = detectTone(message, contextualMarkers);

  // Detecção de intenção
  const intent = detectIntent(message, contextualMarkers);

  // Análise de urgência
  const urgency = detectUrgency(message, contextualMarkers);

  // Detecção de poder de decisão
  const decisionPower = detectDecisionPower(message, contextualMarkers);

  // Cálculo de confiança
  const confidence = calculateConfidence(
    message,
    emotion,
    tone,
    intent,
    urgency,
    decisionPower
  );

  return {
    emotion,
    tone,
    intent,
    urgency,
    decisionPower,
    confidence,
    contextualMarkers: [...new Set(contextualMarkers)], // Remove duplicatas
  };
};

/**
 * Detecta emoção baseada em padrões de texto
 */
const detectEmotion = (
  message: string,
  markers: string[]
): AdvancedSentimentAnalysis['emotion'] => {
  const lowerMessage = message.toLowerCase();

  // Frustrado/Irritado
  if (
    /\b(irritado|chateado|frustrado|nervoso|revoltado|indignado|reclamação|reclamo|péssimo|terrível)\b/i.test(
      message
    ) ||
    /!{2,}/.test(message) ||
    /[A-Z]{3,}/.test(message)
  ) {
    markers.push('frustrado');
    return 'frustrated';
  }

  // Preocupado/Ansioso
  if (
    /\b(preocupado|ansioso|preocupação|medo|temor|nervoso|inquieto|será que|e se|tomara que)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('preocupado');
    return 'concerned';
  }

  // Urgente
  if (
    /\b(urgente|rápido|agora|já|imediato|emergência|preciso|necessito|quanto antes|o mais rápido|pra ontem)\b/i.test(
      lowerMessage
    ) ||
    /!{2,}/.test(message)
  ) {
    markers.push('urgente');
    return 'urgent';
  }

  // Satisfeito
  if (
    /\b(obrigado|obrigada|perfeito|ótimo|excelente|muito bem|satisfeito|conforme|aprovado|aceito)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('satisfeito');
    return 'satisfied';
  }

  // Confuso
  if (
    /\b(confuso|não entendi|não compreendo|como assim|pode explicar|não sei|dúvida)\b/i.test(
      lowerMessage
    ) ||
    /\?{2,}/.test(message)
  ) {
    markers.push('confuso');
    return 'confused';
  }

  // Assertivo
  if (
    /\b(preciso que|você deve|faça|obrigatório|necessário|importante|fundamental)\b/i.test(
      lowerMessage
    ) ||
    /[A-Z]{2,}/.test(message)
  ) {
    markers.push('assertivo');
    return 'assertive';
  }

  return 'neutral';
};

/**
 * Detecta tom da mensagem
 */
const detectTone = (
  message: string,
  markers: string[]
): AdvancedSentimentAnalysis['tone'] => {
  const lowerMessage = message.toLowerCase();

  // Formal
  if (
    /\b(prezado|prezada|senhor|senhora|att|atenciosamente|cordiais|saudações)\b/i.test(
      lowerMessage
    ) ||
    /^[A-Z][a-z]+ [A-Z][a-z]+/.test(message) // Nome próprio no início
  ) {
    markers.push('formal');
    return 'formal';
  }

  // Autoritário
  if (
    /\b(preciso que|você deve|faça|obrigatório|necessário|importante|fundamental|sem falta)\b/i.test(
      lowerMessage
    ) ||
    /[A-Z]{2,}/.test(message)
  ) {
    markers.push('autoritário');
    return 'authoritative';
  }

  // Deferente
  if (
    /\b(por favor|obrigado|obrigada|desculpe|com licença|se possível|gostaria|posso|seria possível)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('deferente');
    return 'deferential';
  }

  // Casual
  if (
    /\b(oi|olá|tchau|beleza|tranquilo|suave|valeu|blz|ok|okay)\b/i.test(
      lowerMessage
    ) ||
    /[a-z]{1,3}[!]{1,3}/.test(message) // Abreviações com exclamação
  ) {
    markers.push('casual');
    return 'casual';
  }

  // Profissional (padrão para contexto de negócios)
  if (
    /\b(contrato|aluguel|imóvel|vistoria|manutenção|reparo|pagamento|vencimento)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('profissional');
    return 'professional';
  }

  return 'informal';
};

/**
 * Detecta intenção da mensagem
 */
const detectIntent = (
  message: string,
  markers: string[]
): AdvancedSentimentAnalysis['intent'] => {
  const lowerMessage = message.toLowerCase();

  // Pergunta
  if (
    /\b(que|qual|como|quando|onde|porque|porquê|quanto|quem|pode|seria possível|tem como)\b/i.test(
      lowerMessage
    ) ||
    /\?/.test(message)
  ) {
    markers.push('pergunta');
    return 'question';
  }

  // Reclamação
  if (
    /\b(problema|defeito|quebrado|não funciona|reclamação|reclamo|péssimo|terrível|insatisfeito)\b/i.test(
      lowerMessage
    ) ||
    /!{2,}/.test(message)
  ) {
    markers.push('reclamação');
    return 'complaint';
  }

  // Comando
  if (
    /\b(preciso que|você deve|faça|obrigatório|necessário|importante|fundamental|sem falta)\b/i.test(
      lowerMessage
    ) ||
    /[A-Z]{2,}/.test(message)
  ) {
    markers.push('comando');
    return 'command';
  }

  // Solicitação
  if (
    /\b(peço|solicito|gostaria|posso|seria possível|tem como|pode|autorização|permissão)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('solicitação');
    return 'request';
  }

  // Aprovação
  if (
    /\b(aprovado|autorizado|pode|liberado|aceito|concordo|está ok|pode fazer|autorizo|permito)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('aprovação');
    return 'approval';
  }

  // Negociação
  if (
    /\b(proposta|sugestão|alternativa|opção|possibilidade|considerar|avaliar|discutir)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('negociação');
    return 'negotiation';
  }

  return 'information';
};

/**
 * Detecta urgência da mensagem
 */
const detectUrgency = (
  message: string,
  markers: string[]
): AdvancedSentimentAnalysis['urgency'] => {
  const lowerMessage = message.toLowerCase();

  // Crítico
  if (
    /\b(emergência|urgentíssimo|imediato|agora mesmo|pra ontem|sem falta|obrigatório)\b/i.test(
      lowerMessage
    ) ||
    /!{3,}/.test(message) ||
    /[A-Z]{4,}/.test(message)
  ) {
    markers.push('crítico');
    return 'critical';
  }

  // Alto
  if (
    /\b(urgente|rápido|agora|já|preciso|necessito|quanto antes|o mais rápido)\b/i.test(
      lowerMessage
    ) ||
    /!{2,}/.test(message)
  ) {
    markers.push('alto');
    return 'high';
  }

  // Médio
  if (
    /\b(breve|logo|em breve|assim que possível|quando der|na medida do possível)\b/i.test(
      lowerMessage
    ) ||
    /\?/.test(message)
  ) {
    markers.push('médio');
    return 'medium';
  }

  return 'low';
};

/**
 * Detecta poder de decisão (chave para locador/locatário)
 */
const detectDecisionPower = (
  message: string,
  markers: string[]
): AdvancedSentimentAnalysis['decisionPower'] => {
  const lowerMessage = message.toLowerCase();

  // Commanding (provável locador)
  if (
    /\b(preciso que|você deve|faça|obrigatório|necessário|importante|fundamental|sem falta|autorizo|permito|aprovado|liberado)\b/i.test(
      lowerMessage
    ) ||
    /[A-Z]{2,}/.test(message) ||
    /\b(cobrar|pagar|vencimento|aluguel|contrato|regras|normas)\b/i.test(
      lowerMessage
    )
  ) {
    markers.push('commanding');
    return 'commanding';
  }

  // Requesting (provável locatário)
  if (
    /\b(peço|solicito|gostaria|posso|seria possível|tem como|pode|autorização|permissão|vistoria|reparo|manutenção|problema)\b/i.test(
      lowerMessage
    ) ||
    /\?/.test(message)
  ) {
    markers.push('requesting');
    return 'requesting';
  }

  return 'neutral';
};

/**
 * Calcula confiança da análise
 */
const calculateConfidence = (
  message: string,
  emotion: AdvancedSentimentAnalysis['emotion'],
  tone: AdvancedSentimentAnalysis['tone'],
  intent: AdvancedSentimentAnalysis['intent'],
  urgency: AdvancedSentimentAnalysis['urgency'],
  decisionPower: AdvancedSentimentAnalysis['decisionPower']
): number => {
  let confidence = 0.5; // Base

  // Aumentar confiança baseado em marcadores claros
  if (emotion !== 'neutral') confidence += 0.1;
  if (tone !== 'informal') confidence += 0.1;
  if (intent !== 'information') confidence += 0.1;
  if (urgency !== 'low') confidence += 0.1;
  if (decisionPower !== 'neutral') confidence += 0.2;

  // Ajustar baseado no tamanho da mensagem
  if (message.length > 50) confidence += 0.05;
  if (message.length > 100) confidence += 0.05;

  // Ajustar baseado em pontuação
  if (/[!?]{2,}/.test(message)) confidence += 0.1;
  if (/[A-Z]{2,}/.test(message)) confidence += 0.1;

  return Math.min(confidence, 1.0);
};

/**
 * Detecta locador/locatário baseado em análise de sentimento
 */
export const detectSenderWithSentiment = (message: string): DetectionResult => {
  const sentiment = analyzeAdvancedSentiment(message);
  const lowerMessage = message.toLowerCase();

  let sender: 'locador' | 'locatario' | 'unknown' = 'unknown';
  let confidence = 0;
  let reasoning = '';

  // Análise baseada em poder de decisão
  if (sentiment.decisionPower === 'commanding') {
    sender = 'locador';
    confidence = 0.8;
    reasoning = 'Tom autoritário e uso de comandos diretos indica locador';
  } else if (sentiment.decisionPower === 'requesting') {
    sender = 'locatario';
    confidence = 0.8;
    reasoning = 'Tom deferente e uso de solicitações indica locatário';
  }

  // Análise contextual adicional
  const locadorContext =
    /\b(cobrar|pagar|vencimento|aluguel|contrato|regras|normas|aprovado|autorizado|liberado)\b/i.test(
      lowerMessage
    );
  const locatarioContext =
    /\b(vistoria|reparo|manutenção|problema|defeito|autorização|permissão|solicito|peço)\b/i.test(
      lowerMessage
    );

  if (locadorContext && !locatarioContext) {
    if (sender === 'locador') {
      confidence = Math.min(confidence + 0.1, 1.0);
      reasoning += ' + contexto de cobrança/aprovação';
    } else {
      sender = 'locador';
      confidence = 0.7;
      reasoning = 'Contexto de cobrança/aprovação indica locador';
    }
  } else if (locatarioContext && !locadorContext) {
    if (sender === 'locatario') {
      confidence = Math.min(confidence + 0.1, 1.0);
      reasoning += ' + contexto de solicitação/manutenção';
    } else {
      sender = 'locatario';
      confidence = 0.7;
      reasoning = 'Contexto de solicitação/manutenção indica locatário';
    }
  }

  // Ajustar confiança baseada na análise geral
  confidence = Math.min(confidence + sentiment.confidence * 0.2, 1.0);

  return {
    sender,
    confidence,
    reasoning,
  };
};

/**
 * Extrai marcadores contextuais específicos para cada papel
 */
export const extractContextualMarkers = (
  message: string,
  role: 'locador' | 'locatario'
): string[] => {
  const lowerMessage = message.toLowerCase();
  const markers: string[] = [];

  if (role === 'locador') {
    if (/\b(cobrar|pagar|vencimento|aluguel|contrato)\b/i.test(lowerMessage))
      markers.push('financeiro');
    if (/\b(regras|normas|obrigatório|necessário)\b/i.test(lowerMessage))
      markers.push('regulamentação');
    if (/\b(aprovado|autorizado|liberado|permito)\b/i.test(lowerMessage))
      markers.push('autoridade');
  } else {
    if (/\b(vistoria|reparo|manutenção|problema)\b/i.test(lowerMessage))
      markers.push('manutenção');
    if (/\b(autorização|permissão|solicito|peço)\b/i.test(lowerMessage))
      markers.push('solicitação');
    if (/\b(defeito|quebrado|não funciona)\b/i.test(lowerMessage))
      markers.push('problema');
  }

  return markers;
};
