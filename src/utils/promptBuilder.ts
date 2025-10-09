import { IntentType } from './intentAnalysis';
import { AIMemory } from '@/hooks/useAIMemory';

export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
  contextInjection: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Constrói prompt otimizado baseado no contexto e intenção
 */
export function buildDynamicPrompt(
  userMessage: string,
  intent: IntentType,
  options: {
    memory?: AIMemory;
    relevantContext?: string;
    ragContext?: string;
    conversationHistory?: string;
  } = {}
): PromptConfig {
  const { memory, relevantContext, ragContext, conversationHistory } = options;

  // Selecionar template base por intenção
  const basePrompt = getBasePromptForIntent(intent);

  // Personalizar baseado nas preferências do usuário
  const personalizedPrompt = memory 
    ? personalizePrompt(basePrompt, memory)
    : basePrompt;

  // Construir injeção de contexto
  const contextInjection = buildContextInjection({
    relevantContext,
    ragContext,
    conversationHistory,
  });

  // Construir prompt do usuário com contexto
  const userPrompt = contextInjection 
    ? `${contextInjection}\n\nPergunta atual: ${userMessage}`
    : userMessage;

  // Ajustar parâmetros por intenção
  const { temperature, maxTokens } = getParametersForIntent(intent);

  return {
    systemPrompt: personalizedPrompt,
    userPrompt,
    contextInjection,
    temperature,
    maxTokens,
  };
}

/**
 * Obtém prompt base para cada tipo de intenção
 */
function getBasePromptForIntent(intent: IntentType): string {
  const prompts: Record<IntentType, string> = {
    question: `Você é um assistente especializado em responder perguntas de forma clara e precisa.
    
Suas características:
- Forneça respostas diretas e bem fundamentadas
- Use exemplos quando apropriado
- Se não souber, seja honesto e sugira alternativas
- Cite fontes quando disponíveis`,

    command: `Você é um assistente proativo em executar comandos e tarefas.

Suas características:
- Entenda exatamente o que o usuário quer
- Execute a tarefa de forma eficiente
- Confirme a conclusão com clareza
- Sugira próximos passos se relevante`,

    analysis: `Você é um analista especializado em dados e contratos.

Suas características:
- Analise dados de forma profunda e estruturada
- Identifique padrões e insights relevantes
- Apresente conclusões claras e acionáveis
- Use visualizações quando apropriado`,

    generation: `Você é um assistente criativo especializado em gerar conteúdo.

Suas características:
- Seja criativo mas mantenha qualidade
- Entenda o tom e estilo desejado
- Produza conteúdo completo e bem estruturado
- Revise e refine antes de entregar`,

    conversation: `Você é um assistente conversacional natural e amigável.

Suas características:
- Mantenha conversa natural e fluida
- Seja empático e atencioso
- Adapte-se ao tom do usuário
- Demonstre personalidade apropriada`,

    clarification: `Você é um assistente focado em esclarecer dúvidas.

Suas características:
- Identifique exatamente o que não está claro
- Explique de múltiplas formas se necessário
- Use analogias e exemplos
- Confirme o entendimento`,

    feedback: `Você é um assistente receptivo a feedback.

Suas características:
- Agradeça o feedback construtivamente
- Aprenda com críticas
- Ajuste respostas futuras
- Demonstre melhoria contínua`,
  };

  return prompts[intent];
}

/**
 * Personaliza prompt baseado na memória do usuário
 */
function personalizePrompt(basePrompt: string, memory: AIMemory): string {
  const { preferences, patterns } = memory;

  let personalizedPrompt = basePrompt;

  // Ajustar formalidade
  if (preferences.formality === 'formal') {
    personalizedPrompt += '\n\nTom: Use linguagem formal e profissional.';
  } else if (preferences.formality === 'casual') {
    personalizedPrompt += '\n\nTom: Use linguagem casual e descontraída.';
  }

  // Ajustar verbosidade
  if (preferences.verbosity === 'concise') {
    personalizedPrompt += '\nEstilo: Seja conciso e direto ao ponto.';
  } else if (preferences.verbosity === 'detailed') {
    personalizedPrompt += '\nEstilo: Forneça respostas detalhadas e completas.';
  }

  // Ajustar estilo de resposta
  if (preferences.responseStyle === 'technical') {
    personalizedPrompt += '\nAbordagem: Use terminologia técnica e precisa.';
  } else if (preferences.responseStyle === 'simple') {
    personalizedPrompt += '\nAbordagem: Explique de forma simples e acessível.';
  }

  // Considerar tópicos favoritos e evitados
  if (preferences.favoriteTopics.length > 0) {
    personalizedPrompt += `\n\nTópicos de interesse: ${preferences.favoriteTopics.join(', ')}`;
  }

  // Considerar padrões de uso
  if (patterns.commonQuestions.length > 0) {
    const topQuestions = patterns.commonQuestions.slice(0, 3).map(q => q.question);
    personalizedPrompt += `\n\nPerguntas frequentes do usuário: ${topQuestions.join('; ')}`;
  }

  return personalizedPrompt;
}

/**
 * Constrói injeção de contexto
 */
function buildContextInjection(contexts: {
  relevantContext?: string;
  ragContext?: string;
  conversationHistory?: string;
}): string {
  const parts: string[] = [];

  if (contexts.ragContext) {
    parts.push(`=== BASE DE CONHECIMENTO ===\n${contexts.ragContext}`);
  }

  if (contexts.relevantContext) {
    parts.push(`=== CONTEXTO RELEVANTE ===\n${contexts.relevantContext}`);
  }

  if (contexts.conversationHistory) {
    parts.push(`=== HISTÓRICO RECENTE ===\n${contexts.conversationHistory}`);
  }

  return parts.join('\n\n');
}

/**
 * Obtém parâmetros ideais para cada intenção
 */
function getParametersForIntent(intent: IntentType): {
  temperature: number;
  maxTokens: number;
} {
  const params: Record<IntentType, { temperature: number; maxTokens: number }> = {
    question: { temperature: 0.3, maxTokens: 2000 },
    command: { temperature: 0.2, maxTokens: 1500 },
    analysis: { temperature: 0.4, maxTokens: 4000 },
    generation: { temperature: 0.8, maxTokens: 3000 },
    conversation: { temperature: 0.7, maxTokens: 2000 },
    clarification: { temperature: 0.3, maxTokens: 1500 },
    feedback: { temperature: 0.5, maxTokens: 1000 },
  };

  return params[intent];
}
