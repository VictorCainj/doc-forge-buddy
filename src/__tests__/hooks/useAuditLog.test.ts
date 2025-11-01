// @ts-nocheck
/**
 * Testes para hook useAuditLog
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useLogAuditEvent,
  useAuditLogs,
  useAuditStats,
} from '@/hooks/useAuditLog';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    rpc: vi.fn(),
  },
}));

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLogAuditEvent', () => {
    it('deve registrar evento de auditoria com sucesso', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() => useLogAuditEvent(), {
        wrapper: createWrapper(),
      });

      const payload = {
        action: 'LOGIN',
        entity_type: 'user',
        entity_id: 'test-user-id',
        metadata: { ip: '127.0.0.1' },
      };

      await result.current.mutateAsync(payload);

      expect(mockSupabase.supabase.rpc).toHaveBeenCalledWith(
        'log_audit_event',
        expect.objectContaining({
          p_user_id: 'test-user-id',
          p_action: 'LOGIN',
          p_entity_type: 'user',
          p_entity_id: 'test-user-id',
        })
      );
    });

    it('deve salvar log localmente em caso de erro', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('[]'),
        setItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      const { result } = renderHook(() => useLogAuditEvent(), {
        wrapper: createWrapper(),
      });

      const payload = {
        action: 'LOGIN',
        entity_type: 'user',
        entity_id: 'test-user-id',
      };

      await expect(result.current.mutateAsync(payload)).rejects.toThrow();

      // Verificar se salvou localmente
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'audit_logs_backup',
        expect.any(String)
      );
    });
  });

  describe('useAuditLogs', () => {
    it('deve buscar logs de auditoria com filtros', async () => {
      const mockLogs = [
        {
          id: '1',
          action: 'LOGIN',
          entity_type: 'user',
          created_at: '2024-01-01T00:00:00Z',
          user_name: 'Test User',
          user_email: 'test@example.com',
        },
      ];

      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const filters = {
        user_id: 'test-user-id',
        action: 'LOGIN',
        limit: 50,
      };

      const { result } = renderHook(() => useAuditLogs(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLogs);
      expect(mockSupabase.supabase.rpc).toHaveBeenCalledWith(
        'get_audit_logs',
        expect.objectContaining({
          p_user_id: 'test-user-id',
          p_action: 'LOGIN',
          p_limit: 50,
        })
      );
    });
  });

  describe('useAuditStats', () => {
    it('deve buscar estatísticas de auditoria', async () => {
      const mockStats = {
        total_events: 100,
        unique_users: 10,
        top_actions: ['LOGIN', 'LOGOUT'],
        events_by_day: [
          { date: '2024-01-01', count: 50 },
          { date: '2024-01-02', count: 50 },
        ],
      };

      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: [mockStats],
        error: null,
      });

      const { result } = renderHook(() => useAuditStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockSupabase.supabase.rpc).toHaveBeenCalledWith(
        'get_audit_stats',
        expect.objectContaining({
          p_start_date: null,
          p_end_date: null,
        })
      );
    });
  });
});
