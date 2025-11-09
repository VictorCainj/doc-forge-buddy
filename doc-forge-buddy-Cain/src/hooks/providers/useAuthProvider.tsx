import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authLogger } from '@/utils/logger';
import { UserProfile } from '@/types/admin';
import { useLocalStorage } from '../shared/useLocalStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'user_profile_cache';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(PROFILE_STORAGE_KEY, null);
  const [loading, setLoading] = useState(true);

  // Carregar profile do usuário (otimizado com timeout)
  const loadUserProfile = async (userId: string) => {
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
      } else {
        const profileData = data as UserProfile;
        setProfile(profileData);
        authLogger.debug('Profile carregado:', profileData?.role);
      }
    } catch (error) {
      authLogger.warn('Timeout ou erro ao carregar profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

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
      }, 5000);
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
      }

      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [setProfile]);

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
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

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
      refreshProfile: async () => {},
    };
  }
  return context;
};

export default useAuth;