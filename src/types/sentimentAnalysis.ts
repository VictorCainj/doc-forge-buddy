/**
 * Tipos para análise de sentimento avançada
 */

export interface AdvancedSentimentAnalysis {
  emotion:
    | 'frustrated'
    | 'concerned'
    | 'urgent'
    | 'satisfied'
    | 'neutral'
    | 'confused'
    | 'assertive';
  tone:
    | 'formal'
    | 'informal'
    | 'professional'
    | 'casual'
    | 'authoritative'
    | 'deferential';
  intent:
    | 'question'
    | 'complaint'
    | 'request'
    | 'approval'
    | 'information'
    | 'negotiation'
    | 'command';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  decisionPower: 'commanding' | 'requesting' | 'neutral';
  confidence: number; // 0-1
  contextualMarkers: string[]; // palavras-chave que influenciaram a análise
}

export interface HumanizationStrategy {
  mirrorLevel: number; // 0-1, quanto espelhar o estilo
  professionalismFloor: number; // 0-1, mínimo de profissionalismo
  toneAdjustment: string; // como ajustar o tom da resposta
}

export interface DetectionResult {
  sender: 'locador' | 'locatario' | 'unknown';
  confidence: number; // 0-1
  reasoning: string; // explicação da detecção
}

export interface SentimentContext {
  message: string;
  role: 'locador' | 'locatario';
  previousMessages?: string[];
  contractContext?: {
    hasContract: boolean;
    contractType?: string;
    relationshipDuration?: string;
  };
}
