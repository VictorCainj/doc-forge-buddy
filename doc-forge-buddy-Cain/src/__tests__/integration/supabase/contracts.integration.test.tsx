import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, renderHookWithProviders } from '../utils/test-utils';
import { mockSupabase, configureSupabaseResponse } from '../utils/supabase-mocks';
import { testDataScenarios } from '../utils/test-data-generators';
import { useContracts, useContract, useCreateContract, useUpdateContract, useDeleteContract } from '@/services/contractsService';
import { queryClient } from '@/lib/queryClient';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock do React Query
vi.mock('@/hooks/query', () => ({
  useOptimizedQuery: vi.fn(),
  useOptimizedMutation: vi.fn(),
  useOptimisticMutation: vi.fn(),
  usePrefetch: vi.fn(),
  useInvalidateQueries: vi.fn(),
}));

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useContracts Integration', () => {
    it('deve buscar contratos com sucesso', async () => {
      // Configurar mock de resposta
      const mockResponse = {
        contracts: [
          testDataScenarios.successfulContract,
          testDataScenarios.pendingContract,
        ],
        total: 2,
        page: 1,
        hasMore: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      global.fetch = mockFetch;

      // Mock do useOptimizedQuery
      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: mockResponse,
        isLoading: false,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContracts({ status: 'active' }),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.contracts).toHaveLength(2);
    });

    it('deve tratar erro ao buscar contratos', async () => {
      const mockError = new Error('Network Error');
      
      const mockFetch = vi.fn().mockRejectedValue(mockError);
      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        isError: true,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContracts(),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('deve buscar contrato específico com sucesso', async () => {
      const contractId = 'test-contract-123';
      const mockContract = testDataScenarios.successfulContract;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockContract),
      });

      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: mockContract,
        isLoading: false,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContract(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual(mockContract);
    });

    it('deve tratar erro 404 ao buscar contrato inexistente', async () => {
      const contractId = 'non-existent-id';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Erro ao buscar contrato: Not Found'),
        isError: true,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useContract(contractId),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('Not Found');
    });
  });

  describe('Contract Mutations Integration', () => {
    it('deve criar contrato com sucesso', async () => {
      const newContractData = {
        contractNumber: 'CON-2024-NEW',
        clientName: 'Novo Cliente',
        property: 'Nova Propriedade',
        status: 'pending' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 1000.00,
        dueDate: '2024-06-30',
      };

      const createdContract = {
        id: 'new-contract-id',
        ...newContractData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidValue: 0,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(createdContract),
      });

      global.fetch = mockFetch;

      const { useOptimisticMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockResolvedValue(createdContract);
      const mockOnSuccess = vi.fn();
      
      vi.mocked(useOptimisticMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: mockOnSuccess,
      } as any);

      const { result } = renderHookWithProviders(
        () => useCreateContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync(newContractData);

      expect(mockMutationFn).toHaveBeenCalledWith(newContractData);
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('deve tratar erro ao criar contrato', async () => {
      const newContractData = {
        contractNumber: 'CON-2024-NEW',
        clientName: 'Novo Cliente',
        property: 'Nova Propriedade',
        status: 'pending' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 1000.00,
        dueDate: '2024-06-30',
      };

      const mockError = new Error('Validation Error');
      const mockFetch = vi.fn().mockRejectedValue(mockError);
      global.fetch = mockFetch;

      const { useOptimisticMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockRejectedValue(mockError);
      
      vi.mocked(useOptimisticMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: true,
        error: mockError,
        reset: vi.fn(),
        onSuccess: vi.fn(),
      } as any);

      const { result } = renderHookWithProviders(
        () => useCreateContract(),
        { queryWrapper: true }
      );

      await expect(result.current.mutateAsync(newContractData)).rejects.toThrow();
    });

    it('deve atualizar contrato com sucesso', async () => {
      const contractId = 'test-contract-123';
      const updates = {
        status: 'completed' as const,
        paidValue: 2000.00,
      };

      const updatedContract = {
        ...testDataScenarios.successfulContract,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedContract),
      });

      global.fetch = mockFetch;

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockResolvedValue(updatedContract);
      const mockOnSuccess = vi.fn();
      
      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: mockOnSuccess,
      } as any);

      const { result } = renderHookWithProviders(
        () => useUpdateContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync({ id: contractId, ...updates });

      expect(mockMutationFn).toHaveBeenCalledWith({ id: contractId, ...updates });
    });

    it('deve deletar contrato com sucesso', async () => {
      const contractId = 'test-contract-123';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      global.fetch = mockFetch;

      const { useOptimizedMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockResolvedValue(undefined);
      const mockOnSuccess = vi.fn();
      
      vi.mocked(useOptimizedMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: mockOnSuccess,
      } as any);

      const { result } = renderHookWithProviders(
        () => useDeleteContract(),
        { queryWrapper: true }
      );

      await result.current.mutateAsync(contractId);

      expect(mockMutationFn).toHaveBeenCalledWith(contractId);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Database Error Scenarios', () => {
    it('deve tratar erro de conexão com banco de dados', async () => {
      configureSupabaseResponse.databaseError('Database connection failed');

      const { result } = renderHookWithProviders(
        () => useContract('test-id'),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('Database connection failed');
    });

    it('deve tratar timeout de requisição', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockImplementation(() => {
        throw new Error('Request timeout');
      });

      const { result } = renderHookWithProviders(
        () => useContract('test-id'),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('timeout');
    });

    it('deve tratar resposta de servidor inválida', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      vi.mocked(useOptimizedQuery).mockImplementation(() => {
        throw new Error('Erro ao buscar contrato: Internal Server Error');
      });

      const { result } = renderHookWithProviders(
        () => useContract('test-id'),
        { queryWrapper: true }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('500');
    });
  });

  describe('Cache Behavior Integration', () => {
    it('deve manter cache entre re-renders', async () => {
      const contractId = 'test-contract-123';
      const mockContract = testDataScenarios.successfulContract;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockContract),
      });

      global.fetch = mockFetch;

      const { useOptimizedQuery } = await import('@/hooks/query');
      let callCount = 0;
      vi.mocked(useOptimizedQuery).mockImplementation((queryKey, queryFn) => {
        callCount++;
        return {
          data: callCount === 1 ? null : mockContract,
          isLoading: callCount === 1,
          error: null,
          isError: false,
          refetch: vi.fn(),
        };
      });

      const { result, rerender } = renderHookWithProviders(
        () => useContract(contractId),
        { queryWrapper: true }
      );

      // Primeiro render - loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      // Aguardar e re-renderizar
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();

      // Segundo render - deve usar cache
      expect(result.current.data).toEqual(mockContract);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Fetch só foi chamado uma vez
    });

    it('deve invalidar cache ao criar novo contrato', async () => {
      const newContract = testDataScenarios.successfulContract;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newContract),
      });

      global.fetch = mockFetch;

      const { useOptimisticMutation } = await import('@/hooks/query');
      const mockMutationFn = vi.fn().mockResolvedValue(newContract);
      const mockOnSuccess = vi.fn();
      
      vi.mocked(useOptimisticMutation).mockReturnValue({
        mutate: mockMutationFn,
        mutateAsync: mockMutationFn,
        isLoading: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        onSuccess: mockOnSuccess,
      } as any);

      const { result } = renderHookWithProviders(
        () => useCreateContract(),
        { queryWrapper: true }
      );

      // Capturar o callback onSuccess
      const [onSuccessCallback] = vi.mocked(useOptimisticMutation).mock.calls[0];
      
      await result.current.mutateAsync({
        contractNumber: 'CON-2024-NEW',
        clientName: 'Test Client',
        property: 'Test Property',
        status: 'pending' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        totalValue: 1000.00,
        dueDate: '2024-06-30',
      });

      // Verificar se onSuccess foi chamado
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});