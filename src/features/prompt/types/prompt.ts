/**
 * Tipos TypeScript para o sistema de expansão de prompts
 */

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

