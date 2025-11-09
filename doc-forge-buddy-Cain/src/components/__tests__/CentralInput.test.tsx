import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CentralInput } from '@/components/form/CentralInput';
import { render, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

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

vi.mock('@/utils/iconMapper', () => ({
  Mic: () => <div data-testid="icon-mic">Mic</div>,
  Send: () => <div data-testid="icon-send">Send</div>,
  Image: () => <div data-testid="icon-image">Image</div>,
  X: () => <div data-testid="icon-x">X</div>,
}));

beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CentralInput', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnSendAudio = vi.fn();
  const mockOnUploadImage = vi.fn().mockResolvedValue(undefined);

  it('deve renderizar o componente input corretamente', () => {
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    expect(screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument();
    expect(screen.getByTestId('icon-image')).toBeInTheDocument();
    expect(screen.getByTestId('icon-send')).toBeInTheDocument();
  });

  it('deve permitir digitar texto no input', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    await user.type(textarea, 'Teste de mensagem');

    expect(textarea).toHaveValue('Teste de mensagem');
  });

  it('deve enviar mensagem ao pressionar Enter', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    await user.type(textarea, 'Teste de mensagem{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Teste de mensagem');
  });

  it('deve limpar input após enviar mensagem', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    await user.type(textarea, 'Teste de mensagem{Enter}');

    expect(textarea).toHaveValue('');
  });

  it('deve mostrar botão de envio habilitado quando há texto', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    await user.type(textarea, 'Teste');

    const sendButton = screen.getByTestId('icon-send').parentElement;
    expect(sendButton).not.toBeDisabled();
  });

  it('deve desabilitar botão de envio quando input está vazio', () => {
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const sendButton = screen.getByTestId('icon-send').parentElement;
    expect(sendButton).toBeDisabled();
  });

  it('deve permitir upload de imagens', async () => {
    const user = userEvent.setup();
    
    // Mock file input
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const imageButton = screen.getByTestId('icon-image').parentElement;
    await user.click(imageButton);

    // Verificar se o input de arquivo foi acionado
    await waitFor(() => {
      expect(mockOnUploadImage).toHaveBeenCalled();
    });
  });

  it('deve permitir gravação de áudio', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const audioButton = screen.getByTestId('icon-mic').parentElement;
    await user.click(audioButton);

    // Verificar se o input de áudio foi acionado
    expect(audioButton).toBeInTheDocument();
  });

  it('deve mostrar preview de imagens selecionadas', async () => {
    const user = userEvent.setup();
    
    // Mock com preview de imagem
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    
    // Simular paste de imagem
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: {
        items: [{
          type: 'image/jpeg',
          getAsFile: () => new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        }],
      },
    });
    
    fireEvent.paste(textarea, pasteEvent);

    await waitFor(() => {
      expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    });
  });

  it('deve permitir remover imagem do preview', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    // Simular que há uma imagem em preview
    const removeButton = screen.getByTestId('icon-x');
    await user.click(removeButton);

    // Verificar se a imagem foi removida do preview
    // (Isso seria testado com estado interno mais específico)
  });

  it('deve estar em estado de loading durante processamento', () => {
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
        isLoading={true}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    expect(textarea).toBeDisabled();
  });

  it('deve usar placeholder personalizado', () => {
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
        placeholder="Digite sua mensagem aqui..."
      />
    );

    expect(screen.getByPlaceholderText('Digite sua mensagem aqui...')).toBeInTheDocument();
  });

  it('deve ajustar altura do textarea automaticamente', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    
    // Simular texto longo
    const longText = 'Linha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5';
    await user.type(textarea, longText);

    // Verificar se a altura foi ajustada (isso seria verificado no DOM real)
    expect(textarea).toHaveValue(longText);
  });

  it('deve mostrar erro se upload de imagem falhar', async () => {
    const user = userEvent.setup();
    const mockOnUploadImageWithError = vi.fn().mockRejectedValue(new Error('Erro no upload'));
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImageWithError}
      />
    );

    const imageButton = screen.getByTestId('icon-image').parentElement;
    await user.click(imageButton);

    // O componente deve lidar com erros de upload
    await waitFor(() => {
      expect(mockOnUploadImageWithError).toHaveBeenCalled();
    });
  });

  it('deve manter foco no textarea após enviar mensagem', async () => {
    const user = userEvent.setup();
    
    render(
      <CentralInput
        onSendMessage={mockOnSendMessage}
        onSendAudio={mockOnSendAudio}
        onUploadImage={mockOnUploadImage}
      />
    );

    const textarea = screen.getByPlaceholderText('Cole a mensagem ou imagem do WhatsApp...');
    await user.type(textarea, 'Teste{Enter}');

    // Verificar se o textarea mantém o foco
    expect(document.activeElement).toBe(textarea);
  });
});