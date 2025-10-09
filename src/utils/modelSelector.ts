import { IntentType } from './intentAnalysis';
import { log } from './logger';

export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';

export interface ModelSelectionResult {
  model: AIModel;
  reason: string;
  maxTokens: number;
  temperature: number;
}

interface TaskComplexity {
  complexity: 'simple' | 'moderate' | 'complex';
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresAccuracy: boolean;
}

/**
 * Seleciona o modelo ideal baseado na intenção e complexidade da tarefa
 */
export function selectModel(
  intent: IntentType,
  messageLength: number,
  hasContext: boolean = false
): ModelSelectionResult {
  log.debug('Selecionando modelo', { intent, messageLength, hasContext });

  const complexity = analyzeComplexity(intent, messageLength, hasContext);

  // GPT-4o: Para tarefas complexas, análises profundas, raciocínio avançado
  if (complexity.complexity === 'complex' || complexity.requiresReasoning) {
    return {
      model: 'gpt-4o',
      reason: 'Tarefa complexa requer raciocínio avançado',
      maxTokens: 4000,
      temperature: 0.7,
    };
  }

  // GPT-4o-mini: Para tarefas moderadas, conversação normal, perguntas simples
  if (complexity.complexity === 'moderate' || intent === 'conversation') {
    return {
      model: 'gpt-4o-mini',
      reason: 'Tarefa moderada, modelo mini é suficiente',
      maxTokens: 2000,
      temperature: 0.7,
    };
  }

  // GPT-3.5-turbo: Para tarefas muito simples (fallback)
  return {
    model: 'gpt-3.5-turbo',
    reason: 'Tarefa simples',
    maxTokens: 1000,
    temperature: 0.6,
  };
}

/**
 * Analisa a complexidade de uma tarefa
 */
function analyzeComplexity(
  intent: IntentType,
  messageLength: number,
  hasContext: boolean
): TaskComplexity {
  // Análises sempre são complexas
  if (intent === 'analysis') {
    return {
      complexity: 'complex',
      requiresReasoning: true,
      requiresCreativity: false,
      requiresAccuracy: true,
    };
  }

  // Geração de conteúdo requer criatividade
  if (intent === 'generation') {
    return {
      complexity: 'moderate',
      requiresReasoning: false,
      requiresCreativity: true,
      requiresAccuracy: false,
    };
  }

  // Perguntas com contexto podem ser complexas
  if (intent === 'question' && hasContext) {
    return {
      complexity: 'moderate',
      requiresReasoning: true,
      requiresCreativity: false,
      requiresAccuracy: true,
    };
  }

  // Mensagens longas tendem a ser mais complexas
  if (messageLength > 500) {
    return {
      complexity: 'moderate',
      requiresReasoning: true,
      requiresCreativity: false,
      requiresAccuracy: true,
    };
  }

  // Conversação casual é simples
  return {
    complexity: 'simple',
    requiresReasoning: false,
    requiresCreativity: false,
    requiresAccuracy: false,
  };
}

/**
 * Ajusta parâmetros do modelo baseado em preferências do usuário
 */
export function adjustModelParameters(
  baseResult: ModelSelectionResult,
  preferences: {
    verbosity?: 'concise' | 'balanced' | 'detailed';
    creativity?: number; // 0-1
    formality?: 'casual' | 'neutral' | 'formal';
  }
): ModelSelectionResult {
  const adjusted = { ...baseResult };

  // Ajustar max_tokens baseado em verbosidade
  if (preferences.verbosity === 'concise') {
    adjusted.maxTokens = Math.floor(baseResult.maxTokens * 0.6);
  } else if (preferences.verbosity === 'detailed') {
    adjusted.maxTokens = Math.floor(baseResult.maxTokens * 1.5);
  }

  // Ajustar temperature baseado em criatividade
  if (preferences.creativity !== undefined) {
    adjusted.temperature = Math.min(1.0, Math.max(0.0, preferences.creativity));
  }

  log.debug('Parâmetros do modelo ajustados', adjusted);

  return adjusted;
}

/**
 * Fornece fallback em caso de erro
 */
export function getFallbackModel(): ModelSelectionResult {
  return {
    model: 'gpt-4o-mini',
    reason: 'Fallback após erro',
    maxTokens: 2000,
    temperature: 0.7,
  };
}
