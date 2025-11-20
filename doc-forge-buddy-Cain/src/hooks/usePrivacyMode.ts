import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PrivacySettings {
  id: string;
  anonymize_personal_data: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Hook para verificar se o modo de privacidade está ativo
 * Quando ativado, TODOS os usuários (incluindo admins) veem dados anonimizados
 */
export function usePrivacyMode() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: async (): Promise<PrivacySettings | null> => {
      const { data: settings, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .single();

      if (error) {
        // Se a tabela não existe ou não há registro, retornar null (modo desativado)
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return null;
        }
        throw error;
      }

      return settings;
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Quando ativado, TODOS os usuários (incluindo admins) veem dados anonimizados
  const isPrivacyModeActive = data?.anonymize_personal_data ?? false;

  return {
    isPrivacyModeActive, // Todos veem dados anonimizados quando ativo
    isLoading,
    settings: data,
    canManage: isAdmin, // Apenas admins podem gerenciar a configuração
  };
}

