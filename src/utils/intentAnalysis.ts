import OpenAI from 'openai';
import { log } from '@/utils/logger';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
});

export type IntentType = 
  | 'question'          // Pergunta sobre informação
  | 'command'           // Comando ou instrução
  | 'analysis'          // Solicita análise de dados
  | 'generation'        // Geração de conteúdo (texto, imagem)
  | 'conversation'      // Conversação casual
  | 'clarification'     // Pedido de esclarecimento
  | 'feedback';         // Feedback ou avaliação

export interface Entity {
  type: 'date' | 'person' | 'location' | 'money' | 'organization' | 'other';
  value: string;
  confidence: number;
}

export interface IntentAnalysisResult {
  intent: IntentType;
  confidence: number;
  entities: Entity[];
  requiresContext: boolean;
  suggestedAction: string;
}

/**
 * Analisa a intenção do usuário em uma mensagem
 */
export async function analyzeIntent(
  message: string,
  conversationHistory?: string[]
): Promise<IntentAnalysisResult> {
  try {
    log.debug('Analisando intenção da mensagem');

    const context = conversationHistory?.slice(-5).join('\n') || '';
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em análise de intenção de mensagens.
          
Analise a mensagem do usuário e identifique:
1. INTENÇÃO PRINCIPAL (uma das seguintes):
   - question: pergunta sobre informação
   - command: comando ou instrução para executar
   - analysis: solicita análise de dados ou contratos
   - generation: geração de conteúdo (texto, imagem, documento)
   - conversation: conversação casual ou social
   - clarification: pedido de esclarecimento sobre algo anterior
   - feedback: feedback ou avaliação de resposta anterior

2. ENTIDADES IMPORTANTES (se houver):
   - Datas, pessoas, locais, valores monetários, organizações

3. SE REQUER CONTEXTO: a pergunta precisa do histórico da conversa?

4. AÇÃO SUGERIDA: qual a melhor forma de responder?

Responda APENAS com JSON válido no formato:
{
  "intent": "tipo_de_intencao",
  "confidence": 0.95,
  "entities": [{"type": "date", "value": "amanhã", "confidence": 0.9}],
  "requiresContext": true,
  "suggestedAction": "buscar no histórico e responder"
}`,
        },
        {
          role: 'user',
          content: `${context ? `Histórico recente:\n${context}\n\n` : ''}Mensagem atual: ${message}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    log.debug('Intenção analisada', result);

    return {
      intent: result.intent || 'conversation',
      confidence: result.confidence || 0.5,
      entities: result.entities || [],
      requiresContext: result.requiresContext || false,
      suggestedAction: result.suggestedAction || 'responder normalmente',
    };
  } catch (error) {
    log.error('Erro ao analisar intenção', error);
    
    // Fallback: análise simples baseada em palavras-chave
    return analyzeIntentFallback(message);
  }
}

/**
 * Análise de intenção simplificada (fallback)
 */
function analyzeIntentFallback(message: string): IntentAnalysisResult {
  const lowerMessage = message.toLowerCase();

  // Detectar perguntas
  if (lowerMessage.includes('?') || 
      lowerMessage.startsWith('qual') ||
      lowerMessage.startsWith('como') ||
      lowerMessage.startsWith('quando') ||
      lowerMessage.startsWith('onde') ||
      lowerMessage.startsWith('quem') ||
      lowerMessage.startsWith('por que')) {
    return {
      intent: 'question',
      confidence: 0.8,
      entities: [],
      requiresContext: lowerMessage.includes('isso') || lowerMessage.includes('aquilo'),
      suggestedAction: 'buscar informação e responder',
    };
  }

  // Detectar comandos
  if (lowerMessage.startsWith('crie') ||
      lowerMessage.startsWith('faça') ||
      lowerMessage.startsWith('gere') ||
      lowerMessage.startsWith('mostre') ||
      lowerMessage.startsWith('liste')) {
    return {
      intent: 'command',
      confidence: 0.7,
      entities: [],
      requiresContext: false,
      suggestedAction: 'executar comando solicitado',
    };
  }

  // Detectar análise
  if (lowerMessage.includes('analis') || lowerMessage.includes('verific')) {
    return {
      intent: 'analysis',
      confidence: 0.75,
      entities: [],
      requiresContext: true,
      suggestedAction: 'buscar dados relevantes e analisar',
    };
  }

  // Detectar geração
  if (lowerMessage.includes('gere uma imagem') || lowerMessage.includes('crie um documento')) {
    return {
      intent: 'generation',
      confidence: 0.8,
      entities: [],
      requiresContext: false,
      suggestedAction: 'gerar conteúdo solicitado',
    };
  }

  // Default: conversação
  return {
    intent: 'conversation',
    confidence: 0.6,
    entities: [],
    requiresContext: false,
    suggestedAction: 'responder de forma natural',
  };
}

/**
 * Extrai entidades específicas de uma mensagem
 */
export function extractEntities(message: string): Entity[] {
  const entities: Entity[] = [];

  // Detectar datas relativas
  const datePatterns = [
    { pattern: /hoje|agora/i, value: 'hoje' },
    { pattern: /amanhã/i, value: 'amanhã' },
    { pattern: /ontem/i, value: 'ontem' },
    { pattern: /próxima semana/i, value: 'próxima semana' },
    { pattern: /mês que vem/i, value: 'próximo mês' },
  ];

  datePatterns.forEach(({ pattern, value }) => {
    if (pattern.test(message)) {
      entities.push({ type: 'date', value, confidence: 0.9 });
    }
  });

  // Detectar valores monetários
  const moneyPattern = /R\$\s*[\d,.]+/g;
  const moneyMatches = message.match(moneyPattern);
  if (moneyMatches) {
    moneyMatches.forEach(match => {
      entities.push({ type: 'money', value: match, confidence: 0.95 });
    });
  }

  return entities;
}
