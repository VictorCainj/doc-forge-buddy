import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EvictionReason, UseEvictionReasonsReturn } from '@/types/evictionReasons';

/**
 * Hook para buscar motivos de desocupação ativos
 * Usado em formulários para selecionar motivos
 */
export function useEvictionReasons(): UseEvictionReasonsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['eviction-reasons', 'active'],
    queryFn: async (): Promise<EvictionReason[]> => {
      const { data: reasons, error: fetchError } = await supabase
        .from('eviction_reasons')
        .select('*')
        .eq('is_active', true)
        .order('description', { ascending: true });

      if (fetchError) {
        throw new Error(
          `Erro ao buscar motivos de desocupação: ${fetchError.message}`
        );
      }

      return reasons || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  return {
    reasons: data || [],
    isLoading,
    error: error as Error | null,
  };
}
