import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnaliseVistoriaOtimizada } from '@/components/performance/AnaliseVistoriaOtimizada';
import { render, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
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

vi.mock('@/lib/icons', () => ({
  AlertCircle: () => <div data-testid="icon-alert-circle">AlertCircle</div>,
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }),
}));

vi.mock('@/components/performance', () => ({
  LazyWrapper: ({ children, fallback }: any) => (
    <div data-testid="lazy-wrapper">
      {children}
    </div>
  ),
  LazyComponentWithMetrics: ({ children }: any) => (
    <div data-testid="lazy-component">
      {children}
    </div>
  ),
  usePreloadManager: () => ({
    preload: vi.fn(),
    isPreloaded: vi.fn(),
  }),
}));

vi.mock('@/components/performance/SkeletonComponents', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">DashboardSkeleton</div>,
  TableSkeleton: () => <div data-testid="table-skeleton">TableSkeleton</div>,
  CardSkeleton: () => <div data-testid="card-skeleton">CardSkeleton</div>,
}));

// Mock dos componentes lazy
vi.mock('./components/VistoriaResults', () => ({
  default: () => <div data-testid="vistoria-results">VistoriaResults</div>,
}));

vi.mock('./components/ApontamentoForm', () => ({
  default: () => <div data-testid="apontamento-form">ApontamentoForm</div>,
}));

vi.mock('./components/PrestadorSelector', () => ({
  default: () => <div data-testid="prestador-selector">PrestadorSelector</div>,
}));

vi.mock('./components/VistoriaActions', () => ({
  default: () => <div data-testid="vistoria-actions">VistoriaActions</div>,
}));

// Mock dos hooks
vi.mock('./hooks/useVistoriaState', () => ({
  useVistoriaState: () => ({
    contratos: [
      { id: '1', numeroContrato: 'CTR-2024-001', locatario: 'João Silva' },
      { id: '2', numeroContrato: 'CTR-2024-002', locatario: 'Ana Costa' },
    ],
    selectedContract: { id: '1', numeroContrato: 'CTR-2024-001', locatario: 'João Silva' },
    loading: false,
    apontamentos: [
      { id: '1', descricao: 'Apontamento 1', status: 'pendente' },
      { id: '2', descricao: 'Apontamento 2', status: 'concluido' },
    ],
  }),
}));

vi.mock('./hooks/useVistoriaHandlers', () => ({
  useVistoriaHandlers: () => ({
    handleSave: vi.fn(),
    handleAddApontamento: vi.fn(),
    handleRemoveApontamento: vi.fn(),
    handleSelectContract: vi.fn(),
    handleEditApontamento: vi.fn(),
  }),
}));

beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AnaliseVistoriaOtimizada', () => {
  const mockProps = {
    contractId: '1',
    isEditMode: false,
  };

  it('deve renderizar o componente principal', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Análise de Vistoria')).toBeInTheDocument();
  });

  it('deve renderizar skeletons durante loading inicial', () => {
    const { useVistoriaState } = vi.mocked(require('./hooks/useVistoriaState'));
    useVistoriaState.mockReturnValue({
      ...useVistoriaState(),
      loading: true,
    });

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });

  it('deve renderizar dropdown de seleção de contrato', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByText('Selecione o Contrato')).toBeInTheDocument();
    expect(screen.getByText('CTR-2024-001')).toBeInTheDocument();
    expect(screen.getByText('CTR-2024-002')).toBeInTheDocument();
  });

  it('deve renderizar resultados da vistoria', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByTestId('vistoria-results')).toBeInTheDocument();
  });

  it('deve renderizar formulários lazy-loaded', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    // Os componentes lazy são carregados com Suspense
    expect(screen.getByTestId('lazy-wrapper')).toBeInTheDocument();
  });

  it('deve renderizar lista de apontamentos', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByText('Lista de Apontamentos')).toBeInTheDocument();
    expect(screen.getByText('Apontamento 1')).toBeInTheDocument();
    expect(screen.getByText('Apontamento 2')).toBeInTheDocument();
  });

  it('deve renderizar ações da vistoria', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByTestId('vistoria-actions')).toBeInTheDocument();
  });

  it('deve permitir selecionar contrato', async () => {
    const user = userEvent.setup();
    const { useVistoriaHandlers } = vi.mocked(require('./hooks/useVistoriaHandlers'));
    const mockHandlers = {
      handleSelectContract: vi.fn(),
      handleSave: vi.fn(),
      handleAddApontamento: vi.fn(),
      handleRemoveApontamento: vi.fn(),
      handleEditApontamento: vi.fn(),
    };
    useVistoriaHandlers.mockReturnValue(mockHandlers);

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    const contractSelect = screen.getByText('Selecione o Contrato');
    await user.click(contractSelect);

    const contractOption = screen.getByText('CTR-2024-002');
    await user.click(contractOption);

    expect(mockHandlers.handleSelectContract).toHaveBeenCalled();
  });

  it('deve adicionar novo apontamento', async () => {
    const user = userEvent.setup();
    const { useVistoriaHandlers } = vi.mocked(require('./hooks/useVistoriaHandlers'));
    const mockHandlers = {
      handleSelectContract: vi.fn(),
      handleSave: vi.fn(),
      handleAddApontamento: vi.fn(),
      handleRemoveApontamento: vi.fn(),
      handleEditApontamento: vi.fn(),
    };
    useVistoriaHandlers.mockReturnValue(mockHandlers);

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    const addButton = screen.getByText('Adicionar Apontamento');
    await user.click(addButton);

    expect(mockHandlers.handleAddApontamento).toHaveBeenCalled();
  });

  it('deve salvar análise', async () => {
    const user = userEvent.setup();
    const { useVistoriaHandlers } = vi.mocked(require('./hooks/useVistoriaHandlers'));
    const mockHandlers = {
      handleSelectContract: vi.fn(),
      handleSave: vi.fn(),
      handleAddApontamento: vi.fn(),
      handleRemoveApontamento: vi.fn(),
      handleEditApontamento: vi.fn(),
    };
    useVistoriaHandlers.mockReturnValue(mockHandlers);

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    const saveButton = screen.getByText('Salvar Análise');
    await user.click(saveButton);

    expect(mockHandlers.handleSave).toHaveBeenCalled();
  });

  it('deve mostrar estado de loading ao salvar', async () => {
    const { useVistoriaState } = vi.mocked(require('./hooks/useVistoriaState'));
    useVistoriaState.mockReturnValue({
      ...useVistoriaState(),
      saving: true,
    });

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    const saveButton = screen.getByText('Salvando...');
    expect(saveButton).toBeInTheDocument();
  });

  it('deve renderizar em modo de edição quando especificado', () => {
    render(
      <AnaliseVistoriaOtimizada 
        {...mockProps}
        isEditMode={true}
        editingAnaliseId="1"
      />
    );

    expect(screen.getByText('Editar Análise')).toBeInTheDocument();
  });

  it('deve mostrar erro quando contrato não é selecionado', () => {
    const { useVistoriaState } = vi.mocked(require('./hooks/useVistoriaState'));
    useVistoriaState.mockReturnValue({
      ...useVistoriaState(),
      selectedContract: null,
    });

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
    expect(screen.getByText('Selecione um contrato para continuar')).toBeInTheDocument();
  });

  it('deve renderizar estatísticas da análise', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    expect(screen.getByText('Total de Apontamentos: 2')).toBeInTheDocument();
  });

  it('deve renderizar filtro por status', () => {
    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    expect(screen.getByText('Filtrar por Status')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('deve permitir editar apontamento', async () => {
    const user = userEvent.setup();
    const { useVistoriaHandlers } = vi.mocked(require('./hooks/useVistoriaHandlers'));
    const mockHandlers = {
      handleSelectContract: vi.fn(),
      handleSave: vi.fn(),
      handleAddApontamento: vi.fn(),
      handleRemoveApontamento: vi.fn(),
      handleEditApontamento: vi.fn(),
    };
    useVistoriaHandlers.mockReturnValue(mockHandlers);

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    // Procurar botão de editar (assumindo que existe)
    const editButtons = screen.getAllByText('Editar');
    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
      expect(mockHandlers.handleEditApontamento).toHaveBeenCalled();
    }
  });

  it('deve permitir remover apontamento', async () => {
    const user = userEvent.setup();
    const { useVistoriaHandlers } = vi.mocked(require('./hooks/useVistoriaHandlers'));
    const mockHandlers = {
      handleSelectContract: vi.fn(),
      handleSave: vi.fn(),
      handleAddApontamento: vi.fn(),
      handleRemoveApontamento: vi.fn(),
      handleEditApontamento: vi.fn(),
    };
    useVistoriaHandlers.mockReturnValue(mockHandlers);

    render(
      <AnaliseVistoriaOtimizada {...mockProps} />
    );

    // Procurar botão de remover (assumindo que existe)
    const deleteButtons = screen.getAllByText('Remover');
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      expect(mockHandlers.handleRemoveApontamento).toHaveBeenCalled();
    }
  });
});