import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVistoriaState } from '@/features/analise-vistoria/hooks/useVistoriaState';
import { setupMocks } from '@/test/utils/test-utils';

// Mock das dependências do hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  }),
}));

vi.mock('@/hooks/useOpenAI', () => ({
  useOpenAI: () => ({
    correctText: vi.fn(),
    extractApontamentos: vi.fn(),
    compareVistoriaImages: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useVistoriaImages', () => ({
  useVistoriaImages: () => ({
    fileToBase64: vi.fn(),
    base64ToFile: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePrestadores', () => ({
  usePrestadores: () => ({
    prestadores: [
      { id: 'prestador-1', nome: 'Prestador 1' },
      { id: 'prestador-2', nome: 'Prestador 2' },
    ],
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ state: null })),
  useParams: vi.fn(() => ({})),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/imageSerialGenerator', () => ({
  deduplicateImagesBySerial: vi.fn((images) => images),
}));

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockReturnValue({
            data: [
              {
                id: 'contract-1',
                title: 'Contrato Teste 1',
                document_type: 'contrato',
                created_at: '2024-01-01T00:00:00.000Z',
              },
              {
                id: 'contract-2',
                title: 'Contrato Teste 2',
                document_type: 'contrato',
                created_at: '2024-01-02T00:00:00.000Z',
              },
            ],
            error: null,
          }),
        })),
      })),
    })),
  },
}));

vi.mock('@/utils/core/dateFormatter', () => ({
  formatDateBrazilian: vi.fn((date) => '01/01/2024'),
}));

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useVistoriaState', () => {
  it('deve retornar o estado inicial correto', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.apontamentos).toEqual([]);
    expect(result.current.currentApontamento).toEqual({
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
    expect(result.current.contracts).toEqual([]);
    expect(result.current.selectedContract).toBeNull();
    expect(result.current.dadosVistoria).toEqual({
      locatario: '',
      endereco: '',
      dataVistoria: '',
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.documentMode).toBe('analise');
    expect(result.current.componentError).toBeNull();
  });

  it('deve carregar contratos do Supabase na inicialização', async () => {
    const { result } = renderHook(() => useVistoriaState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.contracts).toHaveLength(2);
    expect(result.current.contracts[0]).toMatchObject({
      id: 'contract-1',
      title: 'Contrato Teste 1',
      document_type: 'contrato',
    });
    expect(result.current.contracts[1]).toMatchObject({
      id: 'contract-2',
      title: 'Contrato Teste 2',
      document_type: 'contrato',
    });
  });

  it('deve ter acesso aos prestadores no modo orçamento', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.prestadores).toHaveLength(2);
    expect(result.current.prestadores[0]).toMatchObject({
      id: 'prestador-1',
      nome: 'Prestador 1',
    });
  });

  it('deve ter isAILoading definido corretamente', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.isAILoading).toBe(false);
  });

  it('deve retornar todas as funções set necessárias', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(typeof result.current.setApontamentos).toBe('function');
    expect(typeof result.current.setCurrentApontamento).toBe('function');
    expect(typeof result.current.setContracts).toBe('function');
    expect(typeof result.current.setSelectedContract).toBe('function');
    expect(typeof result.current.setDadosVistoria).toBe('function');
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.setEditingApontamento).toBe('function');
    expect(typeof result.current.setSavedAnaliseId).toBe('function');
    expect(typeof result.current.setIsEditMode).toBe('function');
    expect(typeof result.current.setEditingAnaliseId).toBe('function');
    expect(typeof result.current.setExistingAnaliseId).toBe('function');
    expect(typeof result.current.setHasExistingAnalise).toBe('function');
    expect(typeof result.current.setLoadingExistingAnalise).toBe('function');
    expect(typeof result.current.setSaving).toBe('function');
    expect(typeof result.current.setDocumentMode).toBe('function');
    expect(typeof result.current.setComponentError).toBe('function');
    expect(typeof result.current.setSelectedPrestadorId).toBe('function');
    expect(typeof result.current.setExtractionText).toBe('function');
    expect(typeof result.current.setShowExtractionPanel).toBe('function');
    expect(typeof result.current.setPublicDocumentId).toBe('function');
  });

  it('deve permitir atualizar o estado de apontamentos', () => {
    const { result } = renderHook(() => useVistoriaState());

    const mockApontamento = {
      id: 'apontamento-1',
      ambiente: 'Sala',
      subtitulo: 'Parede',
      descricao: 'Pintura descascada',
      descricaoServico: 'Pintura com tinta acrílica',
      vistoriaInicial: {
        fotos: [],
        descritivoLaudo: 'Estado de conservação regular',
      },
      vistoriaFinal: {
        fotos: [],
      },
      observacao: 'Observação de teste',
      tipo: 'material' as const,
      valor: 100,
      quantidade: 1,
    };

    result.current.setApontamentos([mockApontamento]);

    expect(result.current.apontamentos).toHaveLength(1);
    expect(result.current.apontamentos[0]).toMatchObject(mockApontamento);
  });

  it('deve permitir atualizar o contrato selecionado', () => {
    const { result } = renderHook(() => useVistoriaState());

    const mockContract = {
      id: 'contract-1',
      title: 'Contrato Teste',
    };

    result.current.setSelectedContract(mockContract);

    expect(result.current.selectedContract).toMatchObject(mockContract);
  });

  it('deve permitir atualizar os dados da vistoria', () => {
    const { result } = renderHook(() => useVistoriaState());

    const mockDadosVistoria = {
      locatario: 'João Silva',
      endereco: 'Rua das Flores, 123',
      dataVistoria: '01/01/2024',
    };

    result.current.setDadosVistoria(mockDadosVistoria);

    expect(result.current.dadosVistoria).toMatchObject(mockDadosVistoria);
  });

  it('deve permitir alterar o modo do documento', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.documentMode).toBe('analise');

    result.current.setDocumentMode('orcamento');

    expect(result.current.documentMode).toBe('orcamento');
  });

  it('deve permitir alterar o ID do prestador selecionado', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.selectedPrestadorId).toBe('');

    result.current.setSelectedPrestadorId('prestador-1');

    expect(result.current.selectedPrestadorId).toBe('prestador-1');
  });

  it('deve permitir alterar o texto de extração', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.extractionText).toBe('');

    result.current.setExtractionText('Texto de teste para extração');

    expect(result.current.extractionText).toBe('Texto de teste para extração');
  });

  it('deve permitir alterar o estado do painel de extração', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.showExtractionPanel).toBe(false);

    result.current.setShowExtractionPanel(true);

    expect(result.current.showExtractionPanel).toBe(true);
  });

  it('deve permitir alterar o ID do documento público', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.publicDocumentId).toBeNull();

    result.current.setPublicDocumentId('doc-public-1');

    expect(result.current.publicDocumentId).toBe('doc-public-1');
  });

  it('deve ter estados de edição corretos', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.editingApontamento).toBeNull();
    expect(result.current.savedAnaliseId).toBeNull();
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.editingAnaliseId).toBeNull();
    expect(result.current.existingAnaliseId).toBeNull();
    expect(result.current.hasExistingAnalise).toBe(false);
    expect(result.current.loadingExistingAnalise).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('deve permitir atualizar o apontamento em edição', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.editingApontamento).toBeNull();

    result.current.setEditingApontamento('apontamento-1');

    expect(result.current.editingApontamento).toBe('apontamento-1');
  });

  it('deve permitir atualizar o ID da análise salva', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.savedAnaliseId).toBeNull();

    result.current.setSavedAnaliseId('analise-salva-1');

    expect(result.current.savedAnaliseId).toBe('analise-salva-1');
  });

  it('deve permitir ativar o modo de edição', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.isEditMode).toBe(false);

    result.current.setIsEditMode(true);

    expect(result.current.isEditMode).toBe(true);
  });

  it('deve permitir atualizar o ID da análise em edição', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.editingAnaliseId).toBeNull();

    result.current.setEditingAnaliseId('analise-edicao-1');

    expect(result.current.editingAnaliseId).toBe('analise-edicao-1');
  });

  it('deve permitir atualizar o ID da análise existente', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.existingAnaliseId).toBeNull();

    result.current.setExistingAnaliseId('analise-existente-1');

    expect(result.current.existingAnaliseId).toBe('analise-existente-1');
  });

  it('deve permitir definir se existe análise existente', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.hasExistingAnalise).toBe(false);

    result.current.setHasExistingAnalise(true);

    expect(result.current.hasExistingAnalise).toBe(true);
  });

  it('deve permitir atualizar o estado de carregamento da análise existente', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.loadingExistingAnalise).toBe(false);

    result.current.setLoadingExistingAnalise(true);

    expect(result.current.loadingExistingAnalise).toBe(true);
  });

  it('deve permitir atualizar o estado de salvamento', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.saving).toBe(false);

    result.current.setSaving(true);

    expect(result.current.saving).toBe(true);
  });

  it('deve permitir definir um erro de componente', () => {
    const { result } = renderHook(() => useVistoriaState());

    expect(result.current.componentError).toBeNull();

    result.current.setComponentError('Erro de teste');

    expect(result.current.componentError).toBe('Erro de teste');
  });
});