/**
 * Tipos para o sistema de chat dual locador/locatário
 */

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  retryCount?: number;
  status?: 'sending' | 'sent' | 'error' | 'retrying';
  error?: string;
  audioUrl?: string;
  audioData?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    audioDuration?: number;
    transcription?: string;
    analysis?: any;
    adaptiveResponse?: boolean;
  };
}

export interface DualMessage {
  id: string;
  originalMessage: string;
  locadorResponse: Message;
  locatarioResponse: Message;
  timestamp: Date;
  detectedSender: 'locador' | 'locatario' | 'unknown';
  names: {
    locador?: string;
    locatario?: string;
  };
  sessionGreetingUsed: boolean;
}

export interface DualChatState {
  messages: DualMessage[];
  hasUsedGreeting: boolean;
  sessionNames: {
    locador?: string;
    locatario?: string;
  };
}

export interface DualResponseResult {
  locadorResponse: string;
  locatarioResponse: string;
  detectedSender: 'locador' | 'locatario' | 'unknown';
  extractedNames: {
    locador?: string;
    locatario?: string;
  };
}
