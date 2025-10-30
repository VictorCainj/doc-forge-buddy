import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { log } from '@/utils/logger';

/**
 * Hook para implementar prefetching estratégico de dados
 *
 * Prefetches dados quando o usuário está prestes a navegar para uma página
 * Reduz perceptivelmente o tempo de carregamento de páginas
 *
 * @example
 * ```typescript
 * const prefetch = usePrefetching();
 *
 * // Prefetch ao passar mouse sobre um link
 * <Link to="/editar-contrato/123" onMouseEnter={() => prefetch.contract('123')}>
 *   Editar Contrato
 * </Link>
 * ```
 */
export function usePrefetching() {
  const queryClient = useQueryClient();

  /**
   * Prefetch detalhes de um contrato específico
   */
  const contract = useCallback(
    async (contractId: string) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['contract', contractId],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase
              .from('saved_terms')
              .select('*')
              .eq('id', contractId)
              .single();

            if (error) throw error;
            return data;
          },
          staleTime: 2 * 60 * 1000, // 2 minutos
        });
      } catch (error) {
        log.debug('Prefetch contract failed:', error);
      }
    },
    [queryClient]
  );

  /**
   * Prefetch lista de contratos
   */
  const contracts = useCallback(
    async (limit = 10) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['contracts', 'list', limit],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase
              .from('saved_terms')
              .select('*')
              .eq('document_type', 'contrato')
              .order('created_at', { ascending: false })
              .limit(limit);

            if (error) throw error;
            return data;
          },
          staleTime: 2 * 60 * 1000,
        });
      } catch (error) {
        log.debug('Prefetch contracts failed:', error);
      }
    },
    [queryClient]
  );

  /**
   * Prefetch detalhes de um usuário
   */
  const user = useCallback(
    async (userId: string) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['user', userId],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (error) throw error;
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });
      } catch (error) {
        log.debug('Prefetch user failed:', error);
      }
    },
    [queryClient]
  );

  /**
   * Prefetch dados da página de vistoria
   */
  const vistoria = useCallback(
    async (vistoriaId: string) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['vistoria', vistoriaId],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase
              .from('vistorias')
              .select('*')
              .eq('id', vistoriaId)
              .single();

            if (error) throw error;
            return data;
          },
          staleTime: 2 * 60 * 1000,
        });
      } catch (error) {
        log.debug('Prefetch vistoria failed:', error);
      }
    },
    [queryClient]
  );

  return {
    contract,
    contracts,
    user,
    vistoria,
  };
}
