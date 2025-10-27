import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useDocumentGeneration } from '@/hooks/useDocumentGeneration';
import { Contract } from '@/types/contract';
import * as TemplateProcessor from '@/utils/templateProcessor';

// Mock do react-router-dom
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock do TemplateProcessor
vi.mock('@/utils/templateProcessor', () => ({
  TemplateProcessor: {
    processTemplate: vi.fn((template, data) => {
      // Simular substituição de variáveis
      let processed = template;
      Object.entries(data).forEach(([key, value]) => {
        processed = processed.replace(
          new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'),
          String(value)
        );
      });
      return processed;
    }),
  },
}));

// Mock do DateHelpers
vi.mock('@/utils/dateHelpers', () => ({
  DateHelpers: {
    getCurrentDateBrazilian: vi.fn(() => '01/01/2024'),
  },
}));

// Mock do splitNames
vi.mock('@/utils/nameHelpers', () => ({
  splitNames: vi.fn((names: string) => names.split(/ e |, /).filter(Boolean)),
}));

describe('useDocumentGeneration', () => {
  const mockContract: Contract = {
    id: '123',
    document_type: 'termo_locatario',
    form_data: {
      primeiroLocatario: 'João Silva',
      nomeProprietario: 'Maria Santos',
      endereco: 'Rua das Flores, 123',
      qualificacaoCompletaLocatarios: 'Engenheiro',
      qualificacaoCompletaLocadores: 'Arquiteta',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateMesesComprovantes', () => {
    it('deve gerar meses dos comprovantes corretamente', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const meses = result.current.generateMesesComprovantes();

      expect(meses).toContain(', ');
      expect(meses).toContain(' de ');
      expect(meses.split(', ')).toHaveLength(3);
    });
  });

  describe('getLocatarioQualificacao', () => {
    it('deve retornar qualificação do locatário', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const qualificacao = result.current.getLocatarioQualificacao(
        mockContract.form_data
      );

      expect(qualificacao).toBe('Engenheiro');
    });

    it('deve retornar valor padrão quando não há qualificação', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const qualificacao = result.current.getLocatarioQualificacao({});

      expect(qualificacao).toBe('[TEXTOLIVRE]');
    });
  });

  describe('getProprietarioQualificacao', () => {
    it('deve retornar qualificação do proprietário', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const qualificacao = result.current.getProprietarioQualificacao(
        mockContract.form_data
      );

      expect(qualificacao).toBe('Arquiteta');
    });
  });

  describe('isMultipleLocatarios', () => {
    it('deve detectar múltiplos locatários com vírgula', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleLocatarios('João, Maria')).toBe(true);
    });

    it('deve detectar múltiplos locatários com "e"', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleLocatarios('João e Maria')).toBe(true);
    });

    it('deve retornar false para nome único', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleLocatarios('João Silva')).toBe(false);
    });
  });

  describe('isMultipleProprietarios', () => {
    it('deve detectar múltiplos proprietários com vírgula', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleProprietarios('João, Maria')).toBe(true);
    });

    it('deve detectar múltiplos proprietários com "E"', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleProprietarios('João E Maria')).toBe(true);
    });

    it('deve retornar false para nome único', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      expect(result.current.isMultipleProprietarios('João Silva')).toBe(false);
    });
  });

  describe('applyConjunctions', () => {
    it('deve aplicar conjunções para locatário único masculino', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const formData = {
        primeiroLocatario: 'João Silva',
        generoLocatario: 'masculino',
      };

      const enhanced = result.current.applyConjunctions(formData as any);

      expect(enhanced.locatarioTerm).toBe('LOCATÁRIO');
      expect(enhanced.locatarioTermComercial).toBe('locatário');
      expect(enhanced.locatarioPrezado).toBe('Prezado');
    });

    it('deve aplicar conjunções para locatária única feminino', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const formData = {
        primeiroLocatario: 'Maria Silva',
        generoLocatario: 'feminino',
      };

      const enhanced = result.current.applyConjunctions(formData as any);

      expect(enhanced.locatarioTerm).toBe('LOCATÁRIA');
      expect(enhanced.locatarioTermComercial).toBe('locatária');
      expect(enhanced.locatarioPrezado).toBe('Prezada');
    });

    it('deve aplicar conjunções para múltiplos locatários', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const formData = {
        primeiroLocatario: 'João Silva',
        segundoLocatario: 'Maria Santos',
      };

      const enhanced = result.current.applyConjunctions(formData as any);

      expect(enhanced.locatarioTerm).toBe('LOCATÁRIOS');
      expect(enhanced.locatarioTermComercial).toBe('locatários');
    });

    it('deve processar fiadores', () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const formData = {
        temFiador: 'sim',
        primeiroFiador: 'Fiador 1',
        segundoFiador: 'Fiador 2',
      };

      const enhanced = result.current.applyConjunctions(formData as any);

      expect(enhanced.fiador1).toBe('Fiador 1');
      expect(enhanced.fiador2).toBe('Fiador 2');
    });
  });

  describe('generateDocumentWithAssinante', () => {
    it('deve navegar com template processado', async () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      result.current.generateDocumentWithAssinante(
        mockContract,
        'Template com [PRIMEIROLOCATARIO]',
        'Termo de Locatário',
        'João Silva'
      );

      // Aguardar setTimeout
      vi.advanceTimersByTime(800);

      expect(navigateMock).toHaveBeenCalledWith('/gerar-documento', {
        state: expect.objectContaining({
          title: 'Termo de Locatário',
          documentType: 'Termo de Locatário',
        }),
      });
    });

    it('deve processar template corretamente', async () => {
      const { result } = renderHook(() => useDocumentGeneration(), {
        wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      });

      const template = 'O [PRIMEIROLOCATARIO] concorda em [ENDERECOIMOVEL].';
      const contract = {
        ...mockContract,
        form_data: {
          ...mockContract.form_data,
          primeiroLocatario: 'João',
          endereco: 'Rua X',
        },
      };

      result.current.generateDocumentWithAssinante(
        contract,
        template,
        'Documento',
        'João'
      );

      vi.advanceTimersByTime(800);

      expect(
        TemplateProcessor.TemplateProcessor.processTemplate
      ).toHaveBeenCalled();
    });
  });
});
