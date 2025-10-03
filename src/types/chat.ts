/**
 * Tipos específicos para chat e histórico
 * Elimina o uso de 'any' em chat-related types
 */

export type ChatRole = 'user' | 'assistant';
export type ChatMode = 'normal' | 'intelligent' | 'analysis';
export type EmotionalState = 'positive' | 'neutral' | 'negative' | 'excited' | 'frustrated';

/**
 * Interface para mensagens serializadas (localStorage)
 */
export interface SerializedMessage {
  id: string;
  content: string;
  role: ChatRole;
  timestamp: string; // ISO string
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

/**
 * Interface para mensagens em runtime
 */
export interface ChatMessage {
  id: string;
  content: string;
  role: ChatRole;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

/**
 * Interface para metadados de sessão
 */
export interface ChatMetadata {
  contractCount?: number;
  documentsGenerated?: number;
  averageResponseTime?: number;
  totalTokens?: number;
  lastActivity?: string;
  tags?: string[];
  analysisType?: string;
  insights?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
  suggestions?: string[];
  contractReferences?: string[];
}

/**
 * Interface para sessões serializadas (localStorage)
 */
export interface SerializedChatSession {
  id: string;
  title: string;
  messages: SerializedMessage[];
  mode: ChatMode;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  metadata?: ChatMetadata;
}

/**
 * Interface para sessões em runtime
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: ChatMode;
  createdAt: Date;
  updatedAt: Date;
  metadata?: ChatMetadata;
}

/**
 * Interface para estatísticas de chat
 */
export interface ChatStats {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  mostUsedMode: ChatMode;
  totalTokensUsed: number;
  averageResponseTime: number;
}

/**
 * Interface para configurações de chat
 */
export interface ChatConfig {
  maxSessions: number;
  maxMessagesPerSession: number;
  autoSaveInterval: number;
  defaultMode: ChatMode;
  enableAnalytics: boolean;
}

/**
 * Interface para insights de chat
 */
export interface ChatInsight {
  type: 'pattern' | 'suggestion' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Type guards para validação de tipos
 */
export const isChatMessage = (obj: unknown): obj is ChatMessage => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'role' in obj &&
    'timestamp' in obj &&
    obj.timestamp instanceof Date
  );
};

export const isSerializedMessage = (obj: unknown): obj is SerializedMessage => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'role' in obj &&
    'timestamp' in obj &&
    typeof (obj as SerializedMessage).timestamp === 'string'
  );
};

export const isChatSession = (obj: unknown): obj is ChatSession => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'messages' in obj &&
    'mode' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    (obj as ChatSession).createdAt instanceof Date &&
    (obj as ChatSession).updatedAt instanceof Date
  );
};
