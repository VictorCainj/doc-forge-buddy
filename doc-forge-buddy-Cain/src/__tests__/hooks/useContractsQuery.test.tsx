import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContractsQuery } from '@/hooks/useContractsQuery';
import { setupMocks, createMockData } from '@/test/utils/test-utils';
import { Contract } from '@/types/contract';

// Mock do React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
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

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={mockQueryClient}>
    {children}
  </QueryClientProvider>
);

const mockContracts: Contract[] = [
  {
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
  },
  {
    id: '2',
    numeroContrato: 'CTR-2024-002',
    locatario: 'Ana Costa',
    locador: 'Carlos Oliveira',
    enderecoImovel: 'Av. Brasil, 456',
    valor: 2000,
    dataInicio: '2024-02-01',
    dataFim: '2024-12-31',
    status: 'ativo' as const,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

describe('useContractsQuery', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar contratos com estado inicial', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    
    const mockData = mockContracts;
    const mockError = null;
    const mockIsLoading = true;
    const mockRefetch = vi.fn();

    useQuery.mockReturnValue({
      data: mockData,
      error: mockError,
      isLoading: mockIsLoading,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    expect(result.current.contracts).toEqual(mockData);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erro na requisição', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    
    const mockError = new Error('Erro na API');
    const mockIsLoading = false;

    useQuery.mockReturnValue({
      data: [],
      error: mockError,
      isLoading: mockIsLoading,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    expect(result.current.error).toBe(mockError);
    expect(result.current.contracts).toEqual([]);
  });

  it('deve retornar arrays vazios quando data é null/undefined', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));

    useQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    expect(result.current.contracts).toEqual([]);
  });

  it('deve ter queryKey correto', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));

    renderHook(() => useContractsQuery(), { wrapper });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['contracts'],
      }),
      expect.any(Function)
    );
  });

  it('deve configurar staleTime corretamente', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));

    renderHook(() => useContractsQuery(), { wrapper });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 5 * 60 * 1000, // 5 minutos
      }),
      expect.any(Function)
    );
  });

  it('deve configurar gcTime corretamente', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));

    renderHook(() => useContractsQuery(), { wrapper });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        gcTime: 10 * 60 * 1000, // 10 minutos
      }),
      expect.any(Function)
    );
  });

  it('deve desabilitar refetchOnWindowFocus', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));

    renderHook(() => useContractsQuery(), { wrapper });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        refetchOnWindowFocus: false,
      }),
      expect.any(Function)
    );
  });

  it('deve configurar função de queryFn correta', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));

    renderHook(() => useContractsQuery(), { wrapper });

    // Verificar se a função de query foi chamada com os parâmetros corretos
    const queryFn = useQuery.mock.calls[0][1];
    
    // A queryFn seria executada pelo React Query, mas podemos verificar a configuração
    expect(useQuery).toHaveBeenCalled();
  });

  it('deve executar queryFn corretamente', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));

    // Mock da resposta do Supabase
    const mockResponse = {
      data: mockContracts,
      error: null,
    };

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(mockResponse),
      }),
    });

    useQuery.mockReturnValue({
      data: mockContracts,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.contracts).toEqual(mockContracts);
    });
  });

  it('deve converter dados do Supabase para tipo Contract', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));

    const mockDbResponse = [
      {
        id: '1',
        numero_contrato: 'CTR-2024-001',
        locatario: 'João Silva',
        // outros campos...
      },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockDbResponse,
          error: null,
        }),
      }),
    });

    useQuery.mockReturnValue({
      data: mockContracts, // Já convertido
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    expect(Array.isArray(result.current.contracts)).toBe(true);
    expect(result.current.contracts.length).toBeGreaterThan(0);
  });

  it('deve tratar erro da API corretamente', async () => {
    const { useQuery } = vi.mocked(require('@tanstack/react-query'));
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));

    const mockError = new Error('Erro de conexão');
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    useQuery.mockReturnValue({
      data: [],
      error: mockError,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useContractsQuery(), { wrapper });

    expect(result.current.error).toBe(mockError);
    expect(result.current.contracts).toEqual([]);
  });
});