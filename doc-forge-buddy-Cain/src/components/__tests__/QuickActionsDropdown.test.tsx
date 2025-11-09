import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { render, createMockUser, createMockContract, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
    loading: false,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: { id: 'contract-1', form_data: { numeroContrato: 'TEST-001' } }, error: null }),
        })),
      })),
    })),
  },
}));

vi.mock('@/utils/iconMapper', () => ({
  ChevronRight: () => <div data-testid="icon-chevron-right">ChevronRight</div>,
  User: () => <div data-testid="icon-user">User</div>,
  Home: () => <div data-testid="icon-home">Home</div>,
  Mail: () => <div data-testid="icon-mail">Mail</div>,
  MessageSquare: () => <div data-testid="icon-message-square">MessageSquare</div>,
  Settings: () => <div data-testid="icon-settings">Settings</div>,
  Sparkles: () => <div data-testid="icon-sparkles">Sparkles</div>,
  MoreVertical: () => <div data-testid="icon-more-vertical">MoreVertical</div>,
  NotebookPen: () => <div data-testid="icon-notebook-pen">NotebookPen</div>,
  AlertTriangle: () => <div data-testid="icon-alert-triangle">AlertTriangle</div>,
  Phone: () => <div data-testid="icon-phone">Phone</div>,
  Building: () => <div data-testid="icon-building">Building</div>,
  Calendar: () => <div data-testid="icon-calendar">Calendar</div>,
  Briefcase: () => <div data-testid="icon-briefcase">Briefcase</div>,
  SearchCheck: () => <div data-testid="icon-search-check">SearchCheck</div>,
  Plus: () => <div data-testid="icon-plus">Plus</div>,
  X: () => <div data-testid="icon-x">X</div>,
  FileText: () => <div data-testid="icon-file-text">FileText</div>,
}));

vi.mock('@/templates/documentos', () => ({
  DEVOLUTIVA_PROPRIETARIO_TEMPLATE: 'DEVOLUTIVA_PROPRIETARIO_TEMPLATE',
  DEVOLUTIVA_LOCATARIO_TEMPLATE: 'DEVOLUTIVA_LOCATARIO_TEMPLATE',
  NOTIFICACAO_AGENDAMENTO_TEMPLATE: 'NOTIFICACAO_AGENDAMENTO_TEMPLATE',
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE: 'DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE',
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE: 'DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE',
  DEVOLUTIVA_COMERCIAL_TEMPLATE: 'DEVOLUTIVA_COMERCIAL_TEMPLATE',
  DEVOLUTIVA_CADERNINHO_TEMPLATE: 'DEVOLUTIVA_CADERNINHO_TEMPLATE',
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE: 'DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE',
  TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE: 'TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE',
  TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE: 'TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE',
  STATUS_VISTORIA_WHATSAPP_TEMPLATE: 'STATUS_VISTORIA_WHATSAPP_TEMPLATE',
}));

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('QuickActionsDropdown', () => {
  const mockOnGenerateDocument = vi.fn();

  it('deve renderizar o botão trigger corretamente', () => {
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    expect(triggerButton).toBeInTheDocument();
    expect(triggerButton).toHaveClass('group');
  });

  it('deve abrir o modal quando o botão trigger for clicado', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('deve mostrar o header do modal com título e ícone', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        contractNumber="TEST-001"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar header
    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    expect(screen.getByText('Contrato TEST-001')).toBeInTheDocument();
    expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
  });

  it('deve mostrar as seções organizadas corretamente', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar se as seções estão presentes
    expect(screen.getByText('Comunicação')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Processos')).toBeInTheDocument();
  });

  it('deve mostrar as ações da seção de Comunicação', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar ações de comunicação
    expect(screen.getByText('Devolutiva E-mail (Locador)')).toBeInTheDocument();
    expect(screen.getByText('Devolutiva E-mail (Locatário)')).toBeInTheDocument();
    expect(screen.getByText('Notificação de Agendamento')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp - Proprietária')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp - Comercial')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp - Locatária')).toBeInTheDocument();
    expect(screen.getByText('Status Vistoria')).toBeInTheDocument();
    expect(screen.getByText('Cobrança de Consumo')).toBeInTheDocument();
  });

  it('deve mostrar as ações da seção de Documentos', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar ações de documentos
    expect(screen.getByText('Caderninho')).toBeInTheDocument();
    expect(screen.getByText('Termo de Recusa - E-mail')).toBeInTheDocument();
    expect(screen.getByText('Termo de Recusa - PDF')).toBeInTheDocument();
  });

  it('deve mostrar as ações da seção de Processos', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar ações de processos
    expect(screen.getByText('Recebimento de Chaves (Locador)')).toBeInTheDocument();
    expect(screen.getByText('Recebimento de Chaves (Locatário)')).toBeInTheDocument();
    expect(screen.getByText('Criar Análise')).toBeInTheDocument();
    expect(screen.getByText('Configurações Avançadas')).toBeInTheDocument();
  });

  it('deve chamar onGenerateDocument quando uma ação de e-mail for clicada', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Clicar na ação de e-mail do locador
    const emailLocadorButton = screen.getByText('Devolutiva E-mail (Locador)');
    await user.click(emailLocadorButton);

    await waitFor(() => {
      expect(mockOnGenerateDocument).toHaveBeenCalledWith(
        'contract-1',
        'DEVOLUTIVA_PROPRIETARIO_TEMPLATE',
        'Notificação de Desocupação e Agendamento de Vistoria'
      );
    });
  });

  it('deve fechar o modal após uma ação ser executada', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Clicar em uma ação que fecha o modal
    const emailLocadorButton = screen.getByText('Devolutiva E-mail (Locador)');
    await user.click(emailLocadorButton);

    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  it('deve mostrar loading state durante a execução de uma ação', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockGenerateDocument = vi.fn().mockImplementation(() => 
      new Promise(resolve => {
        resolvePromise = resolve;
        setTimeout(() => {}, 1000);
      })
    );

    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Clicar na ação
    const emailLocadorButton = screen.getByText('Devolutiva E-mail (Locador)');
    await user.click(emailLocadorButton);

    // Verificar se o loading state é mostrado (verificar se o botão está disabled)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const clickedButton = buttons.find(btn => btn.textContent?.includes('Devolutiva E-mail (Locador)'));
      expect(clickedButton).toHaveAttribute('disabled');
    });
  });

  it('deve navegar corretamente para termo-locador quando ação for clicada', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom')).useNavigate.mockReturnValue(mockNavigate);

    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Clicar na ação de termo-locador
    const termoLocadorButton = screen.getByText('Recebimento de Chaves (Locador)');
    await user.click(termoLocadorButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/termo-locador', {
        state: { contractData: expect.objectContaining({ numeroContrato: 'TEST-001' }) }
      });
    });
  });

  it('deve mostrar "Carregar Análise" quando já existe uma análise para o contrato', async () => {
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

    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Verificar que mostra "Carregar Análise" em vez de "Criar Análise"
    expect(screen.getByText('Carregar Análise')).toBeInTheDocument();
    expect(screen.queryByText('Criar Análise')).not.toBeInTheDocument();
  });

  it('deve ter aria-label apropriado para acessibilidade', () => {
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    expect(triggerButton).toBeInTheDocument();
  });

  it('deve fechar o modal com ESC', async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsDropdown
        contractId="contract-1"
        onGenerateDocument={mockOnGenerateDocument}
      />
    );

    const triggerButton = screen.getByLabelText('Abrir ações rápidas');
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Pressionar ESC para fechar
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });
});