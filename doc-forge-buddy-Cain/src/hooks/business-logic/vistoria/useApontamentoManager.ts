import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para apontamentos
export interface Apontamento {
  id: string;
  vistoriaId: string;
  categoria: ApontamentoCategory;
  subcategoria: string;
  titulo: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado' | 'rejeitado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  localizacao: {
    ambiente: string;
    parede?: string;
    pavimento?: string;
    coordenadas?: { x: number; y: number };
  };
  responsavel?: string;
  prazoResolucao?: Date;
  dataIdentificacao: Date;
  dataResolucao?: Date;
  observacoes: ApontamentoObservacao[];
  anexos: ApontamentoAnexo[];
  tags: string[];
  custoEstimado?: number;
  tempoEstimado?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApontamentoCategory {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  color: string;
  subcategorias: ApontamentoSubcategory[];
  permiteAnexo: boolean;
  requerFoto: boolean;
  severidadePadrao: Apontamento['severidade'];
  camposObrigatorios: string[];
}

export interface ApontamentoSubcategory {
  id: string;
  nome: string;
  descricao: string;
  camposEspecificos?: Record<string, any>;
}

export interface ApontamentoObservacao {
  id: string;
  texto: string;
  autor: string;
  data: Date;
  isPublic: boolean;
  anexos?: ApontamentoAnexo[];
}

export interface ApontamentoAnexo {
  id: string;
  nome: string;
  tipo: 'image' | 'document' | 'video' | 'audio';
  url: string;
  tamanho: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ApontamentoFilter {
  categorias?: string[];
  severidades?: Apontamento['severidade'][];
  status?: Apontamento['status'][];
  prioridades?: Apontamento['prioridade'][];
  responsaveis?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  tags?: string[];
  vistoriaId?: string;
}

export interface ApontamentoStats {
  total: number;
  porCategoria: Record<string, number>;
  porSeveridade: Record<Apontamento['severidade'], number>;
  porStatus: Record<Apontamento['status'], number>;
  resolucaoMedia: number;
  custos: {
    total: number;
    estimado: number;
    porCategoria: Record<string, number>;
  };
}

// Categorias padrão
const DEFAULT_CATEGORIES: ApontamentoCategory[] = [
  {
    id: 'estrutura',
    nome: 'Estrutural',
    descricao: 'Problemas relacionados à estrutura do imóvel',
    icon: 'building',
    color: '#ef4444',
    subcategorias: [
      { id: 'trincas', nome: 'Trincas e Fissuras' },
      { id: 'umidade', nome: 'Umidade' },
      { id: 'infestacao', nome: 'Infestação' }
    ],
    permiteAnexo: true,
    requerFoto: true,
    severidadePadrao: 'media',
    camposObrigatorios: ['titulo', 'descricao', 'localizacao']
  },
  {
    id: 'eletrica',
    nome: 'Elétrica',
    descricao: 'Problemas no sistema elétrico',
    icon: 'zap',
    color: '#f59e0b',
    subcategorias: [
      { id: 'fios', nome: 'Fios e Cabos' },
      { id: 'tomadas', nome: 'Tomadas e Interruptores' },
      { id: 'quadro', nome: 'Quadro Elétrico' }
    ],
    permiteAnexo: true,
    requerFoto: true,
    severidadePadrao: 'alta',
    camposObrigatorios: ['titulo', 'descricao', 'localizacao', 'severidade']
  },
  {
    id: 'hidraulica',
    nome: 'Hidráulica',
    descricao: 'Problemas no sistema hidráulico',
    icon: 'droplet',
    color: '#3b82f6',
    subcategorias: [
      { id: 'vazamentos', nome: 'Vazamentos' },
      { id: 'pressionamento', nome: 'Pressão' },
      { id: 'aquecimento', nome: 'Aquecimento' }
    ],
    permiteAnexo: true,
    requerFoto: true,
    severidadePadrao: 'media',
    camposObrigatorios: ['titulo', 'descricao', 'localizacao']
  },
  {
    id: 'acabamento',
    nome: 'Acabamento',
    descricao: 'Problemas em acabamentos e detalhes',
    icon: 'paintbrush',
    color: '#8b5cf6',
    subcategorias: [
      { id: 'pintura', nome: 'Pintura' },
      { id: 'revestimentos', nome: 'Revestimentos' },
      { id: 'portas', nome: 'Portas e Janelas' }
    ],
    permiteAnexo: true,
    requerFoto: true,
    severidadePadrao: 'baixa',
    camposObrigatorios: ['titulo', 'descricao']
  }
];

export function useApontamentoManager(vistoriaId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados locais
  const [filter, setFilter] = useState<ApontamentoFilter>({ vistoriaId });
  const [selectedApontamentos, setSelectedApontamentos] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Buscar apontamentos
  const {
    data: apontamentos,
    isLoading: apontamentosLoading,
    error: apontamentosError,
    refetch: refetchApontamentos
  } = useQuery({
    queryKey: ['apontamentos', vistoriaId, filter],
    queryFn: async (): Promise<Apontamento[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockApontamentos(vistoriaId);
    },
    enabled: !!vistoriaId
  });

  // Buscar categorias
  const {
    data: categorias,
    isLoading: categoriasLoading
  } = useQuery({
    queryKey: ['apontamento-categories'],
    queryFn: async (): Promise<ApontamentoCategory[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 200));
      return DEFAULT_CATEGORIES;
    }
  });

  // Mutação para criar apontamento
  const createApontamentoMutation = useMutation({
    mutationFn: async (apontamentoData: Omit<Apontamento, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        ...apontamentoData,
        id: `apontamento-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id || 'system'
      } as Apontamento;
    },
    onSuccess: (newApontamento) => {
      queryClient.setQueryData(['apontamentos', vistoriaId], (old: Apontamento[] = []) => [
        ...old,
        newApontamento
      ]);
      
      toast({
        title: 'Apontamento criado',
        description: 'O apontamento foi adicionado com sucesso',
      });
      
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar apontamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  // Mutação para atualizar apontamento
  const updateApontamentoMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Apontamento>;
    }) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { id, updates: { ...updates, updatedAt: new Date() } };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.setQueryData(['apontamentos', vistoriaId], (old: Apontamento[] = []) =>
        old.map(apontamento =>
          apontamento.id === id
            ? { ...apontamento, ...updates }
            : apontamento
        )
      );
      
      toast({
        title: 'Apontamento atualizado',
        description: 'As alterações foram salvas com sucesso',
      });
    }
  });

  // Mutação para excluir apontamento
  const deleteApontamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['apontamentos', vistoriaId], (old: Apontamento[] = []) =>
        old.filter(apontamento => apontamento.id !== deletedId)
      );
      
      setSelectedApontamentos(prev => prev.filter(id => id !== deletedId));
      
      toast({
        title: 'Apontamento excluído',
        description: 'O apontamento foi removido com sucesso',
      });
    }
  });

  // Aplicar filtros
  const filteredApontamentos = useMemo(() => {
    if (!apontamentos) return [];

    return apontamentos.filter(apontamento => {
      // Filtro por categorias
      if (filter.categorias?.length && !filter.categorias.includes(apontamento.categoria.id)) {
        return false;
      }

      // Filtro por severidades
      if (filter.severidades?.length && !filter.severidades.includes(apontamento.severidade)) {
        return false;
      }

      // Filtro por status
      if (filter.status?.length && !filter.status.includes(apontamento.status)) {
        return false;
      }

      // Filtro por prioridade
      if (filter.prioridades?.length && !filter.prioridades.includes(apontamento.prioridade)) {
        return false;
      }

      // Filtro por responsáveis
      if (filter.responsaveis?.length && (!apontamento.responsavel || !filter.responsaveis.includes(apontamento.responsavel))) {
        return false;
      }

      // Filtro por data
      if (filter.dateRange) {
        const dataApontamento = new Date(apontamento.dataIdentificacao);
        if (dataApontamento < filter.dateRange.start || dataApontamento > filter.dateRange.end) {
          return false;
        }
      }

      // Filtro por termo de busca
      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        return (
          apontamento.titulo.toLowerCase().includes(searchTerm) ||
          apontamento.descricao.toLowerCase().includes(searchTerm) ||
          apontamento.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Filtro por tags
      if (filter.tags?.length) {
        const hasMatchingTag = filter.tags.some(tag => 
          apontamento.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [apontamentos, filter]);

  // Calcular estatísticas
  const stats = useMemo((): ApontamentoStats => {
    if (!filteredApontamentos.length) {
      return {
        total: 0,
        porCategoria: {},
        porSeveridade: {
          baixa: 0,
          media: 0,
          alta: 0,
          critica: 0
        },
        porStatus: {
          aberto: 0,
          em_andamento: 0,
          resolvido: 0,
          fechado: 0,
          rejeitado: 0
        },
        resolucaoMedia: 0,
        custos: {
          total: 0,
          estimado: 0,
          porCategoria: {}
        }
      };
    }

    const porCategoria: Record<string, number> = {};
    const porSeveridade = { baixa: 0, media: 0, alta: 0, critica: 0 };
    const porStatus = { aberto: 0, em_andamento: 0, resolvido: 0, fechado: 0, rejeitado: 0 };
    let totalCusto = 0;
    const custoEstimado = 0;
    const custosPorCategoria: Record<string, number> = {};
    let totalTempoResolucao = 0;
    let itensResolvidos = 0;

    filteredApontamentos.forEach(apontamento => {
      // Por categoria
      porCategoria[apontamento.categoria.nome] = (porCategoria[apontamento.categoria.nome] || 0) + 1;

      // Por severidade
      porSeveridade[apontamento.severidade]++;

      // Por status
      porStatus[apontamento.status]++;

      // Custos
      if (apontamento.custoEstimado) {
        totalCusto += apontamento.custoEstimado;
        custosPorCategoria[apontamento.categoria.nome] = 
          (custosPorCategoria[apontamento.categoria.nome] || 0) + apontamento.custoEstimado;
      }

      // Tempo de resolução
      if (apontamento.dataResolucao && apontamento.status === 'resolvido') {
        const tempoResolucao = new Date(apontamento.dataResolucao).getTime() - 
                              new Date(apontamento.dataIdentificacao).getTime();
        totalTempoResolucao += tempoResolucao;
        itensResolvidos++;
      }
    });

    return {
      total: filteredApontamentos.length,
      porCategoria,
      porSeveridade,
      porStatus,
      resolucaoMedia: itensResolvidos > 0 ? totalTempoResolucao / itensResolvidos : 0,
      custos: {
        total: totalCusto,
        estimado: totalCusto * 1.2, // 20% de margem
        porCategoria: custosPorCategoria
      }
    };
  }, [filteredApontamentos]);

  // Funções de ação
  const createApontamento = useCallback(async (data: Omit<Apontamento, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    setIsCreating(true);
    try {
      await createApontamentoMutation.mutateAsync(data);
    } finally {
      setIsCreating(false);
    }
  }, [createApontamentoMutation]);

  const updateApontamento = useCallback(async (id: string, updates: Partial<Apontamento>) => {
    await updateApontamentoMutation.mutateAsync({ id, updates });
  }, [updateApontamentoMutation]);

  const deleteApontamento = useCallback(async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este apontamento?')) {
      await deleteApontamentoMutation.mutateAsync(id);
    }
  }, [deleteApontamentoMutation]);

  // Ações em lote
  const updateMultipleStatus = useCallback(async (ids: string[], status: Apontamento['status']) => {
    for (const id of ids) {
      await updateApontamento(id, { status });
    }
    
    toast({
      title: 'Status atualizado',
      description: `${ids.length} apontamentos foram atualizados`,
    });
  }, [updateApontamento, toast]);

  const deleteMultiple = useCallback(async (ids: string[]) => {
    if (confirm(`Tem certeza que deseja excluir ${ids.length} apontamentos?`)) {
      for (const id of ids) {
        await deleteApontamentoMutation.mutateAsync(id);
      }
      
      setSelectedApontamentos([]);
    }
  }, [deleteApontamentoMutation]);

  // Validação de apontamento
  const validateApontamento = useCallback((data: Partial<Apontamento>): string[] => {
    const errors: string[] = [];

    if (!data.titulo?.trim()) {
      errors.push('Título é obrigatório');
    }

    if (!data.descricao?.trim()) {
      errors.push('Descrição é obrigatória');
    }

    if (!data.categoria) {
      errors.push('Categoria é obrigatória');
    }

    if (!data.severidade) {
      errors.push('Severidade é obrigatória');
    }

    if (!data.localizacao?.ambiente?.trim()) {
      errors.push('Ambiente é obrigatório');
    }

    return errors;
  }, []);

  // Exportar dados
  const exportData = useCallback((format: 'csv' | 'json' | 'pdf') => {
    const data = {
      apontamentos: filteredApontamentos,
      stats,
      filtros: filter,
      exportedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `apontamentos-${vistoriaId}-${Date.now()}.json`);
        break;
      case 'csv':
        // Implementar exportação CSV
        break;
      case 'pdf':
        // Implementar exportação PDF
        break;
    }
  }, [filteredApontamentos, stats, filter, vistoriaId]);

  return {
    // Estado
    apontamentos: filteredApontamentos,
    categorias,
    stats,
    filter,
    selectedApontamentos,
    isCreating,
    isLoading: apontamentosLoading || categoriasLoading,
    error: apontamentosError,

    // Ações
    createApontamento,
    updateApontamento,
    deleteApontamento,
    updateMultipleStatus,
    deleteMultiple,
    validateApontamento,
    exportData,

    // Filtros
    setFilter: (newFilter: Partial<ApontamentoFilter>) => {
      setFilter(prev => ({ ...prev, ...newFilter }));
    },

    // Seleção
    toggleSelection: (id: string) => {
      setSelectedApontamentos(prev =>
        prev.includes(id)
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      );
    },
    selectAll: () => {
      setSelectedApontamentos(filteredApontamentos.map(a => a.id));
    },
    clearSelection: () => {
      setSelectedApontamentos([]);
    },

    // Utilitários
    getApontamentoById: (id: string) => apontamentos?.find(a => a.id === id),
    getCategoriasByGroup: (groupId: string) => categorias?.find(c => c.id === groupId),
    isSelected: (id: string) => selectedApontamentos.includes(id),
    hasSelection: selectedApontamentos.length > 0,
    selectedCount: selectedApontamentos.length
  };
}

// Funções auxiliares
function generateMockApontamentos(vistoriaId: string): Apontamento[] {
  const categories = DEFAULT_CATEGORIES;
  
  return Array.from({ length: 15 }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const subcategory = category.subcategorias[Math.floor(Math.random() * category.subcategorias.length)];
    const severidades: Apontamento['severidade'][] = ['baixa', 'media', 'alta', 'critica'];
    const status: Apontamento['status'][] = ['aberto', 'em_andamento', 'resolvido', 'fechado'];
    const prioridades: Apontamento['prioridade'][] = ['baixa', 'normal', 'alta', 'urgente'];
    
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const isResolved = Math.random() > 0.5;
    
    return {
      id: `apontamento-${i + 1}`,
      vistoriaId,
      categoria: category,
      subcategoria: subcategory.nome,
      titulo: `${category.nome} - ${subcategory.nome} ${i + 1}`,
      descricao: `Descrição detalhada do apontamento ${i + 1} encontrado durante a vistoria.`,
      severidade: severidades[Math.floor(Math.random() * severidades.length)],
      status: isResolved ? status[Math.floor(Math.random() * 2)] : status[0],
      prioridade: prioridades[Math.floor(Math.random() * prioridades.length)],
      localizacao: {
        ambiente: ['Sala', 'Cozinha', 'Quarto', 'Banheiro', 'Varanda'][Math.floor(Math.random() * 5)],
        parede: Math.random() > 0.5 ? 'Norte' : undefined,
        coordenadas: Math.random() > 0.7 ? { x: Math.random() * 100, y: Math.random() * 100 } : undefined
      },
      responsavel: Math.random() > 0.5 ? 'tecnico-1' : undefined,
      prazoResolucao: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      dataIdentificacao: createdAt,
      dataResolucao: isResolved ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      observacoes: [],
      anexos: [],
      tags: ['vistoria', 'manutenção', category.id],
      custoEstimado: Math.floor(Math.random() * 1000) + 50,
      tempoEstimado: Math.floor(Math.random() * 8) + 1,
      createdBy: 'user-1',
      createdAt,
      updatedAt: createdAt
    };
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}