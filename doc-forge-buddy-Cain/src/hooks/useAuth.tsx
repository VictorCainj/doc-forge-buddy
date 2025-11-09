/* eslint-disable react-refresh/only-export-components */

/**
 * @fileoverview Hook de autenticação e gerenciamento de sessão
 * @description Hook React para gerenciar autenticação de usuários com Supabase
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authLogger } from '@/utils/logger';
import { UserProfile } from '@/types/admin';

/**
 * Interface do contexto de autenticação
 * @description Define a estrutura de dados e métodos disponíveis no contexto de auth
 */
interface AuthContextType {
  /** Usuário autenticado do Supabase */
  user: User | null;
  /** Sessão ativa do Supabase */
  session: Session | null;
  /** Perfil do usuário (dados estendidos) */
  profile: UserProfile | null;
  /** Indica se o usuário é administrador */
  isAdmin: boolean;
  /** Estado de loading da autenticação */
  loading: boolean;
  /** Função para fazer login */
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  /** Função para fazer logout */
  signOut: () => Promise<{ error: AuthError | null }>;
  /** Função para resetar senha */
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook para usar o contexto de autenticação
 * @description Hook principal para acessar funcionalidades de autenticação
 * @returns Contexto de autenticação com dados e métodos
 * @throws Lança erro se usado fora do AuthProvider
 * @example
 * ```typescript
 * const { user, signIn, signOut } = useAuth();
 * 
 * const handleLogin = async () => {
 *   const { error } = await signIn('user@email.com', 'password');
 *   if (error) console.error('Login failed:', error);
 * };
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Retorna um valor padrão em vez de lançar erro para evitar crash durante a inicialização
    return {
      user: null,
      session: null,
      profile: null,
      isAdmin: false,
      loading: true,
      signIn: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
      resetPassword: async () => ({ error: null }),
    };
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const PROFILE_STORAGE_KEY = 'user_profile_cache';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Carregar perfil do cache no início
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Verificar se o cache não expirou (24 horas)
          const cacheAge = Date.now() - (parsed._timestamp || 0);
          if (cacheAge < 24 * 60 * 60 * 1000) {
            authLogger.debug('Perfil carregado do cache');
            return parsed;
          }
        }
      } catch (error) {
        authLogger.warn('Erro ao carregar perfil do cache:', error);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Salvar perfil no cache
  const saveProfileToCache = useCallback((profileData: UserProfile | null) => {
    if (typeof window !== 'undefined') {
      try {
        if (profileData) {
          localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify({ ...profileData, _timestamp: Date.now() })
          );
        } else {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
      } catch (error) {
        authLogger.warn('Erro ao salvar perfil no cache:', error);
      }
    }
  }, []);

  // Carregar profile do usuário (otimizado com timeout)
  const loadUserProfile = useCallback(
    async (userId: string) => {
      try {
        // Timeout de 3 segundos para o carregamento do profile
        const profilePromise = supabase
          .from('profiles')
          .select('user_id, role, full_name, created_at')
          .eq('user_id', userId)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout ao carregar profile')),
            3000
          )
        );

        const { data, error } = (await Promise.race([
          profilePromise,
          timeoutPromise,
        ])) as { data: unknown; error: unknown };

        if (error) {
          authLogger.error('Erro ao carregar profile:', error);
          setProfile(null);
          saveProfileToCache(null);
        } else {
          const profileData = data as UserProfile;
          setProfile(profileData);
          saveProfileToCache(profileData);
          authLogger.debug('Profile carregado:', profileData?.role);
        }
      } catch (error) {
        authLogger.warn('Timeout ou erro ao carregar profile:', error);
        // Em caso de erro, tentar manter o cache se disponível
        // O cache já foi carregado no estado inicial
      }
    },
    [saveProfileToCache]
  );

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    // Timeout de segurança para garantir que o loading não fique preso
    const setupTimeout = () => {
      timeoutId = setTimeout(() => {
        if (isSubscribed) {
          authLogger.warn('Timeout na verificação de autenticação');
          setLoading(false);
        }
      }, 5000); // 5 segundos de timeout máximo (otimizado)
    };

    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        setupTimeout();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isSubscribed) return;

        if (error) {
          authLogger.error('Erro ao obter sessão inicial:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
      } catch (error) {
        authLogger.error('Erro fatal ao obter sessão:', error);
      } finally {
        if (isSubscribed) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      authLogger.debug('Auth state changed:', event, session?.user?.email);

      // Evitar processar eventos duplicados
      if (event === 'INITIAL_SESSION') {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        saveProfileToCache(null);
      }

      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadUserProfile, saveProfileToCache]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Limpar cache do perfil ao fazer logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
      setProfile(null);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
