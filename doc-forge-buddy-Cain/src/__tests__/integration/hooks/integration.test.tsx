import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { renderHookWithProviders } from '../utils/test-utils';
import { testDataScenarios } from '../utils/test-data-generators';
import { useAuth } from '@/hooks/useAuth';
import { useContractData } from '@/hooks/useContractData';
import { useDocumentGeneration } from '@/hooks/useDocumentGeneration';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock do React Query
vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    removeQueries: vi.fn(),
    getQueryData: vi.fn(),
  },
}));

describe('Hook API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth Integration', () => {
    it('deve integrar com auth do Supabase corretamente', async () => {
      const mockUser = testDataScenarios.adminUser;
      const mockSession = {
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      // Configurar mocks
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser, ...mockSession } },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser, ...mockSession } },
        error: null,
      });

      // Aguardar inicialização
      await waitFor(() => {});

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      // Verificar estado inicial (loading)
      expect(result.current.loading).toBe(true);

      // Aguardar carregamento
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verificar que usuário foi carregado
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toBeDefined();
    });

    it('deve tratar erro de autenticação', async () => {
      const mockError = { message: 'Invalid credentials' };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Tentar fazer login
      act(() => {
        result.current.signIn('test@example.com', 'wrong-password');
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      expect(result.current.user).toBeNull();
    });

    it('deve fazer logout corretamente', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fazer logout
      act(async () => {
        await result.current.signOut();
      });

      // Verificar se método foi chamado
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('useContractData Integration', () => {
    it('deve carregar dados de contrato com sucesso', async () => {
      const contractId = 'test-contract-123';
      const mockContract = testDataScenarios.successfulContract;

      // Mock da query
      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: mockContract,
        isLoading: false,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContractData(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual(mockContract);
      expect(result.current.isLoading).toBe(false);
    });

    it('deve tratar erro ao carregar contrato', async () => {
      const contractId = 'invalid-id';
      const mockError = new Error('Contract not found');

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        isError: true,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContractData(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeNull();
    });

    it('deve atualizar dados quando contrato muda', async () => {
      let queryKey = ['contract', 'initial'];
      const mockContract1 = { ...testDataScenarios.successfulContract, id: '1' };
      const mockContract2 = { ...testDataScenarios.pendingContract, id: '2' };

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockImplementation((key) => {
        queryKey = key;
        return {
          data: key[1] === '1' ? mockContract1 : mockContract2,
          isLoading: false,
          error: null,
          isError: false,
          refetch: vi.fn(),
        };
      });

      const { result, rerender } = renderHookWithProviders(
        ({ id }: { id: string }) => useContractData(id),
        { queryWrapper: true, initialProps: { id: '1' } }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.id).toBe('1');

      // Re-renderizar com ID diferente
      rerender({ id: '2' });

      await waitFor(() => {
        expect(result.current.data?.id).toBe('2');
      });

      expect(result.current.data).toEqual(mockContract2);
    });
  });

  describe('useDocumentGeneration Integration', () => {
    it('deve iniciar geração de documento com sucesso', async () => {
      const mockDocument = {
        id: 'doc-123',
        type: 'contract',
        content: 'Generated document content',
        status: 'generating',
      };

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockResolvedValue(mockDocument);
      
      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useDocumentGeneration(),
        { queryWrapper: true }
      );

      act(async () => {
        await result.current.mutateAsync({
          type: 'contract',
          templateId: 'template-123',
          data: { contractId: '123' },
        });
      });

      expect(mockMutationFn).toHaveBeenCalledWith({
        type: 'contract',
        templateId: 'template-123',
        data: { contractId: '123' },
      });
    });

    it('deve tratar erro na geração de documento', async () => {
      const mockError = new Error('Template not found');

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockRejectedValue(mockError);
      
      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: true,
        error: mockError,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useDocumentGeneration(),
        { queryWrapper: true }
      );

      await expect(
        result.current.mutateAsync({
          type: 'contract',
          templateId: 'invalid-template',
          data: {},
        })
      ).rejects.toThrow();

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Loading States Integration', () => {
    it('deve gerenciar estados de loading corretamente', async () => {
      const { useOptimizedQuery } = await import('@/hooks/query');
      let isLoading = true;
      
      vi.mocked(useOptimizedQuery).mockImplementation(() => ({
        data: null,
        isLoading,
        error: null,
        isError: false,
        refetch: vi.fn(),
      }));

      const { result } = renderHookWithProviders(
        () => useContractData('test-123'),
        { queryWrapper: true }
      );

      // Estado inicial - loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      // Simular mudança para carregado
      act(() => {
        isLoading = false;
      });

      // Verificar que loading foi removido
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('deve mostrar estado de erro corretamente', async () => {
      const mockError = new Error('Network error');

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockImplementation(() => ({
        data: null,
        isLoading: false,
        error: mockError,
        isError: true,
        refetch: vi.fn(),
      }));

      const { result } = renderHookWithProviders(
        () => useContractData('test-123'),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Optimistic Updates Integration', () => {
    it('deve aplicar optimistic updates corretamente', async () => {
      const initialContract = testDataScenarios.pendingContract;
      const updatedContract = {
        ...initialContract,
        status: 'active' as const,
      };

      const { queryClient } = await import('@/lib/queryClient');
      const { useOptimisticMutation } = await import('@/hooks/query');
      
      const mockMutationFn = vi.fn().mockResolvedValue(updatedContract);
      vi.mocked(useOptimisticMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useDocumentGeneration(),
        { queryWrapper: true }
      );

      // Executar mutação
      act(async () => {
        await result.current.mutateAsync({
          type: 'contract',
          templateId: 'template-123',
          data: { contractId: '123' },
        });
      });

      // Verificar se queryClient foi invalidado
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Integration', () => {
    it('deve permitir retry após erro', async () => {
      let attempt = 0;
      const { useOptimizedQuery } = await import('@/hooks/query');
      
      vi.mocked(useOptimizedQuery).mockImplementation(() => {
        attempt++;
        if (attempt === 1) {
          // Primeira tentativa falha
          return {
            data: null,
            isLoading: false,
            error: new Error('Network error'),
            isError: true,
            refetch: vi.fn().mockImplementation(() => {
              attempt = 2;
              return Promise.resolve();
            }),
          };
        } else {
          // Segunda tentativa succeeds
          return {
            data: testDataScenarios.successfulContract,
            isLoading: false,
            error: null,
            isError: false,
            refetch: vi.fn(),
          };
        }
      });

      const { result } = renderHookWithProviders(
        () => useContractData('test-123'),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Fazer retry
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
        expect(result.current.error).toBeNull();
      });
    });
  });
});