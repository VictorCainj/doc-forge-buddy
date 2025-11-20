import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivacySettings {
  id: string;
  anonymize_personal_data: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Hook para gerenciar configurações de privacidade (apenas para admins)
 */
export function usePrivacySettingsAdmin() {
  const queryClient = useQueryClient();

  // Query para buscar configurações
  const { data, isLoading, error } = useQuery({
    queryKey: ['privacy-settings', 'admin'],
    queryFn: async (): Promise<PrivacySettings | null> => {
      const { data: settings, error: fetchError } = await supabase
        .from('privacy_settings')
        .select('*')
        .single();

      if (fetchError) {
        // Se não existe registro, criar um padrão
        if (fetchError.code === 'PGRST116') {
          return {
            id: 'default',
            anonymize_personal_data: false,
            updated_at: new Date().toISOString(),
            updated_by: null,
          };
        }
        throw fetchError;
      }

      return settings;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Mutation para atualizar configurações
  const updateMutation = useMutation({
    mutationFn: async (anonymize: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Tentar atualizar primeiro
      const { error: updateError } = await supabase
        .from('privacy_settings')
        .update({
          anonymize_personal_data: anonymize,
          updated_by: user?.id || null,
        })
        .eq('id', 'default');

      // Se não existe, criar
      if (updateError && updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('privacy_settings')
          .insert({
            id: 'default',
            anonymize_personal_data: anonymize,
            updated_by: user?.id || null,
          });

        if (insertError) {
          throw new Error(
            `Erro ao criar configuração de privacidade: ${insertError.message}`
          );
        }
      } else if (updateError) {
        throw new Error(
          `Erro ao atualizar configuração de privacidade: ${updateError.message}`
        );
      }
    },
    onSuccess: (_, anonymize) => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      toast.success(
        anonymize
          ? 'Modo de privacidade ativado. Dados pessoais serão anonimizados.'
          : 'Modo de privacidade desativado. Dados pessoais serão exibidos normalmente.'
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar configuração: ${error.message}`);
    },
  });

  const updatePrivacyMode = async (anonymize: boolean) => {
    await updateMutation.mutateAsync(anonymize);
  };

  return {
    settings: data,
    isLoading,
    error: error as Error | null,
    updatePrivacyMode,
    isUpdating: updateMutation.isPending,
  };
}

