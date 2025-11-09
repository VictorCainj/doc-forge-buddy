import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, renderHookWithProviders } from '../utils/test-utils';
import { validateContractsList, validateApiError, expectValidContractsList } from '../utils/response-validators';
import { generateContract, generateContractsList, testDataScenarios, generateApiError } from '../utils/test-data-generators';

// Importar os hooks que fazem chamadas para as APIs
import { useContracts, useContract, useCreateContract, useUpdateContract, useDeleteContract } from '@/services/contractsService';

describe('API Integration Tests', () => {
  beforeEach(async () => {
    // MSW é configurado automaticamente no setup.ts
    // Aqui podemos configurar dados específicos se necessário
  });

  afterEach(() => {
    // Cleanup entre testes
  });

  describe('Contracts API Integration', () => {
    it('deve buscar lista de contratos com sucesso', async () => {
      const { result } = renderHookWithProviders(
        () => useContracts({ status: 'active', page: 1, limit: 10 }),
        { queryWrapper: true }
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      // Validar estrutura da resposta
      expectValidContractsList(result.current.data);
      expect(result.current.data?.contracts).toHaveLength(2);
      expect(result.current.data?.total).toBe(2);
      expect(result.current.data?.page).toBe(1);
    });

    it('deve buscar contratos com filtros aplicados', async () => {
      const filters = {
        status: 'pending' as const,
        search: 'Maria Santos',
        page: 1,
        limit: 10,
      };

      const { result } = renderHookWithProviders(
        () => useContracts(filters),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expectValidContractsList(result.current.data);
      
      // Verificar filtros - deve encontrar apenas contratos pending
      const pendingContracts = result.current.data?.contracts.filter(
        c => c.status === 'pending'
      );
      expect(pendingContracts?.length).toBeGreaterThan(0);

      // Verificar busca por nome
      const hasSearchedClient = result.current.data?.contracts.some(
        c => c.clientName.includes('Maria Santos')
      );
      expect(hasSearchedClient).toBe(true);
    });

    it('deve buscar contrato específico por ID', async () => {
      const contractId = '1';

      const { result } = renderHookWithProviders(
        () => useContract(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      const contract = result.current.data;
      expect(contract?.id).toBe(contractId);
      expect(contract?.contractNumber).toBe('CON-2024-001');
    });

    it('deve tratar erro 404 para contrato inexistente', async () => {
      const contractId = 'non-existent-id';

      const { result } = renderHookWithProviders(
        () => useContract(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('Contrato não encontrado');
      expect(result.current.data).toBeNull();
    });

    it('deve criar novo contrato', async () => {
      const newContractData = {
        contractNumber: 'CON-2024-TEST',
        clientName: 'Test Client',
        property: 'Test Property, 123',
        status: 'pending' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 1500.00,
        dueDate: '2024-06-30',
      };

      const { useOptimisticMutation } = await import('@/hooks/query');
      const mockMutation = vi.fn().mockResolvedValue({
        id: 'new-contract-id',
        ...newContractData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidValue: 0,
      });

      vi.mocked(useOptimisticMutation).mockReturnValue({
        mutate: mockMutation,
        mutateAsync: mockMutation,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useCreateContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync(newContractData);

      expect(mockMutation).toHaveBeenCalledWith(newContractData);
    });

    it('deve atualizar contrato existente', async () => {
      const contractId = '1';
      const updates = {
        status: 'completed' as const,
        paidValue: 1200.00,
      };

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutation = vi.fn().mockResolvedValue({
        id: contractId,
        ...testDataScenarios.successfulContract,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutation,
        mutateAsync: mockMutation,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useUpdateContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync({ id: contractId, ...updates });

      expect(mockMutation).toHaveBeenCalledWith({ id: contractId, ...updates });
    });

    it('deve deletar contrato', async () => {
      const contractId = '1';

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutation = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutation,
        mutateAsync: mockMutation,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useDeleteContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync(contractId);

      expect(mockMutation).toHaveBeenCalledWith(contractId);
    });
  });

  describe('Auth API Integration', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      
      // Mock do supabase auth
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: testDataScenarios.adminUser,
          session: {
            access_token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          },
        },
        error: null,
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signInResult = await result.current.signIn(
        'admin@example.com',
        'password123'
      );

      expect(signInResult.error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      });
    });

    it('deve tratar erro de login com credenciais inválidas', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Credenciais inválidas' },
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signInResult = await result.current.signIn(
        'invalid@example.com',
        'wrongpassword'
      );

      expect(signInResult.error).toBeDefined();
      expect(signInResult.error.message).toBe('Credenciais inválidas');
    });

    it('deve fazer logout corretamente', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signOutResult = await result.current.signOut();

      expect(signOutResult.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('deve resetar senha', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        error: null,
      });

      const { result } = renderHookWithProviders(
        () => useAuth(),
        { fullWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resetResult = await result.current.resetPassword('test@example.com');

      expect(resetResult.error).toBeNull();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('deve tratar erro de rede', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      try {
        const { result } = renderHookWithProviders(
          () => useContracts(),
          { queryWrapper: true }
        );

        await waitFor(() => {
          expect(result.current.error).toBeDefined();
        });

        expect(result.current.error?.message).toContain('Network Error');
        expect(result.current.data).toBeNull();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('deve tratar erro 500 do servidor', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      try {
        const { result } = renderHookWithProviders(
          () => useContracts(),
          { queryWrapper: true }
        );

        await waitFor(() => {
          expect(result.current.error).toBeDefined();
        });

        expect(result.current.error?.message).toContain('500');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('deve tratar timeout de requisição', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      try {
        const { result } = renderHookWithProviders(
          () => useContract('test-123'),
          { queryWrapper: true }
        );

        await waitFor(() => {
          expect(result.current.error).toBeDefined();
        }, { timeout: 200 });

        expect(result.current.error?.message).toContain('timeout');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Cache Behavior Integration', () => {
    it('deve usar cache em re-renders', async () => {
      let fetchCallCount = 0;
      const originalFetch = global.fetch;
      
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generateContractsList(2)),
        });
      });

      try {
        const { result, rerender } = renderHookWithProviders(
          () => useContracts({ page: 1 }),
          { queryWrapper: true }
        );

        // Primeiro render
        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        expect(fetchCallCount).toBe(1);

        // Re-renderizar - deve usar cache
        rerender();

        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        // Não deve ter chamado fetch novamente
        expect(fetchCallCount).toBe(1);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('deve fazer refetch quando dados são invalidados', async () => {
      let fetchCallCount = 0;
      const originalFetch = global.fetch;
      
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generateContractsList(2)),
        });
      });

      try {
        const { result } = renderHookWithProviders(
          () => useContracts(),
          { queryWrapper: true }
        );

        // Primeiro fetch
        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        expect(fetchCallCount).toBe(1);

        // Invalidar e refetch
        const { queryClient } = await import('@/lib/queryClient');
        queryClient.invalidateQueries({ queryKey: ['contracts'] });

        // Aguardar refetch
        await waitFor(() => {
          expect(fetchCallCount).toBe(2);
        });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Performance Integration', () => {
    it('deve evitar requisições desnecessárias', async () => {
      let fetchCallCount = 0;
      const originalFetch = global.fetch;
      
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generateContractsList(1)),
        });
      });

      try {
        const { result, rerender } = renderHookWithProviders(
          ({ filters }) => useContracts(filters),
          { queryWrapper: true, initialProps: { page: 1 } }
        );

        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        const initialCallCount = fetchCallCount;

        // Re-renderizar com mesmos filtros
        rerender({ page: 1 });

        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        // Não deve ter feito nova requisição
        expect(fetchCallCount).toBe(initialCallCount);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('deve fazer nova requisição quando filtros mudam', async () => {
      let fetchCallCount = 0;
      const originalFetch = global.fetch;
      
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(generateContractsList(1)),
        });
      });

      try {
        const { result, rerender } = renderHookWithProviders(
          ({ filters }) => useContracts(filters),
          { queryWrapper: true, initialProps: { page: 1 } }
        );

        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        const initialCallCount = fetchCallCount;

        // Re-renderizar com filtros diferentes
        rerender({ page: 2, status: 'active' });

        await waitFor(() => {
          expect(result.current.data).toBeDefined();
        });

        // Deve ter feito nova requisição
        expect(fetchCallCount).toBe(initialCallCount + 1);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});