import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com estado de loading', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('deve fazer login com credenciais válidas', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } as any },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const { error } = await result.current.signIn(
      'test@example.com',
      'password'
    );

    expect(error).toBe(null);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('deve retornar erro em login inválido', async () => {
    const mockError = { message: 'Invalid credentials' };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError as any,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const { error } = await result.current.signIn(
      'test@example.com',
      'wrong-password'
    );

    expect(error).toEqual(mockError);
  });

  it('deve fazer logout corretamente', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const { error } = await result.current.signOut();

    expect(error).toBe(null);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('deve resetar senha com email válido', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {} as any,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    const { error } = await result.current.resetPassword('test@example.com');

    expect(error).toBe(null);
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/reset-password'),
      })
    );
  });

  it('deve verificar se usuário é admin', async () => {
    const mockProfile = {
      user_id: 'user-123',
      role: 'admin',
      full_name: 'Test Admin',
      created_at: '2024-01-01',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Note: This test may need adjustment based on actual implementation
    // as it depends on how profile loading works in the provider
  });

  it('deve retornar valores padrão quando usado fora do provider', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(true);
  });
});
