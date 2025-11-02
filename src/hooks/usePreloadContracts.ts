/**
 * Hook para pré-carregamento inteligente de contratos
 * Usa requestIdleCallback para não bloquear UI
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';
import { persistentCache } from '@/utils/persistentCache';
import { validateContractsList } from '@/utils/dataValidator';

interface UsePreloadContractsOptions {
  enabled?: boolean;
  maxContracts?: number;
  priority?: 'high' | 'low';
}

/**
 * Hook para pré-carregar contratos em background
 */
export function usePreloadContracts(options: UsePreloadContractsOptions = {}) {
  const {
    enabled = true,
    maxContracts = 50,
    priority = 'low',
  } = options;

  const preloadRef = useRef<{
    isPreloading: boolean;
    hasPreloaded: boolean;
  }>({ isPreloading: false, hasPreloaded: false });

  useEffect(() => {
    if (!enabled || preloadRef.current.hasPreloaded || preloadRef.current.isPreloading) {
      return;
    }

    // Verificar se já existe cache
    const cached = persistentCache.get<Contract[]>('contracts-preload');
    if (cached && cached.length > 0) {
      preloadRef.current.hasPreloaded = true;
      return;
    }

    const preloadContracts = async () => {
      preloadRef.current.isPreloading = true;

      try {
        // Usar requestIdleCallback para não bloquear UI
        const idleCallback = (window as any).requestIdleCallback || ((fn: () => void) => setTimeout(fn, 100));

        idleCallback(async () => {
          try {
            const { data, error } = await supabase
              .from('saved_terms')
              .select('id, title, document_type, form_data, created_at, updated_at')
              .eq('document_type', 'contrato')
              .order('created_at', { ascending: false })
              .limit(maxContracts);

            if (error) throw error;

            const validatedData = validateContractsList(data || []);

            // Salvar no cache persistente
            persistentCache.set('contracts-preload', validatedData, {
              expiresIn: 15 * 60 * 1000, // 15 minutos
            });

            preloadRef.current.hasPreloaded = true;
          } catch (error) {
            console.warn('Erro ao pré-carregar contratos:', error);
          } finally {
            preloadRef.current.isPreloading = false;
          }
        });
      } catch (error) {
        console.warn('Erro ao iniciar pré-carregamento:', error);
        preloadRef.current.isPreloading = false;
      }
    };

    // Delay baseado na prioridade
    if (priority === 'high') {
      preloadContracts();
    } else {
      // Aguardar 2 segundos após carregamento inicial
      const timeoutId = setTimeout(preloadContracts, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [enabled, maxContracts, priority]);

  return {
    isPreloading: preloadRef.current.isPreloading,
    hasPreloaded: preloadRef.current.hasPreloaded,
  };
}

