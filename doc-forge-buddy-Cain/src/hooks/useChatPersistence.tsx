import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { log } from '@/utils/logger';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  imageData?: string | null;
  audioData?: string | null;
  metadata?: {
    model?: string;
    tokens?: number;
    transcription?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  mode: string;
  created_at: string | null;
  updated_at: string | null;
  metadata?: any;
}

export const useChatPersistence = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Create new chat session
  const createSession = useCallback(
    async (mode: string = 'conversational'): Promise<string | null> => {
      try {
        setIsLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: 'Nova Conversa',
            mode,
            metadata: {},
          })
          .select()
          .single();

        if (error) throw error;

        log.debug('Sessão de chat criada:', data.id);
        return data.id;
      } catch (error) {
        log.error('Erro ao criar sessão:', error);
        toast({
          title: 'Erro ao criar sessão',
          description: 'Não foi possível criar a sessão de chat.',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Save message to session
  const saveMessage = useCallback(
    async (
      sessionId: string,
      message: ChatMessage,
      images?: File[]
    ): Promise<boolean> => {
      try {
        setIsLoading(true);

        // Insert message
        const { data: messageData, error: messageError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: message.role,
            content: message.content,
            metadata: message.metadata || {},
          })
          .select()
          .single();

        if (messageError) throw messageError;

        // Save images if provided
        if (images && images.length > 0) {
          const imagePromises = images.map(async (file) => {
            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });

            const imageData = await base64Promise;

            return supabase.from('chat_images').insert({
              message_id: messageData.id,
              image_url: imageData,
              image_data: imageData,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
            });
          });

          const results = await Promise.all(imagePromises);
          const imageErrors = results.filter((r) => r.error);

          if (imageErrors.length > 0) {
            log.error('Erros ao salvar imagens:', imageErrors);
          }
        }

        log.debug('Mensagem salva com sucesso:', messageData.id);
        return true;
      } catch (error) {
        log.error('Erro ao salvar mensagem:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load session messages
  const loadSessionMessages = useCallback(
    async (sessionId: string): Promise<ChatMessage[]> => {
      try {
        setIsLoading(true);

        // Load messages
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Load images for all messages
        const messageIds = messages.map((m) => m.id);
        const { data: images, error: imagesError } = await supabase
          .from('chat_images')
          .select('*')
          .in('message_id', messageIds);

        if (imagesError) throw imagesError;

        // Map messages with images
        const messagesWithImages: ChatMessage[] = messages.map((msg) => {
          const msgImages =
            images?.filter((img) => img.message_id === msg.id) || [];
          const firstImage = msgImages[0];

          return {
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.created_at || Date.now()),
            imageData: firstImage?.image_data || null,
            metadata: msg.metadata as { model?: string; tokens?: number },
          };
        });

        return messagesWithImages;
      } catch (error) {
        log.error('Erro ao carregar mensagens:', error);
        toast({
          title: 'Erro ao carregar mensagens',
          description: 'Não foi possível carregar o histórico.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Load all user sessions
  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data as unknown as ChatSession[]) || [];
    } catch (error) {
      log.error('Erro ao carregar sessões:', error);
      toast({
        title: 'Erro ao carregar sessões',
        description: 'Não foi possível carregar o histórico de conversas.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update session title
  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ title })
          .eq('id', sessionId);

        if (error) throw error;

        return true;
      } catch (error) {
        log.error('Erro ao atualizar título:', error);
        return false;
      }
    },
    []
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId);

        if (error) throw error;

        toast({
          title: 'Sessão excluída',
          description: 'A conversa foi excluída com sucesso.',
        });

        return true;
      } catch (error) {
        log.error('Erro ao excluir sessão:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir a conversa.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  return {
    isLoading,
    createSession,
    saveMessage,
    loadSessionMessages,
    loadSessions,
    updateSessionTitle,
    deleteSession,
  };
};
