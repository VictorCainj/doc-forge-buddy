import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { enhancePromptWithAI } from '@/utils/openai';
import { supabase } from '@/integrations/supabase/client';
import type {
  EnhancedPrompt,
  PromptEnhancementRequest,
} from '../types/prompt';
import { log } from '@/utils/logger';
import { toast } from 'sonner';

export const usePromptEnhancer = () => {
  const [localHistory, setLocalHistory] = useState<EnhancedPrompt[]>([]);

  const enhanceMutation = useMutation({
    mutationFn: async (request: PromptEnhancementRequest) => {
      const enhanced = await enhancePromptWithAI(request);

      // Adicionar ao histórico local
      const newPrompt: EnhancedPrompt = {
        ...enhanced,
        metadata: {
          ...enhanced.metadata,
          createdAt: new Date().toISOString(),
        },
      };

      setLocalHistory((prev) => [newPrompt, ...prev].slice(0, 50)); // Últimos 50

      return enhanced;
    },
    onError: (error: Error) => {
      log.error('Erro ao expandir prompt:', error);
      toast.error('Erro ao expandir prompt', {
        description: error.message || 'Tente novamente.',
      });
    },
    onSuccess: () => {
      toast.success('Prompt expandido com sucesso!');
    },
  });

  const saveToHistory = useCallback(
    async (prompt: EnhancedPrompt) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Você precisa estar autenticado para salvar histórico');
          return;
        }

        const { error } = await supabase.from('prompt_history').insert({
          user_id: user.id,
          original_input: prompt.original,
          enhanced_prompt: prompt.enhanced,
          context: prompt.context,
          metadata: prompt.metadata,
        });

        if (error) {
          log.error('Erro ao salvar histórico:', error);
          toast.error('Erro ao salvar no histórico');
          return;
        }

        toast.success('Salvo no histórico');
      } catch (error) {
        log.error('Erro ao salvar histórico:', error);
        toast.error('Erro ao salvar no histórico');
      }
    },
    []
  );

  return {
    enhance: enhanceMutation.mutateAsync,
    enhancedPrompt: enhanceMutation.data,
    isLoading: enhanceMutation.isPending,
    error: enhanceMutation.error,
    history: localHistory,
    saveToHistory,
  };
};

