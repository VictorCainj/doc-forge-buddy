/**
 * Hook para chat adaptativo com análise emocional e geração de respostas humanizadas
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useConversationProfiles } from '@/hooks/useConversationProfiles';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/utils/logger';
import { prepareInputForProcessing } from '@/utils/inputValidator';
import {
  generateAdaptiveResponse,
  validateResponse,
} from '@/utils/responseGenerator';
import { MessageAnalysis } from '@/types/conversationProfile';
import { ChatMode, CHAT_MODE_CONFIGS } from '@/types/chatModes';
import { Contract } from '@/types/contract';
import { Message } from '@/types/dualChat';

// Removido interface Message duplicada - usando a do dualChat.ts

interface UseAdaptiveChatReturn {
  // Estados básicos
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  inputText: string;
  setInputText: (text: string) => void;

  // Modos de chat
  currentMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;

  // Contrato ativo
  activeContract: Contract | null;
  setActiveContract: (contract: Contract | null) => void;

  // Análise emocional
  lastAnalysis: MessageAnalysis | null;
  showEmotionalPanel: boolean;
  setShowEmotionalPanel: (show: boolean) => void;

  // Funcionalidades do chat
  sendMessage: (text?: string) => Promise<void>;
  generateResponse: (text: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearChat: () => void;

  // Upload de arquivos
  uploadImage: (file: File) => Promise<void>;
  uploadMultipleImages: (files: File[]) => Promise<void>;
  uploadAudio: (file: File) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;

  // Sessões
  saveCurrentSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  currentSessionId: string | null;

  // Feedback
  sendFeedback: (
    messageId: string,
    feedback: 'positive' | 'negative'
  ) => Promise<void>;
}

export const useAdaptiveChat = (): UseAdaptiveChatReturn => {
  // Estados principais do chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode>(
    ChatMode.RESPONSE_GEN
  );
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<MessageAnalysis | null>(
    null
  );
  const [showEmotionalPanel, setShowEmotionalPanel] = useState(false);

  // Hooks
  const { toast } = useToast();
  const {
    isLoading: aiLoading,
    error: aiError,
  } = useOpenAI();
  useAIMemory('default');
  const { createSession, saveMessage, loadSessionMessages } =
    useChatPersistence();
  const {
    activeProfile,
    learnFromMessage,
  } = useConversationProfiles();

  // Refs
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const messageCacheRef = useRef<Map<string, Message>>(new Map());

  // Configuração do modo atual
  const modeConfig = CHAT_MODE_CONFIGS[currentMode];

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

      messageCacheRef.current.set(message.id, message);
      return message;
    },
    []
  );

  // Função removida - não precisamos mais de conversa livre

  // Função principal para enviar mensagem - apenas geração de respostas
  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputText.trim();

      if (!messageText || aiLoading) return;

      // Validar entrada do usuário
      const { input: sanitizedInput, validation } = prepareInputForProcessing(
        messageText,
        'intelligent'
      );

      if (!validation.isValid) {
        toast({
          title: 'Entrada inválida',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // Criar mensagem do usuário
      const userMessage = createMessage(sanitizedInput, 'user');
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');

      // Criar mensagem temporária do assistente
      const assistantMessage = createMessage('', 'assistant', {
        status: 'sending',
      });
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Gerar resposta adaptativa
        const adaptiveResponse = await generateAdaptiveResponse(
          sanitizedInput,
          activeProfile,
          activeContract,
          modeConfig.enableTTS
        );

        // Validar resposta
        const validationResult = validateResponse(adaptiveResponse.text);
        if (!validationResult.isValid) {
          log.warn('Resposta gerada tem problemas:', validationResult.issues);
        }

        // Atualizar mensagem do assistente
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: adaptiveResponse.text,
                  status: 'sent',
                  audioUrl: adaptiveResponse.audioUrl,
                  metadata: {
                    model: 'gpt-4o-adaptive',
                    tokens: adaptiveResponse.text.length,
                    analysis: {
                      emotion: adaptiveResponse.emotion as any,
                      formality: 'neutral',
                      urgency: 'low',
                      intent: 'information',
                      context: '',
                      suggestedTone: adaptiveResponse.tone as any,
                      confidence: adaptiveResponse.confidence,
                    },
                    adaptiveResponse: true,
                  },
                }
              : msg
          )
        );

        // Definir análise para o painel emocional
        setLastAnalysis(adaptiveResponse.metadata?.analysis || null);

        // Aprender com a interação se houver perfil ativo
        if (activeProfile) {
          try {
            await learnFromMessage(
              activeProfile.personId,
              sanitizedInput,
              adaptiveResponse.text
            );
          } catch (error) {
            log.warn('Erro ao aprender com mensagem:', error);
          }
        }

        toast({
          title: 'Resposta gerada',
          description: 'Resposta humanizada gerada com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content:
                    'Desculpe, não consegui gerar uma resposta adequada.',
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: 'Erro na geração',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [
      inputText,
      aiLoading,
      createMessage,
      activeProfile,
      activeContract,
      modeConfig.enableTTS,
      toast,
      learnFromMessage,
    ]
  );

  // Função para gerar resposta adaptativa (alias para sendMessage)
  const generateResponse = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  // Funcionalidades de upload removidas - não necessárias para gerador de respostas

  // Função para upload de múltiplas imagens removida

  // Função para upload de áudio removida

  // Função para gerar imagem removida

  // Função para retry de mensagem específica
  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== 'assistant') return;

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
        const userMessageIndex =
          messages.findIndex((m) => m.id === messageId) - 1;
        const userMessage =
          userMessageIndex >= 0 ? messages[userMessageIndex] : null;

        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('Mensagem do usuário não encontrada');
        }

        // Sempre gerar resposta adaptativa
          const adaptiveResponse = await generateAdaptiveResponse(
            userMessage.content,
            activeProfile,
            activeContract,
            modeConfig.enableTTS
          );
        const response = adaptiveResponse.text;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: response,
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
    [messages, activeProfile, activeContract, modeConfig.enableTTS]
  );

  // Função para limpar chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setInputText('');
    setCurrentSessionId(null);
    setLastAnalysis(null);
    messageCacheRef.current.clear();

    toast({
      title: 'Conversa limpa',
      description: 'A conversa foi limpa com sucesso.',
    });
  }, [toast]);

  // Função para salvar sessão atual
  const saveCurrentSession = useCallback(async () => {
    if (messages.length === 0) {
      toast({
        title: 'Nada para salvar',
        description: 'Não há mensagens nesta conversa.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let sessionId = currentSessionId;

      if (!sessionId) {
        sessionId = await createSession('adaptive');
        if (!sessionId) throw new Error('Falha ao criar sessão');
        setCurrentSessionId(sessionId);
      }

      for (const message of messages) {
        await saveMessage(sessionId, message);
      }

      toast({
        title: 'Conversa salva',
        description: 'Sua conversa foi salva com sucesso!',
      });
    } catch (error) {
      log.error('Erro ao salvar sessão:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a conversa.',
        variant: 'destructive',
      });
    }
  }, [messages, currentSessionId, createSession, saveMessage, toast]);

  // Função para carregar sessão
  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const loadedMessages = await loadSessionMessages(sessionId);

        const convertedMessages = loadedMessages.map((msg) => ({
          ...msg,
          imageData: msg.imageData || undefined,
          audioData: (msg as any).audioData || undefined,
        })) as Message[];

        setMessages(convertedMessages);
        setCurrentSessionId(sessionId);

        toast({
          title: 'Conversa carregada',
          description: `${convertedMessages.length} mensagens carregadas.`,
        });
      } catch (error) {
        log.error('Erro ao carregar sessão:', error);
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar a conversa.',
          variant: 'destructive',
        });
      }
    },
    [loadSessionMessages, toast]
  );

  // Função para enviar feedback
  const sendFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative') => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !activeProfile) return;

      try {
        const userMessage = messages[messages.indexOf(message) - 1];
        if (userMessage) {
          await learnFromMessage(
            activeProfile.personId,
            userMessage.content,
            message.content,
            feedback
          );
        }

        toast({
          title: 'Feedback enviado',
          description: 'Obrigado pelo feedback! Isso nos ajuda a melhorar.',
        });
      } catch (error) {
        log.error('Erro ao enviar feedback:', error);
        toast({
          title: 'Erro ao enviar feedback',
          description: 'Não foi possível processar seu feedback.',
          variant: 'destructive',
        });
      }
    },
    [messages, activeProfile, learnFromMessage, toast]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading: aiLoading,
    error: aiError,
    inputText,
    setInputText,
    currentMode,
    setChatMode: setCurrentMode,
    activeContract,
    setActiveContract,
    lastAnalysis,
    showEmotionalPanel,
    setShowEmotionalPanel,
    sendMessage,
    generateResponse,
    retryMessage,
    clearChat,
    // Upload de arquivos (removidos - não necessários para gerador)
    uploadImage: async () => {},
    uploadMultipleImages: async () => {},
    uploadAudio: async () => {},
    generateImage: async () => {},
    saveCurrentSession,
    loadSession,
    currentSessionId,
    sendFeedback,
  };
};
