import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { usePrestadores } from '@/hooks/usePrestadores';
import { log } from '@/utils/logger';

/**
 * Interface para prestador
 */
export interface Prestador {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  especialidade?: string;
  valor_hora?: number;
  ativo: boolean;
}

/**
 * Interface para seleção de prestador
 */
export interface PrestadorSelection {
  selectedId: string | null;
  selectedPrestador: Prestador | null;
  isValid: boolean;
  error?: string;
}

/**
 * Interface para estatísticas de prestadores
 */
export interface PrestadorStats {
  total: number;
  ativos: number;
  inativos: number;
  porEspecialidade: Record<string, number>;
}

/**
 * Interface para ações de prestador
 */
export interface PrestadorActions {
  selectPrestador: (id: string) => void;
  clearSelection: () => void;
  validateSelection: () => { isValid: boolean; error?: string };
  getPrestadorById: (id: string) => Prestador | null;
  filterPrestadores: (filters: {
    ativo?: boolean;
    especialidade?: string;
    busca?: string;
  }) => Prestador[];
  getStats: () => PrestadorStats;
}

/**
 * Interface de retorno do hook
 */
export interface UseVistoriaPrestadoresReturn extends PrestadorActions {
  // Estado
  selection: PrestadorSelection;
  prestadores: Prestador[];
  loading: boolean;
  error: string | null;
  
  // Utilitários
  isPrestadorSelected: (id: string) => boolean;
  getPrestadorDisplayName: (prestador: Prestador) => string;
  canSelectPrestador: (id: string) => { canSelect: boolean; reason?: string };
}

/**
 * Hook para seleção e gestão de prestadores
 */
export const useVistoriaPrestadores = (): UseVistoriaPrestadoresReturn => {
  const { toast } = useToast();
  const { prestadores, loading: prestadoresLoading } = usePrestadores();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Converte prestadores do hook para interface Prestador
   */
  const mappedPrestadores: Prestador[] = prestadores.map(p => ({
    id: p.id,
    nome: p.nome || p.name || 'Nome não informado',
    email: p.email,
    telefone: p.telefone || p.phone,
    especialidade: p.especialidade || p.specialty,
    valor_hora: p.valor_hora || p.hourlyRate,
    ativo: p.ativo !== false, // Assume ativo se não especificado
  }));

  /**
   * Seleciona um prestador
   */
  const selectPrestador = useCallback((id: string) => {
    const prestador = mappedPrestadores.find(p => p.id === id);
    if (!prestador) {
      setError('Prestador não encontrado');
      toast({
        title: 'Erro',
        description: 'Prestador não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (!prestador.ativo) {
      setError('Prestador inativo');
      toast({
        title: 'Prestador inativo',
        description: 'Não é possível selecionar um prestador inativo.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedId(id);
    setError(null);
    
    log.info('Prestador selecionado:', { id, nome: prestador.nome });
  }, [mappedPrestadores, toast]);

  /**
   * Limpa a seleção
   */
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setError(null);
  }, []);

  /**
   * Valida a seleção atual
   */
  const validateSelection = useCallback(() => {
    if (!selectedId) {
      return { isValid: false, error: 'Nenhum prestador selecionado' };
    }

    const prestador = mappedPrestadores.find(p => p.id === selectedId);
    if (!prestador) {
      return { isValid: false, error: 'Prestador selecionado não encontrado' };
    }

    if (!prestador.ativo) {
      return { isValid: false, error: 'Prestador selecionado está inativo' };
    }

    return { isValid: true };
  }, [selectedId, mappedPrestadores]);

  /**
   * Busca prestador por ID
   */
  const getPrestadorById = useCallback((id: string) => {
    return mappedPrestadores.find(p => p.id === id) || null;
  }, [mappedPrestadores]);

  /**
   * Filtra prestadores baseado em critérios
   */
  const filterPrestadores = useCallback((filters: {
    ativo?: boolean;
    especialidade?: string;
    busca?: string;
  }) => {
    let filtered = [...mappedPrestadores];

    // Filtrar por status ativo
    if (filters.ativo !== undefined) {
      filtered = filtered.filter(p => p.ativo === filters.ativo);
    }

    // Filtrar por especialidade
    if (filters.especialidade) {
      filtered = filtered.filter(p => 
        p.especialidade?.toLowerCase().includes(filters.especialidade!.toLowerCase())
      );
    }

    // Filtrar por busca de texto
    if (filters.busca) {
      const busca = filters.busca.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(busca) ||
        p.email?.toLowerCase().includes(busca) ||
        p.telefone?.toLowerCase().includes(busca) ||
        p.especialidade?.toLowerCase().includes(busca)
      );
    }

    return filtered;
  }, [mappedPrestadores]);

  /**
   * Calcula estatísticas dos prestadores
   */
  const getStats = useCallback((): PrestadorStats => {
    const stats: PrestadorStats = {
      total: mappedPrestadores.length,
      ativos: 0,
      inativos: 0,
      porEspecialidade: {},
    };

    mappedPrestadores.forEach(prestador => {
      if (prestador.ativo) {
        stats.ativos++;
      } else {
        stats.inativos++;
      }

      if (prestador.especialidade) {
        const especialidade = prestador.especialidade;
        stats.porEspecialidade[especialidade] = 
          (stats.porEspecialidade[especialidade] || 0) + 1;
      }
    });

    return stats;
  }, [mappedPrestadores]);

  /**
   * Verifica se um prestador está selecionado
   */
  const isPrestadorSelected = useCallback((id: string) => {
    return selectedId === id;
  }, [selectedId]);

  /**
   * Obtém nome de exibição do prestador
   */
  const getPrestadorDisplayName = useCallback((prestador: Prestador) => {
    const nome = prestador.nome || 'Nome não informado';
    const especialidade = prestador.especialidade ? ` (${prestador.especialidade})` : '';
    return nome + especialidade;
  }, []);

  /**
   * Verifica se pode selecionar um prestador
   */
  const canSelectPrestador = useCallback((id: string) => {
    const prestador = mappedPrestadores.find(p => p.id === id);
    if (!prestador) {
      return { canSelect: false, reason: 'Prestador não encontrado' };
    }

    if (!prestador.ativo) {
      return { canSelect: false, reason: 'Prestador inativo' };
    }

    return { canSelect: true };
  }, [mappedPrestadores]);

  // Limpar erro quando prestadores mudam
  useEffect(() => {
    if (error && mappedPrestadores.length === 0) {
      setError('Nenhum prestador disponível');
    }
  }, [mappedPrestadores.length, error]);

  const selection: PrestadorSelection = {
    selectedId,
    selectedPrestador: selectedId ? getPrestadorById(selectedId) : null,
    isValid: validateSelection().isValid,
    error: validateSelection().error,
  };

  return {
    // Estado
    selection,
    prestadores: mappedPrestadores,
    loading: prestadoresLoading,
    error,
    
    // Ações
    selectPrestador,
    clearSelection,
    validateSelection,
    getPrestadorById,
    filterPrestadores,
    getStats,
    
    // Utilitários
    isPrestadorSelected,
    getPrestadorDisplayName,
    canSelectPrestador,
  };
};

export default useVistoriaPrestadores;