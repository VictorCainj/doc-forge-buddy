import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/utils/logger';
import { prepareInputForProcessing } from '@/utils/inputValidator';
import { uploadChatImage, uploadMultipleChatImages } from '@/utils/imageUpload';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  retryCount?: number;
  status?: 'sending' | 'sent' | 'error' | 'retrying';
  error?: string;
  imageUrl?: string;
  imageData?: string;
  audioUrl?: string;
  audioData?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    imageCount?: number;
    imageUrls?: string[];
    audioDuration?: number;
    transcription?: string;
  };
}

interface ChatMode {
  type: 'normal' | 'intelligent' | 'analysis';
  title: string;
  description: string;
}

// Chat modes configuration (exported for potential future use)
export const CHAT_MODES: ChatMode[] = [
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
  isLoading: boolean;
  error: string | null;
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: (text?: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearChat: () => void;
  uploadImage: (file: File) => Promise<void>;
  uploadMultipleImages: (files: File[]) => Promise<void>;
  uploadAudio: (file: File) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  currentSessionId: string | null;
}

export const useOptimizedChat = (): UseOptimizedChatReturn => {
  // Estados principais do chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Hooks
  const { toast } = useToast();
  const {
    chatCompletion,
    generateImageFromPrompt,
    analyzeImage,
    transcribeAudio,
    isLoading: aiLoading,
    error: aiError,
  } = useOpenAI();
  const { learnFromInteraction } = useAIMemory('default');
  const {
    createSession,
    saveMessage,
    loadSessionMessages,
  } = useChatPersistence();

  // Refs
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const messageCacheRef = useRef<Map<string, Message>>(new Map());

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

  // Função para processar mensagem conversacional com suporte a imagens
  const processConversationalMessage = useCallback(
    async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
      try {
        // Build conversation context with longer memory (last 30 messages)
        // Incluir informações sobre imagens no contexto
        const context = conversationHistory
          .slice(-30) // Last 30 messages for extended context
          .map(msg => {
            let content = msg.content;
            
            // Se a mensagem tem imagem, adicionar referência
            if (msg.imageUrl) {
              content = `[Imagem enviada: ${msg.imageUrl}]\n${content}`;
            }
            
            // Se a mensagem tem múltiplas imagens no metadata
            if (msg.metadata?.imageUrls && Array.isArray(msg.metadata.imageUrls)) {
              const imageRefs = msg.metadata.imageUrls
                .map((url: string, idx: number) => `[Imagem ${idx + 1}: ${url}]`)
                .join('\n');
              content = `${imageRefs}\n${content}`;
            }
            
            return `${msg.role}: ${content}`;
          })
          .join('\n');

        // Adicionar instruções sobre imagens se houver URLs no contexto
        const hasImages = conversationHistory.some(msg => msg.imageUrl || msg.metadata?.imageUrls);
        const systemInstruction = hasImages 
          ? `IMPORTANTE: Você tem acesso às imagens enviadas anteriormente através das URLs fornecidas. Quando o usuário pedir para analisar novamente ou fazer perguntas sobre as imagens, você PODE e DEVE se referir ao conteúdo das imagens que foram analisadas anteriormente. Use as informações da análise prévia para responder.\n\n`
          : '';

        const fullPrompt = context 
          ? `${systemInstruction}${context}\nuser: ${userMessage}\nassistant:` 
          : userMessage;

        const result = await chatCompletion(fullPrompt);
        return result;
      } catch (error) {
        log.error('Erro ao processar mensagem:', error);
        throw error;
      }
    },
    [chatCompletion]
  );

  // Função principal para enviar mensagem
  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputText.trim();

      if (!messageText || aiLoading) return;

      // Validar entrada do usuário
      const { input: sanitizedInput, validation } = prepareInputForProcessing(
        messageText,
        'intelligent' // Modo inteligente para chat conversacional
      );

      if (!validation.isValid) {
        toast({
          title: 'Entrada inválida',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // Detectar se usuário quer reanalisar uma imagem
      const reanalysisKeywords = /analise?\s+(novamente|de\s+novo|outra\s+vez|a\s+imagem|essa\s+imagem|esta\s+imagem)|veja?\s+(a\s+imagem|essa\s+imagem|esta\s+imagem)|olhe?\s+(a\s+imagem|essa\s+imagem)|re-?analise?/i;
      const wantsReanalysis = reanalysisKeywords.test(sanitizedInput);

      // Buscar última imagem no histórico
      const lastImageMessage = wantsReanalysis 
        ? [...messages].reverse().find(msg => msg.imageUrl || msg.imageData)
        : null;

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
        // Se quer reanalisar e há imagem, usar analyzeImage
        if (lastImageMessage && (lastImageMessage.imageUrl || lastImageMessage.imageData)) {
          const imageSource = lastImageMessage.imageData || lastImageMessage.imageUrl;
          if (!imageSource) {
            toast({
              title: 'Erro',
              description: 'Não foi possível encontrar a imagem',
              variant: 'destructive',
            });
            return;
          }
          const response = await analyzeImage(
            imageSource,
            sanitizedInput
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: response,
                    status: 'sent',
                    metadata: { model: 'gpt-4o-vision' },
                  }
                : msg
            )
          );
          return;
        }

        // Processar mensagem conversacional normal
        const response = await processConversationalMessage(sanitizedInput, messages);

        // Atualizar mensagem do assistente com resultado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: response,
                  status: 'sent',
                  metadata: {
                    model: 'gpt-4',
                    tokens: response.length,
                  },
                }
              : msg
          )
        );

        // Aprender com a interação
        try {
          await learnFromInteraction(sanitizedInput, response);
        } catch (error) {
          log.warn('Erro ao aprender com interação:', error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
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
    [inputText, aiLoading, messages, createMessage, processConversationalMessage, learnFromInteraction, toast]
  );

  // Função para upload de imagem
  const uploadImage = useCallback(
    async (file: File) => {
      if (aiLoading) return;

      try {
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para enviar imagens.',
            variant: 'destructive',
          });
          return;
        }

        // Upload da imagem para o Supabase Storage
        const uploadResult = await uploadChatImage(file, user.id);
        const imageUrl = uploadResult.url;
        const base64 = uploadResult.base64;

        // Criar mensagem do usuário com URL E base64 da imagem
        const userMessage = createMessage('Enviou uma imagem para análise', 'user', {
          imageUrl,      // Para exibir no chat
          imageData: base64, // Para reanálise posterior
        });
        
        setMessages((prev) => [...prev, userMessage]);

        // Criar resposta do assistente
        const assistantMessage = createMessage('Analisando imagem...', 'assistant', {
          status: 'sending',
        });
        setMessages((prev) => [...prev, assistantMessage]);

        try {
          // Processar imagem com IA usando GPT-4 Vision (usando base64, não URL)
          const response = await analyzeImage(
            base64 || imageUrl, // Preferir base64, fallback para URL
            'Analise esta imagem em detalhes. Se for um documento, extraia todas as informações relevantes. Se for uma foto, descreva o que você vê de forma completa e útil.'
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: response,
                    status: 'sent',
                    metadata: { model: 'gpt-4o-vision' },
                  }
                : msg
            )
          );

          toast({
            title: 'Imagem analisada',
            description: 'A análise foi concluída com sucesso!',
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro ao processar imagem';

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: 'Desculpe, não consegui processar esta imagem.',
                    status: 'error',
                    error: errorMessage,
                  }
                : msg
            )
          );

          toast({
            title: 'Erro ao processar imagem',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Erro ao carregar imagem',
          description: 'Não foi possível fazer upload da imagem.',
          variant: 'destructive',
        });
      }
    },
    [aiLoading, createMessage, analyzeImage, toast]
  );

  // Função para upload de múltiplas imagens
  const uploadMultipleImages = useCallback(
    async (files: File[]) => {
      if (aiLoading || files.length === 0) return;

      try {
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para enviar imagens.',
            variant: 'destructive',
          });
          return;
        }

        // Upload de todas as imagens para o Supabase Storage
        const uploadedImages = await uploadMultipleChatImages(files, user.id);

        // Criar mensagem do usuário com as imagens
        const userMessage = createMessage(
          `Enviou ${files.length} imagem(ns) para análise`,
          'user',
          {
            imageUrl: uploadedImages[0]?.url, // Primeira imagem para exibir
            imageData: uploadedImages[0]?.base64, // Base64 da primeira
            metadata: {
              imageCount: uploadedImages.length,
              imageUrls: uploadedImages.map(img => img.url),
            }
          }
        );
        
        setMessages((prev) => [...prev, userMessage]);

        // Criar resposta do assistente
        const assistantMessage = createMessage(
          `Analisando ${files.length} imagem(ns)...`,
          'assistant',
          { status: 'sending' }
        );
        setMessages((prev) => [...prev, assistantMessage]);

        // Processar todas as imagens usando base64 (não URLs)
        const imageAnalyses = await Promise.all(
          uploadedImages.map(async (uploadedImage, idx) => {
            const analysis = await analyzeImage(
              uploadedImage.base64 || uploadedImage.url, // Preferir base64
              'Analise esta imagem em detalhes. Se for um documento, extraia todas as informações relevantes. Se for uma foto, descreva o que você vê de forma completa e útil.'
            );

            return { fileName: files[idx].name, analysis, url: uploadedImage.url };
          })
        );

        // Combinar análises
        const combinedResponse = imageAnalyses
          .map((img, idx) => `**Imagem ${idx + 1} (${img.fileName}):**\n${img.analysis}`)
          .join('\n\n---\n\n');

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: combinedResponse,
                  status: 'sent',
                  metadata: { 
                    model: 'gpt-4o-vision', 
                    imageCount: files.length,
                    imageUrls: imageAnalyses.map(img => img.url)
                  },
                }
              : msg
          )
        );

        toast({
          title: `${files.length} imagens analisadas`,
          description: 'Todas as análises foram concluídas com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao processar imagens';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === prev[prev.length - 1].id
              ? {
                  ...msg,
                  content: 'Desculpe, não consegui processar as imagens.',
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: 'Erro ao processar imagens',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [aiLoading, createMessage, analyzeImage, toast]
  );

  // Função para fazer upload e transcrever áudio
  const uploadAudio = useCallback(
    async (file: File) => {
      if (aiLoading) return;

      try {
        // Validar tipo de arquivo
        const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
        if (!validAudioTypes.includes(file.type)) {
          toast({
            title: 'Formato inválido',
            description: 'Por favor, envie um arquivo de áudio válido (MP3, WAV, OGG, WebM, M4A).',
            variant: 'destructive',
          });
          return;
        }

        // Validar tamanho (max 25MB - limite da API Whisper)
        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: 'O arquivo de áudio deve ter no máximo 25MB.',
            variant: 'destructive',
          });
          return;
        }

        // Criar URL local para reprodução
        const audioData = URL.createObjectURL(file);

        // Criar mensagem do usuário com o áudio
        const userMessage = createMessage(
          `Enviou áudio: ${file.name}`,
          'user',
          {
            audioData,
            audioUrl: audioData,
          }
        );
        
        setMessages((prev) => [...prev, userMessage]);

        // Criar resposta do assistente
        const assistantMessage = createMessage(
          'Transcrevendo áudio...',
          'assistant',
          { status: 'sending' }
        );
        setMessages((prev) => [...prev, assistantMessage]);

        // Transcrever o áudio
        const transcription = await transcribeAudio(file);

        // Processar a transcrição como uma mensagem normal
        const response = await processConversationalMessage(
          `Transcrição do áudio: "${transcription}"`,
          [...messages, userMessage]
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `**Transcrição:**\n${transcription}\n\n**Resposta:**\n${response}`,
                  status: 'sent',
                  metadata: { 
                    model: 'whisper-1', 
                    transcription 
                  },
                }
              : msg
          )
        );

        toast({
          title: 'Áudio transcrito',
          description: 'O áudio foi transcrito com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao processar áudio';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === prev[prev.length - 1].id
              ? {
                  ...msg,
                  content: 'Desculpe, não consegui processar o áudio.',
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: 'Erro ao processar áudio',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [aiLoading, createMessage, transcribeAudio, processConversationalMessage, messages, toast]
  );

  // Função para gerar imagem
  const generateImage = useCallback(
    async (prompt: string) => {
      if (aiLoading) return;

      // Criar mensagem do usuário
      const userMessage = createMessage(prompt, 'user');
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');

      // Criar mensagem temporária do assistente
      const assistantMessage = createMessage('Gerando imagem...', 'assistant', {
        status: 'sending',
      });
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Gerar imagem
        const imageUrl = await generateImageFromPrompt(prompt);

        // Atualizar mensagem com imagem gerada
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: 'Imagem gerada com sucesso!',
                  imageUrl,
                  status: 'sent',
                  metadata: { model: 'dall-e-3' },
                }
              : msg
          )
        );

        toast({
          title: 'Imagem gerada',
          description: 'A imagem foi gerada com sucesso!',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao gerar imagem';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: 'Desculpe, não consegui gerar a imagem.',
                  status: 'error',
                  error: errorMessage,
                }
              : msg
          )
        );

        toast({
          title: 'Erro ao gerar imagem',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [aiLoading, createMessage, generateImageFromPrompt, toast]
  );

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
        const userMessageIndex = messages.findIndex((m) => m.id === messageId) - 1;
        const userMessage = userMessageIndex >= 0 ? messages[userMessageIndex] : null;

        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('Mensagem do usuário não encontrada');
        }

        const response = await processConversationalMessage(userMessage.content, messages);

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
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

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
    [messages, processConversationalMessage]
  );

  // Função para limpar chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setInputText('');
    setCurrentSessionId(null);
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

      // Criar nova sessão se não existir
      if (!sessionId) {
        sessionId = await createSession('conversational');
        if (!sessionId) throw new Error('Falha ao criar sessão');
        setCurrentSessionId(sessionId);
      }

      // Salvar todas as mensagens
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
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const loadedMessages = await loadSessionMessages(sessionId);
      
      // Converter tipos do banco para o formato interno
      const convertedMessages = loadedMessages.map(msg => ({
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
  }, [loadSessionMessages, toast]);


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
    sendMessage,
    retryMessage,
    clearChat,
    uploadImage,
    uploadMultipleImages,
    uploadAudio,
    generateImage,
    saveCurrentSession,
    loadSession,
    currentSessionId,
  };
};
