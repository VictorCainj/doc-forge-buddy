import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: 'normal' | 'intelligent' | 'analysis';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    contractCount?: number;
    analysisType?: string;
    insights?: string[];
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isCorrected?: boolean;
  isImproved?: boolean;
  isAnalysis?: boolean;
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
    suggestions?: string[];
    contractReferences?: string[];
  };
}

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
  updateCurrentSession: (messages: ChatMessage[], metadata?: any) => void;
  searchSessions: (query: string) => ChatSession[];
  getSessionInsights: (sessionId: string) => string[];
  exportSession: (sessionId: string) => string;
  importSession: (data: string) => ChatSession | null;
}

const STORAGE_KEY = 'chat-sessions';
const MAX_SESSIONS = 50;

export const useChatHistory = (): UseChatHistoryReturn => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Carregar sessões do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSessions = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar sessões no localStorage
  const saveToStorage = useCallback((newSessions: ChatSession[]) => {
    try {
      // Manter apenas as últimas MAX_SESSIONS
      const sessionsToSave = newSessions
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_SESSIONS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
      setSessions(sessionsToSave);
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error);
    }
  }, []);

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
    (messages: ChatMessage[], metadata?: any) => {
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
            timestamp: new Date(msg.timestamp),
          })),
        };

        const updatedSessions = [newSession, ...sessions];
        saveToStorage(updatedSessions);
        return newSession;
      } catch (error) {
        console.error('Erro ao importar sessão:', error);
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
