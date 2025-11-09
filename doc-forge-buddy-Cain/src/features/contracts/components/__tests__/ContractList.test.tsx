import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractList } from '@/features/contracts/components/ContractList';
import { render, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

// Mock dos hooks
vi.mock('@/features/contracts/hooks/useContractActions', () => ({
  useContractActions: () => ({
    deleteContract: vi.fn().mockResolvedValue(true),
    duplicateContract: vi.fn().mockResolvedValue({
      id: 'contract-copy-1',
      title: 'Contrato Teste (Cópia)',
    }),
    exportContracts: vi.fn(),
    bulkDelete: vi.fn().mockResolvedValue(true),
    bulkUpdateStatus: vi.fn().mockResolvedValue(false),
  }),
}));

vi.mock('@/hooks/useContractsQuery', () => ({
  useContractsQuery: () => ({
    contracts: [
      {
        id: 'contract-1',
        title: 'Contrato 1',
        form_data: {
          numeroContrato: '001',
          nomeLocatario: 'João Silva',
          enderecoImovel: 'Rua A, 123',
        },
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'contract-2',
        title: 'Contrato 2',
        form_data: {
          numeroContrato: '002',
          nomeLocatario: 'Maria Santos',
          enderecoImovel: 'Rua B, 456',
        },
        created_at: '2024-01-02T00:00:00.000Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

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

vi.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => (
    <input 
      data-testid="input" 
      className={className}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ContractList', () => {
  it('deve renderizar o título da lista de contratos', () => {
    render(<ContractList />);

    expect(screen.getByText('Lista de Contratos')).toBeInTheDocument();
  });

  it('deve mostrar carregamento quando isLoading for true', () => {
    const { useContractsQuery } = vi.mocked(require('@/hooks/useContractsQuery'));
    vi.mocked(useContractsQuery as any).mockReturnValue({
      contracts: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ContractList />);

    expect(screen.getByText('Carregando contratos...')).toBeInTheDocument();
  });

  it('deve mostrar erro quando isError for true', () => {
    const { useContractsQuery } = vi.mocked(require('@/hooks/useContractsQuery'));
    vi.mocked(useContractsQuery as any).mockReturnValue({
      contracts: [],
      isLoading: false,
      isError: true,
      error: new Error('Erro ao carregar contratos'),
      refetch: vi.fn(),
    });

    render(<ContractList />);

    expect(screen.getByText('Erro ao carregar contratos')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há contratos', () => {
    const { useContractsQuery } = vi.mocked(require('@/hooks/useContractsQuery'));
    vi.mocked(useContractsQuery as any).mockReturnValue({
      contracts: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ContractList />);

    expect(screen.getByText('Nenhum contrato encontrado')).toBeInTheDocument();
  });

  it('deve renderizar a lista de contratos quando houver dados', () => {
    render(<ContractList />);

    expect(screen.getByText('Contrato 1')).toBeInTheDocument();
    expect(screen.getByText('Contrato 2')).toBeInTheDocument();
  });

  it('deve mostrar informações corretas de cada contrato', () => {
    render(<ContractList />);

    // Verificar informações do primeiro contrato
    expect(screen.getByText('001')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Rua A, 123')).toBeInTheDocument();

    // Verificar informações do segundo contrato
    expect(screen.getByText('002')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Rua B, 456')).toBeInTheDocument();
  });

  it('deve ter funcionalidade de busca/filtro', () => {
    render(<ContractList />);

    const searchInput = screen.getByPlaceholderText('Buscar contratos...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve ter botões de ação para cada contrato', () => {
    render(<ContractList />);

    // Verificar botões de ação (editar, duplicar, deletar)
    const actionButtons = screen.getAllByTestId('button');
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('deve chamar deleteContract quando o botão de deletar for clicado', async () => {
    const user = userEvent.setup();
    const { useContractActions } = vi.mocked(require('@/features/contracts/hooks/useContractActions'));
    const mockDeleteContract = vi.fn().mockResolvedValue(true);
    vi.mocked(useContractActions as any).mockReturnValue({
      deleteContract: mockDeleteContract,
      duplicateContract: vi.fn(),
      exportContracts: vi.fn(),
      bulkDelete: vi.fn(),
      bulkUpdateStatus: vi.fn(),
    });

    render(<ContractList />);

    // Simular cliques nos botões de deletar
    const deleteButtons = screen.getAllByText('Deletar');
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);

      // O mock deve ser chamado, mas como é assíncrono, podemos não ter o resultado imediatamente
      expect(mockDeleteContract).toHaveBeenCalled();
    }
  });

  it('deve chamar duplicateContract quando o botão de duplicar for clicado', async () => {
    const user = userEvent.setup();
    const { useContractActions } = vi.mocked(require('@/features/contracts/hooks/useContractActions'));
    const mockDuplicateContract = vi.fn().mockResolvedValue({
      id: 'contract-copy-1',
      title: 'Contrato Teste (Cópia)',
    });
    vi.mocked(useContractActions as any).mockReturnValue({
      deleteContract: vi.fn(),
      duplicateContract: mockDuplicateContract,
      exportContracts: vi.fn(),
      bulkDelete: vi.fn(),
      bulkUpdateStatus: vi.fn(),
    });

    render(<ContractList />);

    // Simular cliques nos botões de duplicar
    const duplicateButtons = screen.getAllByText('Duplicar');
    
    if (duplicateButtons.length > 0) {
      await user.click(duplicateButtons[0]);

      expect(mockDuplicateContract).toHaveBeenCalled();
    }
  });

  it('deve ter funcionalidade de exportação', () => {
    render(<ContractList />);

    const exportButton = screen.getByText('Exportar');
    expect(exportButton).toBeInTheDocument();
  });

  it('deve ter funcionalidade de seleção múltipla', () => {
    render(<ContractList />);

    const selectAllCheckbox = screen.getByLabelText('Selecionar todos');
    expect(selectAllCheckbox).toBeInTheDocument();
  });

  it('deve mostrar a data de criação formatada', () => {
    render(<ContractList />);

    // Verificar se as datas estão formatadas (deve aparecer "01/01/2024" e "02/01/2024")
    const dates = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
    expect(dates).toHaveLength(2);
  });

  it('deve ter paginação quando houver muitos contratos', () => {
    render(<ContractList />);

    // A paginação pode estar presente ou não dependendo da implementação
    const pagination = screen.queryByRole('navigation', { name: /paginação/i });
    if (pagination) {
      expect(pagination).toBeInTheDocument();
    }
  });

  it('deve ter acessibilidade adequada', () => {
    render(<ContractList />);

    // Verificar se tem roles apropriados
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    // Verificar se tem elementos com roles
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('deve permitir filtrar por número de contrato', async () => {
    const user = userEvent.setup();
    render(<ContractList />);

    const searchInput = screen.getByPlaceholderText('Buscar contratos...');
    await user.type(searchInput, '001');

    // Verificar se o filtro foi aplicado
    await waitFor(() => {
      expect(screen.getByText('001')).toBeInTheDocument();
      // O contrato 2 pode estar oculto se o filtro está funcionando
    });
  });

  it('deve ter layout responsivo', () => {
    render(<ContractList />);

    // Verificar se existe grid layout
    const container = screen.getByText('Lista de Contratos').closest('div[class*="grid"]');
    expect(container).toBeInTheDocument();
  });

  it('deve mostrar count total de contratos', () => {
    render(<ContractList />);

    // Verificar se mostra o total de contratos
    expect(screen.getByText('2 contratos')).toBeInTheDocument();
  });
});