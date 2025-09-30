import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/utils/logger';
import { prepareInputForProcessing } from '@/utils/inputValidator';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isCorrected?: boolean;
  isImproved?: boolean;
  isAnalysis?: boolean;
  retryCount?: number;
  status?: 'sending' | 'sent' | 'error' | 'retrying';
  error?: string;
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
    suggestions?: string[];
  };
}

interface ChatMode {
  type: 'normal' | 'intelligent' | 'analysis';
  title: string;
  description: string;
}

const CHAT_MODES: ChatMode[] = [
  {
    type: 'normal',
    title: 'Normal',
    description: 'Correção de gramática e ortografia',
  },
  {
    type: 'intelligent',
    title: 'Inteligente',
    description: 'Melhoria de clareza e estrutura',
  },
  {
    type: 'analysis',
    title: 'Análise',
    description: 'Análise de contratos e insights',
  },
];

interface UseOptimizedChatReturn {
  messages: Message[];
  currentMode: ChatMode;
  isLoading: boolean;
  error: string | null;
  inputText: string;
  setInputText: (text: string) => void;
  setMode: (mode: ChatMode) => void;
  sendMessage: (text?: string) => Promise<void>;
  correctTextAction: () => Promise<void>; // New action for text correction
  retryMessage: (messageId: string) => Promise<void>;
  clearChat: () => void;
  getSuggestions: () => string[];
  isTyping: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export const useOptimizedChat = (): UseOptimizedChatReturn => {
  // Estados principais
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<ChatMode>(CHAT_MODES[0]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('connected');

  // Hooks
  const { toast } = useToast();
  const {
    correctText,
    improveText,
    isLoading: aiLoading,
    error: aiError,
  } = useOpenAI();
  const { currentSession, createNewSession, updateCurrentSession } =
    useChatHistory();
  const { learnFromInteraction } = useAIMemory('default');

  // Refs para debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Cache de mensagens para evitar re-renderizações desnecessárias
  const messageCacheRef = useRef<Map<string, Message>>(new Map());

  // Inicializar sessão
  useEffect(() => {
    if (!currentSession) {
      createNewSession(currentMode.type);
    }
  }, [currentSession, createNewSession, currentMode.type]);

  // Atualizar sessão quando mensagens mudarem
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSession, updateCurrentSession]);

  // Detectar digitação
  useEffect(() => {
    if (inputText.trim()) {
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    };

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText]);

  // Função para criar mensagem otimizada
  const createMessage = useCallback(
    (
      content: string,
      role: 'user' | 'assistant',
      options: Partial<Message> = {}
    ): Message => {
      const message: Message = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        role,
        timestamp: new Date(),
        status: role === 'user' ? 'sent' : 'sending',
        retryCount: 0,
        ...options,
      };

      // Cache da mensagem
      messageCacheRef.current.set(message.id, message);

      return message;
    },
    []
  );

  // Função para processar texto com retry automático
  const processTextWithRetry = useCallback(
    async (
      text: string,
      mode: ChatMode,
      maxRetries: number = 3
    ): Promise<string> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setConnectionStatus('connected');

          let result: string;

          switch (mode.type) {
            case 'normal':
              result = await correctText(text);
              break;
            case 'intelligent':
              result = await improveText(text);
              break;
            case 'analysis':
              // Para análise, precisaríamos dos contratos
              result = await improveText(text); // Fallback temporário
              break;
            default:
              throw new Error('Modo de chat não suportado');
          }

          return result;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error('Erro desconhecido');

          if (attempt < maxRetries) {
            setConnectionStatus('reconnecting');

            // Delay exponencial para retry
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));

            log.warn(
              `Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`,
              lastError.message
            );
          }
        }
      }

      setConnectionStatus('disconnected');
      throw lastError || new Error('Falha após múltiplas tentativas');
    },
    [correctText, improveText]
  );

  // Função principal para enviar mensagem
  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputText.trim();

      if (!messageText || aiLoading) return;

      // Validar entrada do usuário
      const { input: sanitizedInput, validation } = prepareInputForProcessing(
        messageText,
        currentMode.type
      );

      if (!validation.isValid) {
        toast({
          title: 'Entrada inválida',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // Mostrar avisos se houver
      if (validation.warnings.length > 0) {
        toast({
          title: 'Aviso',
          description: validation.warnings.join(', '),
          variant: 'default',
        });
      }

      // Criar mensagem do usuário com entrada sanitizada
      const userMessage = createMessage(sanitizedInput, 'user');

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');

      try {
        // Criar mensagem temporária do assistente
        const assistantMessage = createMessage('', 'assistant', {
          status: 'sending',
        });

        setMessages((prev) => [...prev, assistantMessage]);

        // Processar texto
        const processedText = await processTextWithRetry(
          sanitizedInput,
          currentMode
        );

        // Atualizar mensagem do assistente com resultado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: processedText,
                  status: 'sent',
                  isCorrected: currentMode.type === 'normal',
                  isImproved: currentMode.type === 'intelligent',
                  isAnalysis: currentMode.type === 'analysis',
                  metadata: {
                    confidence: 0.9,
                    sentiment: 'positive',
                  },
                }
              : msg
          )
        );

        // Aprender com a interação
        try {
          await learnFromInteraction(sanitizedInput, processedText);
        } catch (error) {
          log.warn('Erro ao aprender com interação:', error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        // Atualizar mensagem do assistente com erro
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content:
                    'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: 'Erro no processamento',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [
      inputText,
      aiLoading,
      currentMode,
      createMessage,
      processTextWithRetry,
      learnFromInteraction,
      toast,
    ]
  );

  const correctTextAction = useCallback(async () => {
    if (!inputText.trim() || aiLoading) return;

    // Set mode to normal for correction
    setCurrentMode(CHAT_MODES[0]); // CHAT_MODES[0] is 'normal'

    // Validar entrada do usuário
    const { input: sanitizedInput, validation } = prepareInputForProcessing(
      inputText,
      'normal'
    );

    if (!validation.isValid) {
      toast({
        title: 'Entrada inválida',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    // Mostrar avisos se houver
    if (validation.warnings.length > 0) {
      toast({
        title: 'Aviso',
        description: validation.warnings.join(', '),
        variant: 'default',
      });
    }

    // Criar mensagem do usuário com entrada sanitizada
    const userMessage = createMessage(sanitizedInput, 'user');

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      // Criar mensagem temporária do assistente
      const assistantMessage = createMessage('', 'assistant', {
        status: 'sending',
      });

      setMessages((prev) => [...prev, assistantMessage]);

      // Processar texto com a função correctText
      const correctedText = await correctText(sanitizedInput);

      // Atualizar mensagem do assistente com resultado
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: correctedText,
                status: 'sent',
                isCorrected: true,
                metadata: {
                  confidence: 0.9,
                  sentiment: 'positive',
                },
              }
            : msg
        )
      );

      // Aprender com a interação
      try {
        await learnFromInteraction(sanitizedInput, correctedText);
      } catch (error) {
        log.warn('Erro ao aprender com interação:', error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      // Atualizar mensagem do assistente com erro
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content:
                  'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
                status: 'error',
                error: errorMessage,
              }
            : msg
        )
      );

      toast({
        title: 'Erro no processamento',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [inputText, aiLoading, createMessage, correctText, learnFromInteraction, toast]);

  // Função para retry de mensagem específica
  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== 'assistant') return;

      // Atualizar status para retrying
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: 'retrying',
                retryCount: (msg.retryCount || 0) + 1,
              }
            : msg
        )
      );

      try {
        // Encontrar a mensagem do usuário correspondente
        const userMessageIndex =
          messages.findIndex((m) => m.id === messageId) - 1;
        const userMessage =
          userMessageIndex >= 0 ? messages[userMessageIndex] : null;

        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('Mensagem do usuário não encontrada para retry');
        }

        // Processar novamente
        const processedText = await processTextWithRetry(
          userMessage.content,
          currentMode
        );

        // Atualizar mensagem com sucesso
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: processedText,
                  status: 'sent',
                  error: undefined,
                }
              : msg
          )
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );
      }
    },
    [messages, currentMode, processTextWithRetry]
  );

  // Função para limpar chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setInputText('');
    messageCacheRef.current.clear();

    toast({
      title: 'Conversa limpa',
      description: 'A conversa foi limpa com sucesso.',
    });
  }, [toast]);

  // Função para obter sugestões contextuais
  const getSuggestions = useCallback((): string[] => {
    if (!inputText.trim()) return [];

    // Implementar sugestões baseadas no contexto
    const suggestions = [];

    if (currentMode.type === 'normal') {
      suggestions.push('Corrigir gramática');
      suggestions.push('Verificar ortografia');
    } else if (currentMode.type === 'intelligent') {
      suggestions.push('Melhorar clareza');
      suggestions.push('Reestruturar texto');
    } else if (currentMode.type === 'analysis') {
      suggestions.push('Analisar contratos');
      suggestions.push('Gerar insights');
    }

    return suggestions;
  }, [inputText, currentMode]);

  // Função para mudar modo
  const setMode = useCallback(
    (mode: ChatMode) => {
      setCurrentMode(mode);

      // Criar nova sessão para o novo modo
      createNewSession(mode.type);

      // Limpar mensagens atuais
      setMessages([]);
      setInputText('');
    },
    [createNewSession]
  );

  // Cleanup
  useEffect(() => {
    const currentTypingTimeout = typingTimeoutRef.current;
    const currentRetryTimeout = retryTimeoutRef.current;
    
    return () => {
      if (currentTypingTimeout) {
        clearTimeout(currentTypingTimeout);
      }
      if (currentRetryTimeout) {
        clearTimeout(currentRetryTimeout);
      }
    };
  }, []);

  return {
    messages,
    currentMode,
    isLoading: aiLoading,
    error: aiError,
    inputText,
    setInputText,
    setMode,
    sendMessage,
    correctTextAction, // Added here
    retryMessage,
    clearChat,
    getSuggestions,
    isTyping,
    connectionStatus,
  };
};
