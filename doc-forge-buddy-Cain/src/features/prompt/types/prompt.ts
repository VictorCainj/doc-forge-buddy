/**
 * Tipos TypeScript para o sistema de expansão de prompts
 * Inclui funcionalidades de aprendizado inteligente e analytics
 */

// Tipos básicos existentes
export interface PromptEnhancementRequest {
  userInput: string;
  context?: {
    contractId?: string;
    documentType?: string;
    userPreferences?: Record<string, any>;
  };
  options?: {
    detailLevel: 'basic' | 'detailed' | 'comprehensive';
    tone?: 'professional' | 'casual' | 'formal';
    language?: 'pt-BR' | 'en';
  };
}

export interface PromptSection {
  title: string;
  content: string;
  order: number;
}

export interface PromptVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  context: {
    sections: PromptSection[];
    variables: PromptVariable[];
    suggestedImprovements: string[];
  };
  metadata: {
    tokenCount: number;
    complexity: 'low' | 'medium' | 'high';
    createdAt: string;
    model: string;
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  variables: PromptVariable[];
  tags: string[];
  created_at?: string;
  user_id?: string;
  is_favorite?: boolean;
}

export interface PromptHistoryItem {
  id: string;
  user_id: string;
  original_input: string;
  enhanced_prompt: string;
  context: {
    sections: PromptSection[];
    variables: PromptVariable[];
    suggestedImprovements: string[];
  };
  metadata: {
    tokenCount: number;
    complexity: 'low' | 'medium' | 'high';
    model: string;
  };
  created_at: string;
  is_favorite?: boolean;
}

// Novos tipos para Sistema de Aprendizado Inteligente
export interface LearningEvent {
  id: string;
  user_id: string;
  session_id: string;
  action_type: 'prompt_created' | 'prompt_used' | 'feedback_given' | 'template_applied';
  prompt_original: string;
  prompt_enhanced: string;
  context_data: Record<string, any>;
  effectiveness_score: number; // 0-1
  completion_rate: number; // 0-1
  time_spent_seconds: number;
  user_satisfaction: number; // 1-5
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface PromptAnalytics {
  id: string;
  user_id: string;
  date: string;
  total_prompts_created: number;
  total_prompts_used: number;
  average_effectiveness: number;
  average_completion_rate: number;
  most_used_categories: Record<string, number>;
  most_effective_patterns: Record<string, number>;
  improvement_suggestions: string[];
  benchmark_comparison: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PromptPattern {
  id: string;
  pattern_type: 'context_pattern' | 'user_preference' | 'effectiveness_pattern';
  pattern_data: Record<string, any>;
  frequency: number;
  effectiveness_score: number;
  user_segment: 'beginner' | 'intermediate' | 'advanced';
  confidence_level: number; // 0-1
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptBenchmark {
  id: string;
  category: string;
  metric_name: string; // 'effectiveness', 'completion_rate', 'user_satisfaction'
  user_value: number;
  benchmark_value: number;
  percentile_rank: number; // 1-100
  comparison_text: string;
  created_at: string;
}

// Tipos para análise de eficácia
export interface EffectivenessAnalysis {
  overall: number; // 0-1
  breakdown: {
    userSatisfaction: number; // 0-1
    completionRate: number; // 0-1
    timeEfficiency: number; // 0-1
    contextRelevance: number; // 0-1
  };
  grade: 'Excelente' | 'Muito Bom' | 'Bom' | 'Regular' | 'Precisa Melhorar';
  recommendations: string[];
}

// Tipos para recomendações personalizadas
export interface PersonalizedRecommendations {
  promptImprovements: string[];
  templateSuggestions: string[];
  bestPractices: string[];
  skillDevelopment: string[];
  personalizedTips: string[];
}

// Tipos para heatmap de eficácia
export interface EffectivenessHeatmap {
  data: Record<string, Record<string, number>>; // {day: {hour: effectiveness}}
  insights: string[];
  recommendations: string[];
}

// Tipos para análise de tendências
export interface TrendAnalysis {
  trends: Array<{
    month: string;
    totalPrompts: number;
    averageEffectiveness: number;
    averageSatisfaction: number;
  }>;
  temporalPatterns: {
    byDayOfWeek: Record<number, number>;
    byHour: Record<number, number>;
    byTimeOfDay: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
  };
  predictions: Array<{
    metric: string;
    prediction: 'increasing' | 'decreasing' | 'stable';
    confidence: 'low' | 'medium' | 'high';
  }>;
  insights: string[];
}

// Tipos para performance de prompts individuais
export interface PromptPerformance {
  individualAnalysis: Array<{
    id: string;
    originalPrompt: string;
    effectiveness: number;
    completionRate: number;
    userSatisfaction: number;
    context: any;
    performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  }>;
  successPatterns: {
    commonElements: string[];
    averageLength: number;
    commonTags: string[];
  };
  recommendations: string[];
  bestPerformingPrompts: Array<{
    id: string;
    prompt: string;
    effectiveness: number;
    reasons: string[];
  }>;
}

// Tipos para dashboard de analytics
export interface AnalyticsDashboard {
  summaryMetrics: {
    totalPrompts: number;
    averageEffectiveness: number;
    averageCompletionRate: number;
    averageSatisfaction: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
  keyInsights: string[];
  charts: {
    effectivenessTrend: Array<{
      week: string;
      effectiveness: number;
      count: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
    }>;
    timeDistribution: Array<{
      time: string;
      count: number;
    }>;
    performanceHeatmap: EffectivenessHeatmap;
  };
  recommendations: Array<{
    type: 'effectiveness' | 'satisfaction' | 'trend';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Tipos para comparação com benchmarks
export interface BenchmarkComparison {
  userMetrics: PromptAnalytics[];
  globalBenchmarks: PromptBenchmark[];
  comparison: Record<string, {
    user: number;
    global: number;
    difference: number;
    status: 'above' | 'below' | 'equal';
  }>;
  percentileRanks: {
    effectiveness: number;
    completionRate: number;
    userSatisfaction: number;
  };
  competitiveAnalysis: {
    ranking: string;
    strengths: string[];
    improvementAreas: string[];
    recommendations: string[];
  };
}

// Tipos para relatórios automáticos
export interface WeeklyReport {
  type: 'weekly';
  period: string;
  summary: {
    totalPrompts: number;
    averageEffectiveness: number;
    topCategory: string;
  };
  insights: string[];
  recommendations: string[];
}

export interface MonthlyReport {
  type: 'monthly';
  period: string;
  summary: {
    totalPrompts: number;
    averageEffectiveness: number;
    improvementTrend: 'upward' | 'stable' | 'downward';
  };
  keyAchievements: string[];
  recommendations: string[];
}

export interface PerformanceReport {
  type: 'performance';
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  benchmarks: {
    userRank: string;
    percentileScores: {
      effectiveness: number;
      creativity: number;
      consistency: number;
    };
  };
}

export interface ImprovementReport {
  type: 'improvement';
  focusAreas: Array<{
    area: string;
    currentScore: number;
    targetScore: number;
    actions: string[];
  }>;
  progress: {
    thisWeek: string;
    thisMonth: string;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export type AutomaticReport = WeeklyReport | MonthlyReport | PerformanceReport | ImprovementReport | ComprehensiveReport;

export interface ComprehensiveReport extends WeeklyReport, PerformanceReport, ImprovementReport {
  type: 'comprehensive';
}

// Tipos para padrões de aprendizado
export interface LearningPattern {
  mostUsedCategories: Record<string, number>;
  effectivenessTrends: Array<{ date: string; score: number }>;
  commonImprovements: Record<string, number>;
  timePatterns: Record<string, number>;
  userSatisfactionTrend: Array<{ date: string; satisfaction: number }>;
}

// Tipos para feedback adaptativo
export interface AdaptiveFeedback {
  provideFeedback: (
    promptId: string,
    originalPrompt: string,
    enhancedPrompt: string,
    context: any,
    result: any,
    timeSpent: number
  ) => Promise<EffectivenessAnalysis | null>;
  
  getRealTimeRecommendations: (
    currentPrompt: string,
    context: any
  ) => Promise<string[]>;
}

// Tipos para construtor visual de prompts
export interface PromptBlock {
  id: string;
  type: 'instruction' | 'context' | 'example' | 'constraint' | 'output_format' | 'variable';
  content: string;
  order: number;
  isRequired: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  };
}

export interface VisualPromptBuilder {
  blocks: PromptBlock[];
  variables: PromptVariable[];
  metadata: {
    complexity: 'low' | 'medium' | 'high';
    estimatedTokens: number;
    categories: string[];
  };
}

export interface DragDropAction {
  type: 'move' | 'duplicate' | 'delete' | 'add';
  sourceIndex?: number;
  targetIndex?: number;
  blockType?: string;
  blockContent?: string;
}

// Tipos para análise de contexto
export interface ContextAnalysis {
  relevance: number; // 0-1
  completeness: number; // 0-1
  clarity: number; // 0-1
  specificity: number; // 0-1
  suggestions: string[];
  detectedEntities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

// Tipos para validação inteligente
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  improvements: string[];
}

// Exportações de tipos para facilitar importação
export type LearningActionType = LearningEvent['action_type'];
export type UserSegment = PromptPattern['user_segment'];
export type PerformanceGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type EffectivenessGrade = EffectivenessAnalysis['grade'];
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type PredictionConfidence = 'low' | 'medium' | 'high';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type ValidationSeverity = 'low' | 'medium' | 'high';

