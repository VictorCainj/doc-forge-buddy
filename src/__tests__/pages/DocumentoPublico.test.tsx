/**
 * Testes para componente DocumentoPublico
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DocumentoPublico from '@/pages/DocumentoPublico';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock dos utilitários de segurança
vi.mock('@/utils/securityValidators', () => ({
  validateHTML: vi.fn((html) => html),
}));

// Mock do html2pdf
vi.mock('html2pdf.js', () => ({
  default: vi.fn(() => ({
    set: vi.fn(() => ({
      from: vi.fn(() => ({
        save: vi.fn(),
      })),
    })),
  })),
}));

// Mock do docx
vi.mock('docx', () => ({
  Document: vi.fn(() => ({})),
  Packer: {
    toBuffer: vi.fn().mockResolvedValue({
      buffer: new ArrayBuffer(8),
    }),
  },
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DocumentoPublico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve mostrar skeleton loading inicialmente', () => {
    renderWithRouter(<DocumentoPublico />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText('Carregando documento')).toBeInTheDocument();
  });

  it('deve mostrar erro 404 quando documento não encontrado', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('Documento não encontrado')).toBeInTheDocument();
    });

    expect(screen.getByText('📄')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Verifique se o link está correto ou entre em contato com o suporte.'
      )
    ).toBeInTheDocument();
  });

  it('deve mostrar erro 403 quando sem permissão', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    });

    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(
      screen.getByText('Você não tem permissão para acessar este documento')
    ).toBeInTheDocument();
  });

  it('deve mostrar erro de rede quando conexão falha', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase
      .from()
      .select()
      .eq()
      .single.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
    });

    expect(screen.getByText('🌐')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      )
    ).toBeInTheDocument();
  });

  it('deve renderizar documento com sucesso', async () => {
    const mockDocument = {
      html_content: '<h1>Teste Documento</h1><p>Conteúdo do documento</p>',
      title: 'Documento de Teste',
    };

    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase.from().select().eq().single.mockResolvedValue({
      data: mockDocument,
      error: null,
    });

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('Documento de Teste')).toBeInTheDocument();
    });

    expect(screen.getByText('Teste Documento')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do documento')).toBeInTheDocument();
  });

  it('deve ter botões de download PDF e DOCX', async () => {
    const mockDocument = {
      html_content: '<h1>Teste Documento</h1>',
      title: 'Documento de Teste',
    };

    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase.from().select().eq().single.mockResolvedValue({
      data: mockDocument,
      error: null,
    });

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('DOCX')).toBeInTheDocument();
    });
  });

  it('deve ter header sticky com título do documento', async () => {
    const mockDocument = {
      html_content: '<h1>Teste Documento</h1>',
      title: 'Documento de Teste',
    };

    const mockSupabase = await import('@/integrations/supabase/client');
    mockSupabase.supabase.from().select().eq().single.mockResolvedValue({
      data: mockDocument,
      error: null,
    });

    renderWithRouter(<DocumentoPublico />);

    await waitFor(() => {
      expect(screen.getByText('Documento de Teste')).toBeInTheDocument();
    });

    // Verificar se o header tem as classes sticky
    const header = screen.getByText('Documento de Teste').closest('div');
    expect(header).toHaveClass('sticky');
  });
});
