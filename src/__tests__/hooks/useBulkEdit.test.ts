import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBulkEdit, useBulkUpdate, useBulkDelete } from '@/hooks/useBulkEdit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock do Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBulkEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com array vazio', () => {
    const { result } = renderHook(() => useBulkEdit());
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
  });

  it('deve adicionar ID quando toggleSelection é chamado', () => {
    const { result } = renderHook(() => useBulkEdit());
    
    act(() => {
      result.current.toggleSelection('id-1');
    });

    expect(result.current.selectedIds).toEqual(['id-1']);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('id-1')).toBe(true);
  });

  it('deve remover ID quando toggleSelection é chamado novamente', () => {
    const { result } = renderHook(() => useBulkEdit());
    
    act(() => {
      result.current.toggleSelection('id-1');
      result.current.toggleSelection('id-1');
    });

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelected('id-1')).toBe(false);
  });

  it('deve adicionar múltiplos IDs', () => {
    const { result } = renderHook(() => useBulkEdit());
    
    act(() => {
      result.current.toggleSelection('id-1');
      result.current.toggleSelection('id-2');
      result.current.toggleSelection('id-3');
    });

    expect(result.current.selectedIds).toEqual(['id-1', 'id-2', 'id-3']);
    expect(result.current.selectedCount).toBe(3);
  });

  it('deve selecionar todos os IDs com selectAll', () => {
    const { result } = renderHook(() => useBulkEdit());
    const ids = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'];
    
    act(() => {
      result.current.selectAll(ids);
    });

    expect(result.current.selectedIds).toEqual(ids);
    expect(result.current.selectedCount).toBe(5);
  });

  it('deve limpar seleção com clearSelection', () => {
    const { result } = renderHook(() => useBulkEdit());
    
    act(() => {
      result.current.selectAll(['id-1', 'id-2', 'id-3']);
      result.current.clearSelection();
    });

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
  });

  it('deve retornar corretamente isSelected', () => {
    const { result } = renderHook(() => useBulkEdit());
    
    act(() => {
      result.current.toggleSelection('id-1');
      result.current.toggleSelection('id-2');
    });

    expect(result.current.isSelected('id-1')).toBe(true);
    expect(result.current.isSelected('id-2')).toBe(true);
    expect(result.current.isSelected('id-3')).toBe(false);
  });
});

describe('useBulkUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve executar atualização em massa com sucesso', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ error: null });
    
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { result } = renderHook(() => useBulkUpdate(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        table: 'contracts',
        ids: ['id-1', 'id-2'],
        data: { status: 'ativo' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('deve contar falhas corretamente', async () => {
    const mockEq = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'Erro de atualização' } });
    
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { result } = renderHook(() => useBulkUpdate(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        table: 'contracts',
        ids: ['id-1', 'id-2'],
        data: { status: 'ativo' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.updated).toBe(1);
    expect(result.current.data?.failed).toBe(1);
  });
});

describe('useBulkDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve executar deleção em massa com sucesso', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { result } = renderHook(() => useBulkDelete(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        table: 'contracts',
        ids: ['id-1', 'id-2'],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.updated).toBe(2);
    expect(result.current.data?.failed).toBe(0);
  });

  it('deve tratar erros de deleção', async () => {
    const mockEq = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'Erro ao deletar' } });
    
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { result } = renderHook(() => useBulkDelete(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        table: 'contracts',
        ids: ['id-1', 'id-2'],
      });
    });

    await waitFor(() => {
      expect(result.current.data?.updated).toBe(1);
      expect(result.current.data?.failed).toBe(1);
    });
  });
});

