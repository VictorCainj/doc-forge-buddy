import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractData } from '@/hooks/useContractData';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useContractData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchContractById', () => {
    it('deve buscar contrato por ID com sucesso', async () => {
      const mockContract = {
        id: '123',
        document_type: 'termo_locatario',
        form_data: { nome: 'João' },
        created_at: '2024-01-01',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockContract,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contract = await result.current.fetchContractById('123');

      expect(contract).toBeDefined();
      expect(contract?.id).toBe('123');
      expect(contract?.form_data).toEqual({ nome: 'João' });
    });

    it('deve lidar com erro ao buscar contrato', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contract = await result.current.fetchContractById('123');

      expect(contract).toBeNull();

      // Aguardar atualização do estado de erro
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('deve processar form_data quando é string JSON', async () => {
      const mockContract = {
        id: '123',
        form_data: JSON.stringify({ nome: 'João' }),
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockContract,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contract = await result.current.fetchContractById('123');

      expect(contract?.form_data).toEqual({ nome: 'João' });
    });
  });

  describe('fetchContractsByType', () => {
    it('deve buscar contratos por tipo', async () => {
      const mockContracts = [
        { id: '1', document_type: 'termo_locatario', form_data: {} },
        { id: '2', document_type: 'termo_locatario', form_data: {} },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockContracts,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: mockOrder }),
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contracts =
        await result.current.fetchContractsByType('termo_locatario');

      expect(contracts).toHaveLength(2);
    });

    it('deve buscar todos os contratos quando tipo é "all"', async () => {
      const mockContracts = [
        { id: '1', document_type: 'termo_locatario', form_data: {} },
        { id: '2', document_type: 'termo_proprietario', form_data: {} },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockContracts,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contracts = await result.current.fetchContractsByType('all');

      expect(contracts).toHaveLength(2);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: mockOrder }),
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contracts =
        await result.current.fetchContractsByType('termo_locatario');

      expect(contracts).toEqual([]);

      // Aguardar atualização do estado de erro
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('deleteContract', () => {
    it('deve deletar contrato com sucesso', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue(mockDelete);

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.deleteContract('123');

      // Verificar que foi chamado
      expect(mockEq).toHaveBeenCalled();
    });

    it('deve lançar erro ao deletar contrato', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Delete error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deleteContract('123')).rejects.toThrow();
    });
  });

  describe('updateContract', () => {
    it('deve atualizar contrato com sucesso', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue(mockUpdate);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateContract('123', { nome: 'João Silva' });

      // Verificar que foi chamado
      expect(mockEq).toHaveBeenCalled();
    });

    it('deve lançar erro ao atualizar contrato', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Update error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const { result } = renderHook(() => useContractData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.updateContract('123', { nome: 'João' })
      ).rejects.toThrow();
    });
  });

  describe('clearError', () => {
    it('deve limpar erro', async () => {
      const { result } = renderHook(() => useContractData());

      // Simular erro
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.fetchContractById('invalid');

      // Aguardar erro ser definido
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.clearError();

      // Aguardar clearError atualizar o estado
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
