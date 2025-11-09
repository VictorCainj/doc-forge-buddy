import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CentralInput from '@/components/form/CentralInput';
import { render, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

// Mock das dependências
vi.mock('@/utils/core/inputValidation', () => ({
  validateEmail: vi.fn(),
  validatePhone: vi.fn(),
  validateCPF: vi.fn(),
  validateCNPJ: vi.fn(),
  formatCPF: vi.fn((value) => value),
  formatCNPJ: vi.fn((value) => value),
  formatPhone: vi.fn((value) => value),
  sanitizeInput: vi.fn((value) => value),
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

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label data-testid="label" htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CentralInput', () => {
  it('deve renderizar o input básico', () => {
    render(<CentralInput name="test" label="Test Input" />);

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('deve renderizar com valor inicial', () => {
    render(<CentralInput name="test" label="Test Input" value="valor inicial" />);

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input.value).toBe('valor inicial');
  });

  it('deve renderizar como textarea quando multiline for true', () => {
    render(<CentralInput name="test" label="Test Input" multiline />);

    const textarea = screen.getByLabelText('Test Input') as HTMLTextAreaElement;
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('deve renderizar como input quando multiline for false', () => {
    render(<CentralInput name="test" label="Test Input" multiline={false} />);

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
  });

  it('deve disparar onChange quando o valor mudar', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CentralInput
        name="test"
        label="Test Input"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'novo valor');

    expect(handleChange).toHaveBeenCalled();
  });

  it('deve disparar onBlur quando o input perder foco', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(
      <CentralInput
        name="test"
        label="Test Input"
        onBlur={handleBlur}
      />
    );

    const input = screen.getByLabelText('Test Input');
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('deve mostrar erro quando validation for fails', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        validation={false}
        errorMessage="Erro de validação"
      />
    );

    expect(screen.getByText('Erro de validação')).toBeInTheDocument();
  });

  it('deve não mostrar erro quando validation for true', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        validation={true}
        errorMessage="Erro de validação"
      />
    );

    expect(screen.queryByText('Erro de validação')).not.toBeInTheDocument();
  });

  it('deve ser disabled quando disabled for true', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        disabled
      />
    );

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('deve ser required quando required for true', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        required
      />
    );

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input).toBeRequired();
  });

  it('deve ter placeholder quando especificado', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        placeholder="Digite aqui..."
      />
    );

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input.placeholder).toBe('Digite aqui...');
  });

  it('deve ter className customizado', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        className="custom-class"
      />
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });

  it('deve ter type correto para input', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        type="email"
      />
    );

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('deve ter autocomplete correto', () => {
    render(
      <CentralInput
        name="email"
        label="Email"
        autoComplete="email"
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.autocomplete).toBe('email');
  });

  it('deve aplicar formatação de telefone automaticamente', async () => {
    const user = userEvent.setup();
    const { formatPhone } = vi.mocked(require('@/utils/core/inputValidation'));
    formatPhone.mockReturnValue('(11) 99999-9999');

    render(
      <CentralInput
        name="phone"
        label="Telefone"
        type="tel"
        autoFormat="phone"
      />
    );

    const input = screen.getByLabelText('Telefone');
    await user.type(input, '11999999999');

    // Verificar se a formatação foi aplicada
    await waitFor(() => {
      expect(input).toHaveValue('(11) 99999-9999');
    });
  });

  it('deve aplicar formatação de CPF automaticamente', async () => {
    const user = userEvent.setup();
    const { formatCPF } = vi.mocked(require('@/utils/core/inputValidation'));
    formatCPF.mockReturnValue('123.456.789-09');

    render(
      <CentralInput
        name="cpf"
        label="CPF"
        autoFormat="cpf"
      />
    );

    const input = screen.getByLabelText('CPF');
    await user.type(input, '12345678909');

    // Verificar se a formatação foi aplicada
    await waitFor(() => {
      expect(input).toHaveValue('123.456.789-09');
    });
  });

  it('deve sanatizar input quando sanitize for true', async () => {
    const user = userEvent.setup();
    const { sanitizeInput } = vi.mocked(require('@/utils/core/inputValidation'));
    sanitizeInput.mockReturnValue('valor sanitizado');

    render(
      <CentralInput
        name="test"
        label="Test Input"
        sanitize
      />
    );

    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'valor com espacos   extras');

    // Verificar se foi sanatizado
    expect(sanitizeInput).toHaveBeenCalled();
  });

  it('deve validar email automaticamente', async () => {
    const user = userEvent.setup();
    const { validateEmail } = vi.mocked(require('@/utils/core/inputValidation'));
    validateEmail.mockReturnValue(false);

    render(
      <CentralInput
        name="email"
        label="Email"
        type="email"
        autoValidate="email"
      />
    );

    const input = screen.getByLabelText('Email');
    await user.type(input, 'email-invalido');

    // Verificar se a validação foi chamada
    await waitFor(() => {
      expect(validateEmail).toHaveBeenCalledWith('email-invalido');
    });
  });

  it('deve renderizar ícone quando especificado', () => {
    const TestIcon = () => <div data-testid="test-icon">TestIcon</div>;

    render(
      <CentralInput
        name="test"
        label="Test Input"
        icon={<TestIcon />}
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('deve renderizar sufixo quando especificado', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        suffix="kg"
      />
    );

    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('deve renderizar prefixo quando especificado', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        prefix="R$"
      />
    );

    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('deve ter máximo de caracteres quando maxLength for especificado', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        maxLength={100}
      />
    );

    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    expect(input.maxLength).toBe(100);
  });

  it('deve ter rows específico para textarea', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        multiline
        rows={10}
      />
    );

    const textarea = screen.getByLabelText('Test Input') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(10);
  });

  it('deve usar rows padrão quando não especificado para textarea', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        multiline
      />
    );

    const textarea = screen.getByLabelText('Test Input') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4); // valor padrão
  });

  it('deve ter label com id correto para acessibilidade', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        id="test-input"
      />
    );

    const label = screen.getByTestId('label');
    const input = screen.getByLabelText('Test Input');

    expect(label).toHaveAttribute('for', 'test-input');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('deve ter role de input quando for textarea', () => {
    render(
      <CentralInput
        name="test"
        label="Test Input"
        multiline
      />
    );

    const textarea = screen.getByLabelText('Test Input');
    expect(textarea).toHaveAttribute('role', 'textbox');
  });

  it('deve ter aria-label quando não há label', () => {
    render(
      <CentralInput
        name="test"
        ariaLabel="Input sem label"
      />
    );

    const input = screen.getByLabelText('Input sem label');
    expect(input).toBeInTheDocument();
  });
});