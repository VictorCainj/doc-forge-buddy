/**
 * Humanizador de respostas baseado em análise de sentimento
 */

import {
  AdvancedSentimentAnalysis,
  HumanizationStrategy,
} from '@/types/sentimentAnalysis';

/**
 * Humaniza uma resposta baseada no sentimento do remetente
 */
export const humanizeResponse = (
  originalResponse: string,
  senderSentiment: AdvancedSentimentAnalysis,
  recipientRole: 'locador' | 'locatario'
): string => {
  const strategy = determineHumanizationStrategy(
    senderSentiment,
    recipientRole
  );

  // Aplicar ajustes pontuais sem reescrever completamente
  let humanizedResponse = originalResponse;

  // Ajustar saudação baseada no tom
  humanizedResponse = adjustGreeting(
    humanizedResponse,
    senderSentiment,
    strategy
  );

  // Ajustar tom de abertura baseado na emoção
  humanizedResponse = adjustOpeningTone(
    humanizedResponse,
    senderSentiment,
    strategy
  );

  // Ajustar encerramento baseado no papel
  humanizedResponse = adjustClosing(
    humanizedResponse,
    senderSentiment,
    recipientRole,
    strategy
  );

  return humanizedResponse;
};

/**
 * Determina estratégia de humanização
 */
const determineHumanizationStrategy = (
  sentiment: AdvancedSentimentAnalysis,
  recipientRole: 'locador' | 'locatario'
): HumanizationStrategy => {
  let mirrorLevel = 0.3; // Base: espelhar 30% do estilo
  let professionalismFloor = 0.7; // Base: manter 70% de profissionalismo
  let toneAdjustment = 'professional';

  // Ajustar espelhamento baseado no tom do remetente
  if (sentiment.tone === 'formal') {
    mirrorLevel = 0.5;
    toneAdjustment = 'formal';
  } else if (sentiment.tone === 'casual') {
    mirrorLevel = 0.2;
    professionalismFloor = 0.8;
    toneAdjustment = 'friendly_professional';
  } else if (sentiment.tone === 'authoritative') {
    mirrorLevel = 0.4;
    toneAdjustment = 'respectful';
  }

  // Ajustar baseado na emoção
  if (sentiment.emotion === 'frustrated') {
    mirrorLevel = 0.4;
    toneAdjustment = 'empathetic_professional';
  } else if (sentiment.emotion === 'urgent') {
    mirrorLevel = 0.6;
    toneAdjustment = 'direct_professional';
  } else if (sentiment.emotion === 'concerned') {
    mirrorLevel = 0.5;
    toneAdjustment = 'reassuring_professional';
  }

  // Ajustar baseado no papel do destinatário
  if (recipientRole === 'locador') {
    professionalismFloor = Math.max(professionalismFloor, 0.8);
    toneAdjustment = 'respectful_' + toneAdjustment;
  }

  return {
    mirrorLevel,
    professionalismFloor,
    toneAdjustment,
  };
};

/**
 * Ajusta saudação baseada no tom
 */
const adjustGreeting = (
  response: string,
  sentiment: AdvancedSentimentAnalysis,
  strategy: HumanizationStrategy
): string => {
  const lowerResponse = response.toLowerCase();

  // Se já tem saudação, não alterar
  if (
    lowerResponse.includes('bom dia') ||
    lowerResponse.includes('boa tarde') ||
    lowerResponse.includes('boa noite') ||
    lowerResponse.includes('olá')
  ) {
    return response;
  }

  let greeting = '';

  if (strategy.toneAdjustment.includes('formal')) {
    greeting = 'Bom dia, ';
  } else if (strategy.toneAdjustment.includes('friendly')) {
    greeting = 'Olá! ';
  } else if (sentiment.emotion === 'urgent') {
    greeting = 'Olá, ';
  } else {
    greeting = 'Bom dia, ';
  }

  return greeting + response;
};

/**
 * Ajusta tom de abertura baseado na emoção
 */
const adjustOpeningTone = (
  response: string,
  sentiment: AdvancedSentimentAnalysis,
  _strategy: HumanizationStrategy
): string => {
  const lowerResponse = response.toLowerCase();

  // Se já tem reconhecimento emocional, não alterar
  if (
    lowerResponse.includes('entendo') ||
    lowerResponse.includes('compreendo') ||
    lowerResponse.includes('reconheço') ||
    lowerResponse.includes('percebo')
  ) {
    return response;
  }

  let emotionalAcknowledgment = '';

  if (sentiment.emotion === 'frustrated') {
    emotionalAcknowledgment = 'Entendo sua preocupação. ';
  } else if (sentiment.emotion === 'urgent') {
    emotionalAcknowledgment = 'Entendo a urgência da situação. ';
  } else if (sentiment.emotion === 'concerned') {
    emotionalAcknowledgment = 'Compreendo sua preocupação. ';
  } else if (sentiment.emotion === 'satisfied') {
    emotionalAcknowledgment = 'Fico feliz em saber. ';
  }

  if (emotionalAcknowledgment) {
    // Inserir após a saudação
    const greetingMatch = response.match(/^(Bom dia,|Olá!|Olá,)\s*/);
    if (greetingMatch) {
      return response.replace(
        greetingMatch[0],
        greetingMatch[0] + emotionalAcknowledgment
      );
    } else {
      return emotionalAcknowledgment + response;
    }
  }

  return response;
};

/**
 * Ajusta encerramento baseado no papel
 */
const adjustClosing = (
  response: string,
  sentiment: AdvancedSentimentAnalysis,
  recipientRole: 'locador' | 'locatario',
  strategy: HumanizationStrategy
): string => {
  const lowerResponse = response.toLowerCase();

  // Se já tem encerramento, não alterar
  if (
    lowerResponse.includes('atenciosamente') ||
    lowerResponse.includes('cordiais') ||
    lowerResponse.includes('obrigado') ||
    lowerResponse.includes('disponível')
  ) {
    return response;
  }

  let closing = '';

  if (recipientRole === 'locador') {
    if (strategy.toneAdjustment.includes('formal')) {
      closing = '\n\nAtenciosamente,';
    } else {
      closing = '\n\nEstou à disposição para qualquer esclarecimento.';
    }
  } else {
    if (sentiment.emotion === 'urgent') {
      closing = '\n\nQualquer dúvida, estou disponível.';
    } else if (strategy.toneAdjustment.includes('friendly')) {
      closing = '\n\nQualquer coisa, é só falar!';
    } else {
      closing = '\n\nEstou à disposição para ajudar.';
    }
  }

  return response + closing;
};

/**
 * Aplica ajustes de tom baseado na estratégia
 */
export const applyToneAdjustments = (
  text: string,
  strategy: HumanizationStrategy
): string => {
  let adjustedText = text;

  // Ajustar formalidade
  if (strategy.toneAdjustment.includes('formal')) {
    adjustedText = adjustToFormal(adjustedText);
  } else if (strategy.toneAdjustment.includes('friendly')) {
    adjustedText = adjustToFriendly(adjustedText);
  }

  // Ajustar baseado em emoção
  if (strategy.toneAdjustment.includes('empathetic')) {
    adjustedText = addEmpathy(adjustedText);
  } else if (strategy.toneAdjustment.includes('direct')) {
    adjustedText = makeDirect(adjustedText);
  } else if (strategy.toneAdjustment.includes('reassuring')) {
    adjustedText = addReassurance(adjustedText);
  }

  return adjustedText;
};

/**
 * Ajusta texto para tom formal
 */
const adjustToFormal = (text: string): string => {
  return text
    .replace(/\b(ok|okay)\b/gi, 'entendido')
    .replace(/\b(beleza|tranquilo)\b/gi, 'perfeito')
    .replace(/\b(valeu|obrigado)\b/gi, 'obrigado')
    .replace(/\b(oi|olá)\b/gi, 'bom dia');
};

/**
 * Ajusta texto para tom amigável
 */
const adjustToFriendly = (text: string): string => {
  return text
    .replace(/\b(entendido)\b/gi, 'ok')
    .replace(/\b(perfeito)\b/gi, 'beleza')
    .replace(/\b(bom dia)\b/gi, 'olá');
};

/**
 * Adiciona empatia ao texto
 */
const addEmpathy = (text: string): string => {
  if (
    !text.toLowerCase().includes('entendo') &&
    !text.toLowerCase().includes('compreendo')
  ) {
    return 'Entendo sua situação. ' + text;
  }
  return text;
};

/**
 * Torna o texto mais direto
 */
const makeDirect = (text: string): string => {
  return text
    .replace(/\b(seria possível|gostaria de|poderia)\b/gi, 'pode')
    .replace(/\b(quando for conveniente)\b/gi, 'quando possível')
    .replace(/\b(na medida do possível)\b/gi, 'assim que possível');
};

/**
 * Adiciona tranquilização ao texto
 */
const addReassurance = (text: string): string => {
  if (
    !text.toLowerCase().includes('tranquilo') &&
    !text.toLowerCase().includes('calma')
  ) {
    return text.replace(/\.$/, '. Fique tranquilo, vamos resolver isso.');
  }
  return text;
};
