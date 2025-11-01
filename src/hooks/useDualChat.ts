// @ts-nocheck
/**
 * Hook para chat dual locador/locatário
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  generateDualResponses,
  analyzeWhatsAppImage,
} from '@/utils/responseGenerator';
import { DualMessage, DualChatState, Message } from '@/types/dualChat';
import { supabase } from '@/integrations/supabase/client';
import { uploadChatImage } from '@/utils/imageUpload';

interface UseDualChatReturn {
  // Estados básicos
  dualMessages: DualMessage[];
  isLoading: boolean;
  error: string | null;
  inputText: string;
  setInputText: (text: string) => void;

  // Estados do chat dual
  dualChatState: DualChatState;

  // Ações principais
  sendDualMessage: (text?: string) => Promise<void>;
  sendDualAudio: (audioFile: File) => Promise<void>;
  sendDualImage: (file: File) => Promise<void>;
  clearDualChat: () => void;

  // Persistência
  saveCurrentSession: () => void;
  loadSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

export const useDualChat = (): UseDualChatReturn => {
  // Estados principais
  const [dualMessages, setDualMessages] = useState<DualMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Estado do chat dual
  const [dualChatState, setDualChatState] = useState<DualChatState>({
    messages: [],
    hasUsedGreeting: false,
    sessionNames: {},
  });

  const { toast } = useToast();

  // Gerar ID único para mensagem
  const generateMessageId = useCallback(() => {
    return `dual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Criar mensagem individual
  const createMessage = useCallback(
    (content: string, role: 'user' | 'assistant', metadata?: any): Message => {
      return {
        id: generateMessageId(),
        content,
        role,
        timestamp: new Date(),
        status: 'sent',
        metadata,
      };
    },
    [generateMessageId]
  );

  // Enviar mensagem dual
  const sendDualMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputText.trim();

      if (!messageText || isLoading) return;

      setIsLoading(true);
      setError(null);

      // 1. Criar mensagem dual temporária
      const dualMessageId = generateMessageId();

      try {
        const tempDualMessage: DualMessage = {
          id: dualMessageId,
          originalMessage: messageText,
          locadorResponse: createMessage('', 'assistant', {
            status: 'sending',
          }),
          locatarioResponse: createMessage('', 'assistant', {
            status: 'sending',
          }),
          timestamp: new Date(),
          detectedSender: 'unknown',
          names: dualChatState.sessionNames,
          sessionGreetingUsed: dualChatState.hasUsedGreeting,
        };

        setDualMessages((prev) => [...prev, tempDualMessage]);
        setInputText('');

        // 2. Gerar respostas duais
        const result = await generateDualResponses(
          messageText,
          dualChatState.sessionNames,
          null, // Contract - pode ser adicionado depois
          dualChatState.hasUsedGreeting
        );

        // 3. Atualizar mensagem dual com respostas
        const finalDualMessage: DualMessage = {
          ...tempDualMessage,
          locadorResponse: createMessage(result.locadorResponse, 'assistant', {
            status: 'sent',
            model: 'gpt-4o-dual',
            tokens: result.locadorResponse.length,
          }),
          locatarioResponse: createMessage(
            result.locatarioResponse,
            'assistant',
            {
              status: 'sent',
              model: 'gpt-4o-dual',
              tokens: result.locatarioResponse.length,
            }
          ),
          detectedSender: result.detectedSender,
          names: {
            ...dualChatState.sessionNames,
            ...result.extractedNames,
          },
        };

        // 4. Atualizar estado
        setDualMessages((prev) =>
          prev.map((msg) => (msg.id === dualMessageId ? finalDualMessage : msg))
        );

        // 5. Atualizar estado do chat dual
        setDualChatState((prev) => ({
          ...prev,
          hasUsedGreeting: true,
          sessionNames: {
            ...prev.sessionNames,
            ...result.extractedNames,
          },
        }));

        toast({
          title: 'Respostas geradas',
          description:
            'Respostas para locador e locatário geradas com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        toast({
          title: 'Erro na geração',
          description: errorMessage,
          variant: 'destructive',
        });

        // Remover mensagem temporária em caso de erro
        setDualMessages((prev) =>
          prev.filter((msg) => msg.id !== dualMessageId)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      inputText,
      isLoading,
      dualChatState,
      generateMessageId,
      createMessage,
      toast,
    ]
  );

  // Enviar áudio dual
  const sendDualAudio = useCallback(
    async (audioFile: File) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Transcrever áudio usando a função correta
        const { transcribeAudioWithAI } = await import('@/utils/openai');
        const transcription = await transcribeAudioWithAI(audioFile);

        if (!transcription) {
          throw new Error('Não foi possível transcrever o áudio');
        }

        // 2. Enviar transcrição como mensagem
        await sendDualMessage(transcription);

        toast({
          title: 'Áudio processado',
          description: 'Áudio transcrito e respostas geradas com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        toast({
          title: 'Erro no áudio',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sendDualMessage, toast]
  );

  // Enviar imagem dual
  const sendDualImage = useCallback(
    async (file: File) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Obter usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para enviar imagens.',
            variant: 'destructive',
          });
          return;
        }

        // 2. Upload para Supabase Storage
        const uploadResult = await uploadChatImage(file, user.id);

        // 3. Analisar imagem com IA (extrair texto do WhatsApp)
        const extractedText = await analyzeWhatsAppImage(uploadResult.base64);

        // 4. Enviar texto extraído como mensagem dual
        await sendDualMessage(extractedText);

        // 5. Atualizar última mensagem com referência à imagem
        setDualMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              originalImage: {
                url: uploadResult.url,
                base64: uploadResult.base64,
              },
            },
          ];
        });

        toast({
          title: 'Imagem processada',
          description: 'Texto extraído e respostas geradas com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        toast({
          title: 'Erro na imagem',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sendDualMessage, toast]
  );

  // Limpar chat dual
  const clearDualChat = useCallback(() => {
    setDualMessages([]);
    setDualChatState({
      messages: [],
      hasUsedGreeting: false,
      sessionNames: {},
    });
    setError(null);
    setInputText('');

    toast({
      title: 'Chat limpo',
      description: 'Histórico de conversas foi limpo.',
    });
  }, [toast]);

  // Salvar sessão atual
  const saveCurrentSession = useCallback(() => {
    const sessionData = {
      messages: dualMessages,
      state: dualChatState,
      timestamp: new Date().toISOString(),
    };

    const sessionId = `dual_session_${Date.now()}`;
    localStorage.setItem(`dual_chat_${sessionId}`, JSON.stringify(sessionData));
    setCurrentSessionId(sessionId);

    toast({
      title: 'Sessão salva',
      description: 'Sessão salva com sucesso!',
    });
  }, [dualMessages, dualChatState, toast]);

  // Carregar sessão
  const loadSession = useCallback(
    (sessionId: string) => {
      try {
        const sessionData = localStorage.getItem(`dual_chat_${sessionId}`);

        if (!sessionData) {
          throw new Error('Sessão não encontrada');
        }

        const parsed = JSON.parse(sessionData);

        setDualMessages(parsed.messages || []);
        setDualChatState(
          parsed.state || {
            messages: [],
            hasUsedGreeting: false,
            sessionNames: {},
          }
        );
        setCurrentSessionId(sessionId);

        toast({
          title: 'Sessão carregada',
          description: 'Sessão carregada com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao carregar sessão';

        toast({
          title: 'Erro ao carregar',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return {
    dualMessages,
    isLoading,
    error,
    inputText,
    setInputText,
    dualChatState,
    sendDualMessage,
    sendDualAudio,
    sendDualImage,
    clearDualChat,
    saveCurrentSession,
    loadSession,
    currentSessionId,
  };
};
