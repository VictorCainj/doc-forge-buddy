import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractCard } from '@/components/cards/ContractCard';
import { render, setupMocks, setupUIMocks, createMockData } from '@/test/utils/test-utils';
import { Contract, DocumentType } from '@/types/contract';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockData.user(),
    loading: false,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

vi.mock('@/utils/iconMapper', () => ({
  MoreVertical: () => <div data-testid="icon-more-vertical">MoreVertical</div>,
  Trash2: () => <div data-testid="icon-trash-2">Trash2</div>,
  FileTextColored: () => <div data-testid="icon-file-text-colored">FileTextColored</div>,
  CalendarColored: () => <div data-testid="icon-calendar-colored">CalendarColored</div>,
  UserColored: () => <div data-testid="icon-user-colored">UserColored</div>,
  User2Colored: () => <div data-testid="icon-user2-colored">User2Colored</div>,
  MapPinColored: () => <div data-testid="icon-map-pin-colored">MapPinColored</div>,
  EditColored: () => <div data-testid="icon-edit-colored">EditColored</div>,
  SearchCheckColored: () => <div data-testid="icon-search-check-colored">SearchCheckColored</div>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockContract: Contract = {
  id: '1',
  numeroContrato: 'CTR-2024-001',
  locatario: 'João Silva',
  locador: 'Maria Santos',
  enderecoImovel: 'Rua das Flores, 123',
  valor: 1500,
  dataInicio: '2024-01-01',
  dataFim: '2024-12-31',
  status: 'ativo' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ContractCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnGenerateDocument = vi.fn();
  const mockOnGenerateAgendamento = vi.fn();
  const mockOnGenerateWhatsApp = vi.fn();

  it('deve renderizar o card com informações do contrato', () => {
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    expect(screen.getByText('CTR-2024-001')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
  });

  it('deve mostrar o status ativo do contrato', () => {
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('deve abrir menu dropdown ao clicar no botão de ações', async () => {
    const user = userEvent.setup();
    
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    const moreButton = screen.getByLabelText('Mais opções');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });
  });

  it('deve chamar onEdit ao clicar em editar', async () => {
    const user = userEvent.setup();
    
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    const moreButton = screen.getByLabelText('Mais opções');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Editar');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockContract);
  });

  it('deve chamar onDelete ao clicar em excluir', async () => {
    const user = userEvent.setup();
    
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    const moreButton = screen.getByLabelText('Mais opções');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Excluir');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockContract.id);
  });

  it('deve chamar onGenerateDocument ao clicar em gerar documento', async () => {
    const user = userEvent.setup();
    
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    const moreButton = screen.getByLabelText('Mais opções');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    const generateDocButton = screen.getByText('Gerar Documento');
    await user.click(generateDocButton);

    expect(mockOnGenerateDocument).toHaveBeenCalledWith(
      mockContract,
      'termo_recusa' as DocumentType
    );
  });

  it('deve mostrar estado de loading durante geração de documento', () => {
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
        isGenerating={true}
        generatingDocument="termo_recusa"
      />
    );

    const loadingElement = screen.getByText('Gerando documento...');
    expect(loadingElement).toBeInTheDocument();
  });

  it('deve mostrar botão disabled durante loading', () => {
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
        isGenerating={true}
        generatingDocument="termo_recusa"
      />
    );

    const actionButton = screen.getByText('Gerar Documento');
    expect(actionButton).toBeDisabled();
  });

  it('deve mostrar todos os campos do contrato corretamente', () => {
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    // Verificar se todos os elementos estão presentes
    expect(screen.getByTestId('icon-file-text-colored')).toBeInTheDocument();
    expect(screen.getByTestId('icon-calendar-colored')).toBeInTheDocument();
    expect(screen.getByTestId('icon-user-colored')).toBeInTheDocument();
    expect(screen.getByTestId('icon-user2-colored')).toBeInTheDocument();
    expect(screen.getByTestId('icon-map-pin-colored')).toBeInTheDocument();
  });

  it('deve aplicar memoização corretamente', () => {
    const ContractCardMemoized = ContractCard;
    
    // O componente deve ser memoizado
    expect(ContractCardMemoized.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('deve mostrar mensagem quando contrato tem análise disponível', async () => {
    // Mock que retorna que existe análise
    vi.mocked(require('@/integrations/supabase/client').supabase)
      .from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ 
              data: { id: 'analise-1' }, 
              error: null 
            }),
          }),
        }),
      });

    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ver Análise')).toBeInTheDocument();
    });
  });

  it('deve navegar para detalhes do contrato ao clicar no card', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom')).useNavigate.mockReturnValue(mockNavigate);
    
    render(
      <ContractCard
        contract={mockContract}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onGenerateDocument={mockOnGenerateDocument}
        onGenerateAgendamento={mockOnGenerateAgendamento}
        onGenerateWhatsApp={mockOnGenerateWhatsApp}
      />
    );

    const card = screen.getByTestId('card');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/editar-contrato/1');
  });
});