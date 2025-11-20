import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  OccurrenceType,
  UseOccurrenceTypesReturn,
} from '@/types/business/occurrenceTypes';

/**
 * Hook para buscar tipos de ocorrência ativos
 * Usado em formulários para selecionar tipos de ocorrência
 */
export function useOccurrenceTypes(): UseOccurrenceTypesReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['occurrence-types', 'active'],
    queryFn: async (): Promise<OccurrenceType[]> => {
      const { data: types, error: fetchError } = await supabase
        .from('occurrence_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) {
        throw new Error(
          `Erro ao buscar tipos de ocorrência: ${fetchError.message}`
        );
      }

      return types || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  return {
    types: data || [],
    isLoading,
    error: error as Error | null,
  };
}

