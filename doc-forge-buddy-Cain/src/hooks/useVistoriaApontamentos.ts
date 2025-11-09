import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ApontamentoVistoria, VistoriaAnaliseWithImages } from '@/types/vistoria';
import { BudgetItemType } from '@/types/orcamento';
'responsabilidade' | 'revisao';
  tipo?: BudgetItemType;
  valor?: number;
  quantidade?: number;
}

/**
 * Interface para ações de apontamento
 */
export interface ApontamentoActions {
  // CRUD de apontamentos
  addApontamento: (apontamento: ApontamentoVistoria) => void;
  updateApontamento: (id: string, updates: Partial<ApontamentoVistoria>) => void;
  removeApontamento: (id: string) => void;
  clearApontamentos: () => void;
  
  // Edição de apontamento
  startEditApontamento: (id: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  
  // Estado do apontamento atual
  resetCurrentApontamento: () => void;
  setCurrentApontamento: (apontamento: Partial<CurrentApontamentoState>) => void;
  
  // Adicionar imagens
  addImagesToCurrent: (images: any[], tipo: 'inicial' | 'final') => void;
  removeImageFromCurrent: (tipo: 'inicial' | 'final', index: number) => void;
  
  // Validações
  validateCurrentApontamento: (documentMode: 'analise' | 'orcamento') => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Extração de apontamentos
  extractApontamentosFromText: (text: string) => ApontamentoVistoria[];
}

/**
 * Interface de retorno do hook
 */
export interface UseVistoriaApontamentosReturn extends ApontamentoActions {
  // Estado
  apontamentos: ApontamentoVistoria[];
  currentApontamento: CurrentApontamentoState;
  editingApontamento: string | null;
  
  // Estatísticas
  getApontamentosStats: () => {
    total: number;
    byEnvironment: Record<string, number>;
    withPhotos: number;
    withoutPhotos: number;
    classified: number;
    unclassified: number;
  };
  
  // Busca e filtros
  searchApontamentos: (query: string) => ApontamentoVistoria[];
  getApontamentosByEnvironment: (environment: string) => ApontamentoVistoria[];
  getUnclassifiedApontamentos: () => ApontamentoVistoria[];
  
  // Utilitários
  duplicateApontamento: (id: string) => void;
  moveApontamento: (fromIndex: number, toIndex: number) => void;
}

/**
 * Hook para lógica de apontamentos da vistoria
 */
export const useVistoriaApontamentos = (): UseVistoriaApontamentosReturn => {
  const { toast } = useToast();
  
  const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);
  const [editingApontamento, setEditingApontamento] = useState<string | null>(null);
  const [currentApontamento, setCurrentApontamentoState] = useState<CurrentApontamentoState>({
    ambiente: '',
    subtitulo: '',
    descricao: '',
    descricaoServico: '',
    vistoriaInicial: { fotos: [], descritivoLaudo: '' },
    vistoriaFinal: { fotos: [] },
    observacao: '',
    classificacao: undefined,
    tipo: 'material',
    valor: 0,
    quantidade: 0,
  });

  /**
   * Adiciona um novo apontamento
   */
  const addApontamento = useCallback((apontamento: ApontamentoVistoria) => {
    setApontamentos(prev => [...prev, apontamento]);
    toast({
      title: 'Apontamento adicionado',
      description: 'O apontamento foi adicionado com sucesso.',
    });
  }, [toast]);

  /**
   * Atualiza um apontamento existente
   */
  const updateApontamento = useCallback((id: string, updates: Partial<ApontamentoVistoria>) => {
    setApontamentos(prev => 
      prev.map(ap => ap.id === id ? { ...ap, ...updates } : ap)
    );
  }, []);

  /**
   * Remove um apontamento
   */
  const removeApontamento = useCallback((id: string) => {
    setApontamentos(prev => prev.filter(ap => ap.id !== id));
    toast({
      title: 'Apontamento removido',
      description: 'O apontamento foi removido com sucesso.',
    });
  }, [toast]);

  /**
   * Remove todos os apontamentos
   */
  const clearApontamentos = useCallback(() => {
    setApontamentos([]);
    setEditingApontamento(null);
    resetCurrentApontamento();
  }, []);

  /**
   * Inicia edição de um apontamento
   */
  const startEditApontamento = useCallback((id: string) => {
    const apontamento = apontamentos.find(ap => ap.id === id);
    if (!apontamento) return;

    setEditingApontamento(id);
    setCurrentApontamentoState({
      ambiente: apontamento.ambiente || '',
      subtitulo: apontamento.subtitulo || '',
      descricao: apontamento.descricao || '',
      descricaoServico: apontamento.descricaoServico || '',
      vistoriaInicial: {
        fotos: apontamento.vistoriaInicial?.fotos || [],
        descritivoLaudo: apontamento.vistoriaInicial?.descritivoLaudo || '',
      },
      vistoriaFinal: {
        fotos: apontamento.vistoriaFinal?.fotos || [],
      },
      observacao: apontamento.observacao || '',
      classificacao: apontamento.classificacao,
      tipo: apontamento.tipo || 'material',
      valor: apontamento.valor || 0,
      quantidade: apontamento.quantidade || 0,
    });
    
    toast({
      title: 'Editando apontamento',
      description: 'Modifique os dados e clique em "Salvar Alterações".',
    });
  }, [apontamentos, toast]);

  /**
   * Salva as alterações do apontamento sendo editado
   */
  const saveEdit = useCallback(() => {
    if (!editingApontamento) return;

    const updatedApontamentos = apontamentos.map((apontamento) =>
      apontamento.id === editingApontamento
        ? {
            ...apontamento,
            ambiente: currentApontamento.ambiente || '',
            subtitulo: currentApontamento.subtitulo || '',
            descricao: currentApontamento.descricao || '',
            descricaoServico: currentApontamento.descricaoServico || '',
            vistoriaInicial: {
              fotos: currentApontamento.vistoriaInicial.fotos || [],
              descritivoLaudo: currentApontamento.vistoriaInicial.descritivoLaudo || '',
            },
            vistoriaFinal: {
              fotos: currentApontamento.vistoriaFinal.fotos || [],
            },
            observacao: currentApontamento.observacao || '',
            classificacao: currentApontamento.classificacao,
            tipo: currentApontamento.tipo || 'material',
            valor: currentApontamento.valor || 0,
            quantidade: currentApontamento.quantidade || 0,
          }
        : apontamento
    );

    setApontamentos(updatedApontamentos);
    setEditingApontamento(null);
    resetCurrentApontamento();

    toast({
      title: 'Apontamento atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
  }, [editingApontamento, currentApontamento, apontamentos, toast]);

  /**
   * Cancela a edição
   */
  const cancelEdit = useCallback(() => {
    setEditingApontamento(null);
    resetCurrentApontamento();
  }, []);

  /**
   * Reseta o apontamento atual para valores padrão
   */
  const resetCurrentApontamento = useCallback(() => {
    setCurrentApontamentoState({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      descricaoServico: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      classificacao: undefined,
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });
  }, []);

  /**
   * Atualiza o apontamento atual
   */
  const setCurrentApontamento = useCallback((apontamento: Partial<CurrentApontamentoState>) => {
    setCurrentApontamentoState(prev => ({ ...prev, ...apontamento }));
  }, []);

  /**
   * Adiciona imagens ao apontamento atual
   */
  const addImagesToCurrent = useCallback((images: any[], tipo: 'inicial' | 'final') => {
    setCurrentApontamentoState(prev => ({
      ...prev,
      [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
        ...prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`],
        fotos: [
          ...(prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]?.fotos || []),
          ...images,
        ],
      },
    }));
  }, []);

  /**
   * Remove imagem do apontamento atual
   */
  const removeImageFromCurrent = useCallback((tipo: 'inicial' | 'final', index: number) => {
    setCurrentApontamentoState(prev => ({
      ...prev,
      [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
        ...prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`],
        fotos: (prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]?.fotos || []).filter((_, i) => i !== index),
      },
    }));
  }, []);

  /**
   * Valida o apontamento atual
   */
  const validateCurrentApontamento = useCallback((documentMode: 'analise' | 'orcamento') => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!currentApontamento.ambiente?.trim()) {
      errors.push('Ambiente é obrigatório');
    }
    if (!currentApontamento.descricao?.trim()) {
      errors.push('Descrição é obrigatória');
    }
    if (documentMode === 'orcamento' && !currentApontamento.descricaoServico?.trim()) {
      errors.push('Descrição do serviço é obrigatória no modo orçamento');
    }

    // Validações de fotos
    const fotosInicial = currentApontamento.vistoriaInicial?.fotos || [];
    const fotosFinal = currentApontamento.vistoriaFinal?.fotos || [];

    if (fotosInicial.length === 0) {
      errors.push('É necessário pelo menos uma foto da vistoria inicial');
    }
    if (fotosFinal.length === 0) {
      errors.push('É necessário pelo menos uma foto da vistoria final');
    }

    // Validações de orçamento
    if (documentMode === 'orcamento') {
      if (!currentApontamento.tipo) {
        errors.push('Tipo de orçamento é obrigatório');
      }
      if (typeof currentApontamento.valor !== 'number' || currentApontamento.valor <= 0) {
        errors.push('Valor deve ser maior que zero');
      }
      if (typeof currentApontamento.quantidade !== 'number' || currentApontamento.quantidade <= 0) {
        errors.push('Quantidade deve ser maior que zero');
      }
    }

    // Validações de classificação
    if (documentMode === 'analise' && !currentApontamento.classificacao) {
      errors.push('Classificação é obrigatória no modo análise');
    }

    // Avisos
    if (!currentApontamento.subtitulo?.trim()) {
      warnings.push('Subtítulo não informado - ajudará na organização');
    }
    if (!currentApontamento.observacao?.trim()) {
      warnings.push('Análise técnica não informada - recomendada para documentação');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [currentApontamento]);

  /**
   * Extrai apontamentos de texto (implementação básica)
   */
  const extractApontamentosFromText = useCallback((text: string): ApontamentoVistoria[] => {
    // Implementação básica - pode ser melhorada com IA ou regex mais sofisticados
    const lines = text.split('\n').filter(line => line.trim());
    const apontamentos: ApontamentoVistoria[] = [];
    let currentApontamento: Partial<ApontamentoVistoria> = {};
    let isInApontamento = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar ambiente (linha em maiúscula ou seguida de descrição)
      if (line === line.toUpperCase() && line.length > 2 && line.length < 50) {
        // Salvar apontamento anterior se existir
        if (isInApontamento && currentApontamento.ambiente) {
          apontamentos.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ambiente: currentApontamento.ambiente,
            subtitulo: currentApontamento.subtitulo || '',
            descricao: currentApontamento.descricao || '',
            descricaoServico: '',
            vistoriaInicial: { fotos: [], descritivoLaudo: '' },
            vistoriaFinal: { fotos: [] },
            observacao: '',
            classificacao: undefined,
            ...(documentMode === 'orcamento' && {
              tipo: 'material' as const,
              valor: 0,
              quantidade: 0,
            }),
          } as ApontamentoVistoria);
        }

        // Iniciar novo apontamento
        currentApontamento = { ambiente: line };
        isInApontamento = true;
      } else if (isInApontamento && line.length > 10) {
        // Adicionar à descrição
        currentApontamento.descricao = 
          (currentApontamento.descricao ? currentApontamento.descricao + '\n' : '') + line;
      }
    }

    // Adicionar último apontamento
    if (isInApontamento && currentApontamento.ambiente) {
      apontamentos.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ambiente: currentApontamento.ambiente,
        subtitulo: currentApontamento.subtitulo || '',
        descricao: currentApontamento.descricao || '',
        descricaoServico: '',
        vistoriaInicial: { fotos: [], descritivoLaudo: '' },
        vistoriaFinal: { fotos: [] },
        observacao: '',
        classificacao: undefined,
        ...(documentMode === 'orcamento' && {
          tipo: 'material' as const,
          valor: 0,
          quantidade: 0,
        }),
      } as ApontamentoVistoria);
    }

    return apontamentos;
  }, []);

  /**
   * Obtém estatísticas dos apontamentos
   */
  const getApontamentosStats = useCallback(() => {
    const stats = {
      total: apontamentos.length,
      byEnvironment: {} as Record<string, number>,
      withPhotos: 0,
      withoutPhotos: 0,
      classified: 0,
      unclassified: 0,
    };

    apontamentos.forEach(apontamento => {
      // Por ambiente
      const ambiente = apontamento.ambiente || 'Sem ambiente';
      stats.byEnvironment[ambiente] = (stats.byEnvironment[ambiente] || 0) + 1;

      // Com/sem fotos
      const hasFotos = (apontamento.vistoriaInicial?.fotos?.length || 0) > 0 &&
                      (apontamento.vistoriaFinal?.fotos?.length || 0) > 0;
      if (hasFotos) {
        stats.withPhotos++;
      } else {
        stats.withoutPhotos++;
      }

      // Classificado
      if (apontamento.classificacao) {
        stats.classified++;
      } else {
        stats.unclassified++;
      }
    });

    return stats;
  }, [apontamentos]);

  /**
   * Busca apontamentos por texto
   */
  const searchApontamentos = useCallback((query: string) => {
    if (!query.trim()) return apontamentos;
    
    const lowerQuery = query.toLowerCase();
    return apontamentos.filter(apontamento =>
      apontamento.ambiente?.toLowerCase().includes(lowerQuery) ||
      apontamento.descricao?.toLowerCase().includes(lowerQuery) ||
      apontamento.subtitulo?.toLowerCase().includes(lowerQuery) ||
      apontamento.observacao?.toLowerCase().includes(lowerQuery)
    );
  }, [apontamentos]);

  /**
   * Filtra apontamentos por ambiente
   */
  const getApontamentosByEnvironment = useCallback((environment: string) => {
    return apontamentos.filter(apontamento =>
      apontamento.ambiente?.toLowerCase() === environment.toLowerCase()
    );
  }, [apontamentos]);

  /**
   * Retorna apontamentos não classificados
   */
  const getUnclassifiedApontamentos = useCallback(() => {
    return apontamentos.filter(apontamento => !apontamento.classificacao);
  }, [apontamentos]);

  /**
   * Duplica um apontamento
   */
  const duplicateApontamento = useCallback((id: string) => {
    const original = apontamentos.find(ap => ap.id === id);
    if (!original) return;

    const duplicate: ApontamentoVistoria = {
      ...original,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ambiente: `${original.ambiente} (Cópia)`,
    };

    setApontamentos(prev => [...prev, duplicate]);
    toast({
      title: 'Apontamento duplicado',
      description: 'Cópia do apontamento foi criada com sucesso.',
    });
  }, [apontamentos, toast]);

  /**
   * Move apontamento de posição
   */
  const moveApontamento = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= apontamentos.length || toIndex >= apontamentos.length) {
      return;
    }

    const newApontamentos = [...apontamentos];
    const [moved] = newApontamentos.splice(fromIndex, 1);
    newApontamentos.splice(toIndex, 0, moved);
    
    setApontamentos(newApontamentos);
  }, [apontamentos]);

  return {
    // Estado
    apontamentos,
    currentApontamento,
    editingApontamento,
    
    // Ações CRUD
    addApontamento,
    updateApontamento,
    removeApontamento,
    clearApontamentos,
    
    // Edição
    startEditApontamento,
    saveEdit,
    cancelEdit,
    
    // Estado atual
    resetCurrentApontamento,
    setCurrentApontamento,
    
    // Imagens
    addImagesToCurrent,
    removeImageFromCurrent,
    
    // Validação
    validateCurrentApontamento,
    
    // Extração
    extractApontamentosFromText,
    
    // Estatísticas
    getApontamentosStats,
    
    // Busca e filtros
    searchApontamentos,
    getApontamentosByEnvironment,
    getUnclassifiedApontamentos,
    
    // Utilitários
    duplicateApontamento,
    moveApontamento,
  };
};

export default useVistoriaApontamentos;