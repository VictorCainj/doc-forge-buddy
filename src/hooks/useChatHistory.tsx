import { useState, useEffect, useCallback } from 'react';
import { log } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';
import { 
  ChatSession, 
  ChatMessage, 
  SerializedChatSession, 
  SerializedMessage,
  ChatMode,
  ChatStats 
} from '@/types/chat';

// Tipos importados de @/types/chat

interface UseChatHistoryReturn {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  createNewSession: (
    mode: 'normal' | 'intelligent' | 'analysis'
  ) => ChatSession;
  saveSession: (session: ChatSession) => void;
  loadSession: (sessionId: string) => ChatSession | null;
  deleteSession: (sessionId: string) => void;
  updateCurrentSession: (
    messages: ChatMessage[],
    metadata?: Record<string, unknown>
  ) => void;
  searchSessions: (query: string) => ChatSession[];
  getSessionInsights: (sessionId: string) => string[];
  exportSession: (sessionId: string) => string;
  importSession: (data: string) => ChatSession | null;
}

const STORAGE_KEY = 'chat-sessions';
const MAX_SESSIONS = 50;

export const useChatHistory = (): UseChatHistoryReturn => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Usar o hook de localStorage para gerenciar as sessões
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>(STORAGE_KEY, [], {
    deserialize: (value: string) => {
      const parsed: SerializedChatSession[] = JSON.parse(value);
      return parsed.map((session: SerializedChatSession): ChatSession => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: SerializedMessage): ChatMessage => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    },
    onError: (error) => log.error('Erro no localStorage do chat:', error),
  });

  // Inicializar loading
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Salvar sessões com limite
  const saveToStorage = useCallback((newSessions: ChatSession[]) => {
    // Manter apenas as últimas MAX_SESSIONS
    const sessionsToSave = newSessions
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, MAX_SESSIONS);

    setSessions(sessionsToSave);
  }, [setSessions]);

  // Criar nova sessão
  const createNewSession = useCallback(
    (mode: 'normal' | 'intelligent' | 'analysis'): ChatSession => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const modeTitles = {
        normal: 'Conversa Normal',
        intelligent: 'Conversa Inteligente',
        analysis: 'Análise de Contratos',
      };

      const welcomeMessages: ChatMessage[] = [
        {
          id: 'welcome',
          content:
            mode === 'analysis'
              ? 'Olá! Sou seu assistente especializado em análise de contratos. Tenho acesso completo a todos os dados dos seus contratos e posso fornecer insights profundos e análises detalhadas. Como posso ajudar você hoje?'
              : mode === 'intelligent'
                ? 'Olá! Sou seu assistente inteligente para melhoria de textos. Posso ajudar a melhorar a clareza, estrutura e impacto dos seus textos. Cole ou digite o texto que deseja melhorar!'
                : 'Olá! Sou seu assistente para correção de textos. Posso ajudar com gramática, ortografia e estilo. Cole ou digite o texto que deseja corrigir!',
          role: 'assistant',
          timestamp: now,
        },
      ];

      const newSession: ChatSession = {
        id: sessionId,
        title: `${modeTitles[mode]} - ${now.toLocaleDateString('pt-BR')}`,
        messages: welcomeMessages,
        mode,
        createdAt: now,
        updatedAt: now,
        metadata: {
          contractCount: 0,
          analysisType: mode,
          insights: [],
        },
      };

      const updatedSessions = [newSession, ...sessions];
      saveToStorage(updatedSessions);
      setCurrentSession(newSession);

      return newSession;
    },
    [sessions, saveToStorage]
  );

  // Salvar sessão
  const saveSession = useCallback(
    (session: ChatSession) => {
      const updatedSession = {
        ...session,
        updatedAt: new Date(),
      };

      const updatedSessions = sessions.map((s) =>
        s.id === session.id ? updatedSession : s
      );

      saveToStorage(updatedSessions);
      setCurrentSession(updatedSession);
    },
    [sessions, saveToStorage]
  );

  // Carregar sessão
  const loadSession = useCallback(
    (sessionId: string): ChatSession | null => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
      }
      return session || null;
    },
    [sessions]
  );

  // Deletar sessão
  const deleteSession = useCallback(
    (sessionId: string) => {
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      saveToStorage(updatedSessions);

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    },
    [sessions, currentSession, saveToStorage]
  );

  // Atualizar sessão atual
  const updateCurrentSession = useCallback(
    (messages: ChatMessage[], metadata?: Record<string, unknown>) => {
      if (!currentSession) return;

      const updatedSession: ChatSession = {
        ...currentSession,
        messages,
        updatedAt: new Date(),
        metadata: {
          ...currentSession.metadata,
          ...metadata,
        },
      };

      // Atualizar título baseado no conteúdo
      if (messages.length > 1) {
        const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
        if (lastUserMessage) {
          const shortContent = lastUserMessage.content.substring(0, 50);
          updatedSession.title = `${currentSession.mode === 'analysis' ? 'Análise' : currentSession.mode === 'intelligent' ? 'Inteligente' : 'Normal'}: ${shortContent}${shortContent.length === 50 ? '...' : ''}`;
        }
      }

      saveSession(updatedSession);
    },
    [currentSession, saveSession]
  );

  // Buscar sessões
  const searchSessions = useCallback(
    (query: string): ChatSession[] => {
      const lowerQuery = query.toLowerCase();
      return sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(lowerQuery) ||
          session.messages.some((msg) =>
            msg.content.toLowerCase().includes(lowerQuery)
          )
      );
    },
    [sessions]
  );

  // Obter insights da sessão
  const getSessionInsights = useCallback(
    (sessionId: string): string[] => {
      const session = sessions.find((s) => s.id === sessionId);
      return session?.metadata?.insights || [];
    },
    [sessions]
  );

  // Exportar sessão
  const exportSession = useCallback(
    (sessionId: string): string => {
      const session = sessions.find((s) => s.id === sessionId);
      return session ? JSON.stringify(session, null, 2) : '';
    },
    [sessions]
  );

  // Importar sessão
  const importSession = useCallback(
    (data: string): ChatSession | null => {
      try {
        const session = JSON.parse(data);
        const newSession: ChatSession = {
          ...session,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(session.createdAt || Date.now()),
          updatedAt: new Date(),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp as string),
          })),
        };

        const updatedSessions = [newSession, ...sessions];
        saveToStorage(updatedSessions);
        return newSession;
      } catch (error) {
        log.error('Erro ao importar sessão:', error);
        return null;
      }
    },
    [sessions, saveToStorage]
  );

  return {
    sessions,
    currentSession,
    isLoading,
    createNewSession,
    saveSession,
    loadSession,
    deleteSession,
    updateCurrentSession,
    searchSessions,
    getSessionInsights,
    exportSession,
    importSession,
  };
};
