import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { isValidPrestadorArray, isValidPrestador } from '@/utils/typeGuards';
import { log } from '@/utils/logger';

export interface Prestador {
  id: string;
  user_id: string | null;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  especialidade: string | null;
  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePrestadorData {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  especialidade?: string;
  observacoes?: string;
}

export const usePrestadores = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar prestadores com React Query (com cache)
  const {
    data: prestadores = [],
    isLoading: loading,
    refetch: fetchPrestadores,
  } = useQuery({
    queryKey: ['prestadores', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      // Validar dados com Type Guard
      if (data && isValidPrestadorArray(data)) {
        log.debug(`${data.length} prestadores carregados`);
        return data;
      } else {
        log.error('Dados dos prestadores inválidos');
        toast.error('Os dados dos prestadores estão em formato incorreto.');
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos - cache longo pois dados não mudam frequentemente
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });

  // Criar novo prestador (Mutation com React Query)
  const createMutation = useMutation({
    mutationFn: async (data: CreatePrestadorData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: prestador, error } = await supabase
        .from('prestadores')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (prestador && isValidPrestador(prestador)) {
        return prestador;
      } else {
        throw new Error('Dados do prestador criado são inválidos');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      toast.success('Prestador criado com sucesso');
    },
    onError: (error: Error) => {
      log.error('Erro ao criar prestador:', error);
      toast.error(`Erro ao criar prestador: ${error.message}`);
    },
  });

  const createPrestador = async (
    data: CreatePrestadorData
  ): Promise<Prestador | null> => {
    const result = await createMutation.mutateAsync(data);
    return result || null;
  };

  // Atualizar prestador (Mutation com React Query)
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePrestadorData>;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('prestadores')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      toast.success('Prestador atualizado com sucesso');
    },
    onError: (error: Error) => {
      log.error('Erro ao atualizar prestador:', error);
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const updatePrestador = async (
    id: string,
    data: Partial<CreatePrestadorData>
  ): Promise<boolean> => {
    try {
      return await updateMutation.mutateAsync({ id, data });
    } catch {
      return false;
    }
  };

  // Deletar prestador (Mutation com React Query)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('prestadores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      toast.success('Prestador deletado com sucesso');
    },
    onError: (error: Error) => {
      log.error('Erro ao deletar prestador:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const deletePrestador = async (id: string): Promise<boolean> => {
    try {
      return await deleteMutation.mutateAsync(id);
    } catch {
      return false;
    }
  };

  // Buscar prestador por ID
  const getPrestadorById = useCallback(
    (id: string): Prestador | undefined => {
      return prestadores.find((p) => p.id === id);
    },
    [prestadores]
  );

  // Combinar estados de loading das mutations
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return {
    prestadores,
    loading,
    saving,
    fetchPrestadores,
    createPrestador,
    updatePrestador,
    deletePrestador,
    getPrestadorById,
  };
};
