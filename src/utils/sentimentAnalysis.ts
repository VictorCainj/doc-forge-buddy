// @ts-nocheck
/**
 * Utilitários para análise de sentimento e contexto emocional
 */

import { MessageAnalysis } from '@/types/conversationProfile';

/**
 * Analisa uma mensagem para detectar emoção, formalidade e intenção
 */
export const analyzeMessageContext = async (
  message: string
): Promise<MessageAnalysis> => {
  // Análise básica usando regex para casos simples
  const basicAnalysis = performBasicAnalysis(message);

  // Para casos complexos, seria ideal usar IA, mas por ora usamos heurísticas
  const emotion = detectEmotion(message);
  const formality = detectFormality(message);
  const urgency = detectUrgency(message);
  const intent = detectIntent(message);
  const context = extractContext(message);
  const suggestedTone = suggestTone(emotion, intent);
  const confidence = calculateConfidence(basicAnalysis, emotion, formality);

  return {
    emotion,
    formality,
    urgency,
    intent,
    context,
    suggestedTone,
    confidence,
  };
};

/**
 * Análise básica usando padrões de texto
 */
const performBasicAnalysis = (message: string) => {
  const words = message.toLowerCase().split(/\s+/);
  const length = words.length;

  return {
    wordCount: length,
    hasQuestionWords:
      /\b(que|qual|como|quando|onde|porque|porquê|quanto|quem)\b/i.test(
        message
      ),
    hasExclamation: /!+/.test(message),
    hasCapitalLetters: /[A-Z]{2,}/.test(message),
    hasMultipleExclamations: /!{2,}/.test(message),
    hasUrgentWords: /\b(urgente|rapido|agora|já|imediato|emergencia)\b/i.test(
      message
    ),
    hasPoliteWords:
      /\b(por favor|obrigado|obrigada|desculpe|com licença)\b/i.test(message),
    hasFormalWords:
      /\b(prezado|prezada|senhor|senhora|att|atenciosamente)\b/i.test(message),
    hasInformalWords: /\b(oi|ola|tchau|beleza|tranquilo|suave)\b/i.test(
      message
    ),
  };
};

/**
 * Detecta emoção baseada em padrões de texto
 */
const detectEmotion = (message: string): MessageAnalysis['emotion'] => {
  const lowerMessage = message.toLowerCase();

  // Frustrado/Irritado
  if (
    /\b(irritado|chateado|frustrado|nervoso|revoltado|indignado|reclamação|reclamo)\b/i.test(
      lowerMessage
    ) ||
    /!{2,}/.test(message) ||
    /[A-Z]{3,}/.test(message)
  ) {
    return 'frustrated';
  }

  // Preocupado/Ansioso
  if (
    /\b(preocupado|ansioso|preocupação|medo|temor|nervoso|inquieto)\b/i.test(
      lowerMessage
    ) ||
    /\b(será que|e se|tomara que)\b/i.test(lowerMessage)
  ) {
    return 'concerned';
  }

  // Urgente
  if (
    /\b(urgente|rapido|agora|já|imediato|emergencia|preciso|necessito)\b/i.test(
      lowerMessage
    ) ||
    /\b(quanto antes|o mais rapido|pra ontem)\b/i.test(lowerMessage)
  ) {
    return 'urgent';
  }

  // Grato
  if (
    /\b(obrigado|obrigada|grato|grata|valeu|obrigadao|obrigadinha)\b/i.test(
      lowerMessage
    ) ||
    /\b(muito obrigado|muito obrigada)\b/i.test(lowerMessage)
  ) {
    return 'grateful';
  }

  // Positivo
  if (
    /\b(otimo|excelente|perfeito|maravilhoso|fantastico|bom|boa|beleza)\b/i.test(
      lowerMessage
    ) ||
    /😊|😃|😄|👍|❤️/.test(message)
  ) {
    return 'positive';
  }

  // Negativo (mas não frustrado)
  if (
    /\b(ruim|péssimo|horrivel|decepcionado|triste|chateado)\b/i.test(
      lowerMessage
    ) ||
    /😞|😢|👎|💔/.test(message)
  ) {
    return 'negative';
  }

  return 'neutral';
};

/**
 * Detecta nível de formalidade
 */
const detectFormality = (message: string): MessageAnalysis['formality'] => {
  const lowerMessage = message.toLowerCase();

  // Formal
  if (
    /\b(prezado|prezada|senhor|senhora|att|atenciosamente|cordiais|saudações)\b/i.test(
      lowerMessage
    ) ||
    /\b(solicito|venho por meio|gostaria de solicitar)\b/i.test(lowerMessage) ||
    /\.{3,}/.test(message) // Muitos pontos
  ) {
    return 'formal';
  }

  // Informal
  if (
    /\b(oi|ola|tchau|beleza|tranquilo|suave|e aí|fala|blz)\b/i.test(
      lowerMessage
    ) ||
    /\b(opa|eita|nossa|caramba|poxa)\b/i.test(lowerMessage) ||
    /kkk|rs|hehe|haha/.test(lowerMessage) ||
    /[a-z]{2,}[a-z]+[a-z]{2,}/.test(lowerMessage) // Palavras em minúsculas
  ) {
    return 'informal';
  }

  // Por padrão, sempre retornar formal para respostas mais profissionais
  return 'formal';
};

/**
 * Detecta nível de urgência
 */
const detectUrgency = (message: string): MessageAnalysis['urgency'] => {
  const lowerMessage = message.toLowerCase();

  if (
    /\b(urgente|emergencia|agora|já|imediato|rapido|quanto antes|pra ontem)\b/i.test(
      lowerMessage
    ) ||
    /!{2,}/.test(message) ||
    /[A-Z]{3,}/.test(message)
  ) {
    return 'high';
  }

  if (
    /\b(preciso|necessito|importante|seria bom|quando der|assim que possivel)\b/i.test(
      lowerMessage
    ) ||
    /!/.test(message)
  ) {
    return 'medium';
  }

  return 'low';
};

/**
 * Detecta intenção da mensagem
 */
const detectIntent = (message: string): MessageAnalysis['intent'] => {
  const lowerMessage = message.toLowerCase();

  // Pergunta
  if (
    /\?/.test(message) ||
    /\b(que|qual|como|quando|onde|porque|porquê|quanto|quem|pode|seria|tem como)\b/i.test(
      lowerMessage
    )
  ) {
    return 'question';
  }

  // Reclamação
  if (
    /\b(reclamação|reclamo|problema|erro|falha|não funcionou|não está certo)\b/i.test(
      lowerMessage
    ) ||
    /\b(não gostei|não concordo|discordo|insatisfeito)\b/i.test(lowerMessage)
  ) {
    return 'complaint';
  }

  // Solicitação
  if (
    /\b(solicito|peço|gostaria|quero|preciso|necessito|favor)\b/i.test(
      lowerMessage
    ) ||
    /\b(por favor|pode|seria possível|tem como)\b/i.test(lowerMessage)
  ) {
    return 'request';
  }

  // Agradecimento
  if (
    /\b(obrigado|obrigada|grato|grata|valeu|obrigadao|obrigadinha)\b/i.test(
      lowerMessage
    ) ||
    /\b(muito obrigado|muito obrigada)\b/i.test(lowerMessage)
  ) {
    return 'gratitude';
  }

  // Saudação
  if (
    /\b(oi|ola|bom dia|boa tarde|boa noite|olá|e aí|fala)\b/i.test(lowerMessage)
  ) {
    return 'greeting';
  }

  return 'information';
};

/**
 * Extrai contexto da mensagem
 */
const extractContext = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  // Contextos comuns em imobiliária
  const contexts = [];

  if (/\b(tinta|pintura|cor|pintar)\b/i.test(lowerMessage)) {
    contexts.push('pintura');
  }

  if (/\b(vistoria|inspeção|verificação)\b/i.test(lowerMessage)) {
    contexts.push('vistoria');
  }

  if (/\b(contrato|aluguel|locacao|locatario|locador)\b/i.test(lowerMessage)) {
    contexts.push('contrato');
  }

  if (/\b(manutencao|reparo|conserto|problema|defeito)\b/i.test(lowerMessage)) {
    contexts.push('manutenção');
  }

  if (/\b(pagamento|conta|valor|preco|dinheiro)\b/i.test(lowerMessage)) {
    contexts.push('financeiro');
  }

  if (/\b(chave|entrada|acesso)\b/i.test(lowerMessage)) {
    contexts.push('acesso');
  }

  return contexts.join(', ') || 'geral';
};

/**
 * Sugere tom de resposta baseado na emoção e intenção
 */
const suggestTone = (
  emotion: MessageAnalysis['emotion'],
  intent: MessageAnalysis['intent']
): MessageAnalysis['suggestedTone'] => {
  if (emotion === 'frustrated' || emotion === 'concerned') {
    return 'empathetic';
  }

  if (intent === 'complaint') {
    return 'reassuring';
  }

  if (intent === 'greeting' || emotion === 'positive') {
    return 'professional';
  }

  if (intent === 'question' || intent === 'request') {
    return 'professional';
  }

  // Por padrão, sempre usar tom profissional
  return 'professional';
};

/**
 * Calcula confiança da análise
 */
const calculateConfidence = (
  basicAnalysis: ReturnType<typeof performBasicAnalysis>,
  emotion: MessageAnalysis['emotion'],
  formality: MessageAnalysis['formality']
): number => {
  let confidence = 0.5; // Base

  // Aumenta confiança baseado em indicadores claros
  if (basicAnalysis.hasExclamation) confidence += 0.1;
  if (basicAnalysis.hasUrgentWords) confidence += 0.1;
  if (basicAnalysis.hasPoliteWords) confidence += 0.1;
  if (basicAnalysis.hasFormalWords) confidence += 0.1;
  if (basicAnalysis.hasInformalWords) confidence += 0.1;

  // Emoções específicas aumentam confiança
  if (emotion !== 'neutral') confidence += 0.1;

  // Formalidade detectada aumenta confiança
  if (formality !== 'neutral') confidence += 0.1;

  return Math.min(confidence, 0.95); // Máximo 95%
};

/**
 * Utilitário para combinar análises de múltiplas mensagens
 */
export const combineAnalyses = (
  analyses: MessageAnalysis[]
): MessageAnalysis => {
  if (analyses.length === 0) {
    return {
      emotion: 'neutral',
      formality: 'neutral',
      urgency: 'low',
      intent: 'information',
      context: '',
      suggestedTone: 'professional',
      confidence: 0.5,
    };
  }

  if (analyses.length === 1) {
    return analyses[0];
  }

  // Para múltiplas mensagens, usar a mais recente como base
  const latest = analyses[analyses.length - 1];

  // Ajustar confiança baseado no histórico
  const avgConfidence =
    analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

  return {
    ...latest,
    confidence: Math.max(latest.confidence, avgConfidence),
  };
};
