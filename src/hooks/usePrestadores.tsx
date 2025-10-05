import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isValidPrestadorArray, isValidPrestador } from '@/utils/typeGuards';

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
  const { toast } = useToast();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar todos os prestadores do usuário
  const fetchPrestadores = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      
      // Validar dados com Type Guard
      if (data && isValidPrestadorArray(data)) {
        setPrestadores(data);
      } else {
        console.error('Dados inválidos recebidos do Supabase');
        toast({
          title: 'Dados inválidos',
          description: 'Os dados dos prestadores estão em formato incorreto.',
          variant: 'destructive',
        });
        setPrestadores([]);
      }
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      toast({
        title: 'Erro ao carregar prestadores',
        description: 'Não foi possível carregar a lista de prestadores.',
        variant: 'destructive',
      });
      setPrestadores([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Criar novo prestador
  const createPrestador = async (data: CreatePrestadorData): Promise<Prestador | null> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para criar prestadores.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setSaving(true);
      const { data: prestador, error } = await supabase
        .from('prestadores')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Validar prestador criado
      if (prestador && isValidPrestador(prestador)) {
        toast({
          title: 'Prestador criado',
          description: 'O prestador foi cadastrado com sucesso.',
        });

        await fetchPrestadores();
        return prestador;
      } else {
        throw new Error('Dados do prestador criado são inválidos');
      }
    } catch (error) {
      console.error('Erro ao criar prestador:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o prestador.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar prestador
  const updatePrestador = async (id: string, data: Partial<CreatePrestadorData>): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para atualizar prestadores.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('prestadores')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Prestador atualizado',
        description: 'O prestador foi atualizado com sucesso.',
      });

      await fetchPrestadores();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar prestador:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o prestador.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Deletar prestador
  const deletePrestador = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para deletar prestadores.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('prestadores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Prestador deletado',
        description: 'O prestador foi removido com sucesso.',
      });

      await fetchPrestadores();
      return true;
    } catch (error) {
      console.error('Erro ao deletar prestador:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o prestador.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Buscar prestador por ID
  const getPrestadorById = useCallback(
    (id: string): Prestador | undefined => {
      return prestadores.find((p) => p.id === id);
    },
    [prestadores]
  );

  // Carregar prestadores quando o componente montar
  useEffect(() => {
    if (user) {
      fetchPrestadores();
    }
  }, [user, fetchPrestadores]);

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
