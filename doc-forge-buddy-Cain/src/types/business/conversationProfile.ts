/**
 * Tipos para perfis de comunicação conversacional
 */

export interface ConversationProfile {
  personId: string;
  personName: string;
  personType: 'locador' | 'locatario';
  contractId?: string;
  communicationStyle: {
    formality: 'formal' | 'informal' | 'neutral';
    typicalTone: 'friendly' | 'professional' | 'direct' | 'empathetic';
    vocabularyLevel: 'simple' | 'intermediate' | 'complex';
  };
  emotionalHistory: Array<{
    message: string;
    detectedEmotion: string;
    timestamp: Date;
  }>;
  messagePatterns: {
    commonQuestions: string[];
    typicalGreetings: string[];
    responsePreferences: string[];
  };
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAnalysis {
  emotion:
    | 'positive'
    | 'negative'
    | 'neutral'
    | 'frustrated'
    | 'concerned'
    | 'grateful'
    | 'urgent';
  formality: 'formal' | 'informal' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  intent:
    | 'question'
    | 'complaint'
    | 'request'
    | 'greeting'
    | 'gratitude'
    | 'complaint'
    | 'information';
  context: string;
  suggestedTone:
    | 'empathetic'
    | 'professional'
    | 'friendly'
    | 'direct'
    | 'reassuring';
  confidence: number;
}

export interface ContextualData {
  contractId?: string;
  personName?: string;
  personType?: 'locador' | 'locatario';
  relevantInfo?: {
    address?: string;
    contractNumber?: string;
    dates?: {
      start?: string;
      end?: string;
      inspection?: string;
    };
    values?: {
      rent?: string;
      deposit?: string;
    };
  };
}

export interface AdaptiveResponse {
  text: string;
  tone: string;
  emotion: string;
  confidence: number;
  audioUrl?: string;
  suggestions?: string[];
}
