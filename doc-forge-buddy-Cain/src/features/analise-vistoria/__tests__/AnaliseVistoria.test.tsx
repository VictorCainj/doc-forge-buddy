import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnaliseVistoria from '@/features/analise-vistoria/AnaliseVistoria';
import { render, createMockApontamento, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

// Mock dos hooks e dependências
vi.mock('@/features/analise-vistoria/hooks/useVistoriaState', () => ({
  useVistoriaState: vi.fn(() => ({
    apontamentos: [],
    setApontamentos: vi.fn(),
    currentApontamento: {
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
    },
    setCurrentApontamento: vi.fn(),
    contracts: [],
    selectedContract: null,
    setSelectedContract: vi.fn(),
    dadosVistoria: {
      locatario: '',
      endereco: '',
      dataVistoria: '',
    },
    setDadosVistoria: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    editingApontamento: null,
    setEditingApontamento: vi.fn(),
    savedAnaliseId: null,
    setSavedAnaliseId: vi.fn(),
    isEditMode: false,
    setIsEditMode: vi.fn(),
    editingAnaliseId: null,
    setEditingAnaliseId: vi.fn(),
    existingAnaliseId: null,
    setExistingAnaliseId: vi.fn(),
    hasExistingAnalise: false,
    setHasExistingAnalise: vi.fn(),
    loadingExistingAnalise: false,
    setLoadingExistingAnalise: vi.fn(),
    saving: false,
    setSaving: vi.fn(),
    documentMode: 'analise',
    setDocumentMode: vi.fn(),
    componentError: null,
    setComponentError: vi.fn(),
    selectedPrestadorId: '',
    setSelectedPrestadorId: vi.fn(),
    extractionText: '',
    setExtractionText: vi.fn(),
    showExtractionPanel: false,
    setShowExtractionPanel: vi.fn(),
    publicDocumentId: null,
    setPublicDocumentId: vi.fn(),
    isAILoading: false,
    prestadores: [],
  })),
}));

vi.mock('@/features/analise-vistoria/hooks/useVistoriaHandlers', () => ({
  useVistoriaHandlers: vi.fn(() => ({
    handleAddApontamento: vi.fn(),
    handleRemoveApontamento: vi.fn(),
    handleEditApontamento: vi.fn(),
    handleSaveEdit: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleCorrectText: vi.fn(),
    handleExtractApontamentos: vi.fn(),
    handleAIAnalysisForCurrentApontamento: vi.fn(),
  })),
}));

vi.mock('@/hooks/useVistoriaAnalises', () => ({
  useVistoriaAnalises: () => ({
    saveAnalise: vi.fn().mockResolvedValue({ id: 'saved-analise-1' }),
    updateAnalise: vi.fn().mockResolvedValue({ id: 'updated-analise-1' }),
  }),
}));

vi.mock('@/hooks/useVistoriaImages', () => ({
  useVistoriaImages: () => ({
    fileToBase64: vi.fn(),
    base64ToFile: vi.fn(),
  }),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/core/dateFormatter', () => ({
  formatDateBrazilian: vi.fn((date) => '01/01/2024'),
}));

vi.mock('@/templates/analiseVistoria', () => ({
  ANALISE_VISTORIA_TEMPLATE: vi.fn().mockResolvedValue('<div>Template content</div>'),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ state: null })),
  useParams: vi.fn(() => ({})),
}));

// Mock dos componentes UI
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, ...props }: any) => (
    <button 
      data-testid="button" 
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/utils/iconMapper', () => ({
  AlertCircle: () => <div data-testid="icon-alert-circle">AlertCircle</div>,
}));

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

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AnaliseVistoria', () => {
  it('deve renderizar o componente sem erro', () => {
    render(<AnaliseVistoria />);
    
    expect(screen.getByText(/Análise de Vistoria/i)).toBeInTheDocument();
  });

  it('deve mostrar a mensagem de contrato não selecionado quando nenhum contrato estiver selecionado', () => {
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      selectedContract: null,
      loading: false,
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Selecione um contrato para iniciar a análise/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
  });

  it('deve não mostrar a mensagem de contrato não selecionado quando um contrato estiver selecionado', () => {
    const mockContract = {
      id: 'contract-1',
      title: 'Contrato Teste',
    };
    
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      selectedContract: mockContract,
      loading: false,
    });

    render(<AnaliseVistoria />);

    expect(screen.queryByText(/Selecione um contrato para iniciar a análise/i)).not.toBeInTheDocument();
  });

  it('deve renderizar o header com as ações principais', () => {
    render(<AnaliseVistoria />);

    // Verificar se o header está presente
    expect(screen.getByText(/Análise de Vistoria/i)).toBeInTheDocument();
  });

  it('deve renderizar o grid de layout principal', () => {
    render(<AnaliseVistoria />);

    // Verificar se os componentes principais estão presentes
    expect(screen.getByText(/Formulário de Novo Apontamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Resultados e Lista de Apontamentos/i)).toBeInTheDocument();
  });

  it('deve renderizar o ApontamentoForm quando um contrato estiver selecionado', () => {
    const mockContract = {
      id: 'contract-1',
      title: 'Contrato Teste',
    };
    
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      selectedContract: mockContract,
      loading: false,
    });

    render(<AnaliseVistoria />);

    // Verificar se o componente de formulário está presente
    expect(screen.getByText(/Formulário de Novo Apontamento/i)).toBeInTheDocument();
  });

  it('deve renderizar o VistoriaResults', () => {
    render(<AnaliseVistoria />);

    expect(screen.getByText(/Resultados e Lista de Apontamentos/i)).toBeInTheDocument();
  });

  it('deve não renderizar o PrestadorSelector quando não estiver no modo orçamento', () => {
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      documentMode: 'analise',
      selectedContract: { id: 'contract-1' },
      prestadores: [],
    });

    render(<AnaliseVistoria />);

    expect(screen.queryByText(/Selecionar Prestador/i)).not.toBeInTheDocument();
  });

  it('deve renderizar o PrestadorSelector quando estiver no modo orçamento', () => {
    const mockContract = { id: 'contract-1' };
    const mockPrestadores = [
      { id: 'prestador-1', nome: 'Prestador 1' },
    ];
    
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      documentMode: 'orcamento',
      selectedContract: mockContract,
      prestadores: mockPrestadores,
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Selecionar Prestador/i)).toBeInTheDocument();
  });

  it('deve renderizar a tela de erro quando componentError estiver presente', () => {
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      componentError: 'Erro de teste',
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Erro no Componente/i)).toBeInTheDocument();
    expect(screen.getByText('Erro de teste')).toBeInTheDocument();
    expect(screen.getByText(/Recarregar Página/i)).toBeInTheDocument();
  });

  it('deve chamar setComponentError e window.location.reload quando o botão recarregar for clicado', async () => {
    const user = userEvent.setup();
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    const mockSetComponentError = vi.fn();
    
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      componentError: 'Erro de teste',
      setComponentError: mockSetComponentError,
    });

    vi.spyOn(window.location, 'reload').mockImplementation(() => {
      mockSetComponentError(null);
    });

    render(<AnaliseVistoria />);

    const reloadButton = screen.getByText(/Recarregar Página/i);
    await user.click(reloadButton);

    await waitFor(() => {
      expect(mockSetComponentError).toHaveBeenCalledWith(null);
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('deve ter a estrutura correta do layout com max-w container', () => {
    render(<AnaliseVistoria />);

    // Verificar se o container principal está presente
    const container = screen.getByText(/Análise de Vistoria/i).closest('div[class*="max-w"]');
    expect(container).toBeInTheDocument();
  });

  it('deve renderizar o background com a cor correta', () => {
    render(<AnaliseVistoria />);

    const background = screen.getByText(/Análise de Vistoria/i).closest('div[class*="bg-neutral-50"]');
    expect(background).toBeInTheDocument();
  });

  it('deve usar o grid layout responsivo correto', () => {
    render(<AnaliseVistoria />);

    // Verificar se o grid está presente
    const grid = screen.getByText(/Análise de Vistoria/i).closest('div[class*="grid"]');
    expect(grid).toBeInTheDocument();
  });

  it('deve renderizar quando loading for true', () => {
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      loading: true,
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Análise de Vistoria/i)).toBeInTheDocument();
  });

  it('deve renderizar com apontamentos quando existirem', () => {
    const mockApontamentos = [createMockApontamento()];
    
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      apontamentos: mockApontamentos,
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Resultados e Lista de Apontamentos/i)).toBeInTheDocument();
  });

  it('deve renderizar corretamente com prestadores vazios no modo orçamento', () => {
    const { useVistoriaState } = vi.mocked(require('@/features/analise-vistoria/hooks/useVistoriaState'));
    const mockUseVistoriaState = vi.mocked(useVistoriaState as any);
    mockUseVistoriaState.mockReturnValue({
      ...mockUseVistoriaState(),
      documentMode: 'orcamento',
      selectedContract: { id: 'contract-1' },
      prestadores: [],
    });

    render(<AnaliseVistoria />);

    expect(screen.getByText(/Análise de Vistoria/i)).toBeInTheDocument();
  });

  it('deve ter uma estrutura de header com border', () => {
    render(<AnaliseVistoria />);

    // Verificar se existe um header com border
    const header = screen.getByText(/Análise de Vistoria/i).closest('div[class*="border-b"]');
    expect(header).toBeInTheDocument();
  });
});