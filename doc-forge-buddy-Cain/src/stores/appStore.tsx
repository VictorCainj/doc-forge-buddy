/**
 * @fileoverview Store global principal da aplicação
 * @description Centraliza todo o estado global usando Context API e useReducer
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authLogger } from '@/utils/logger';
import { Notification, NotificationFilters } from '@/features/notifications/types/notification';
import { UserProfile, AppState, AuthState, ThemeState, NotificationState } from '@/types/global';

// ==================== AUTH STATE ====================
const initialAuthState: AuthState = {
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
};

const PROFILE_STORAGE_KEY = 'user_profile_cache';

const AuthActions = {
  SET_LOADING: 'SET_LOADING',
  SET_SESSION: 'SET_SESSION',
  SET_USER: 'SET_USER',
  SET_PROFILE: 'SET_PROFILE',
  SET_ACTIONS: 'SET_ACTIONS',
} as const;

type AuthAction =
  | { type: typeof AuthActions.SET_LOADING; payload: boolean }
  | { type: typeof AuthActions.SET_SESSION; payload: Session | null }
  | { type: typeof AuthActions.SET_USER; payload: User | null }
  | { type: typeof AuthActions.SET_PROFILE; payload: UserProfile | null }
  | { type: typeof AuthActions.SET_ACTIONS; payload: Partial<AuthState> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActions.SET_LOADING:
      return { ...state, loading: action.payload };
    case AuthActions.SET_SESSION:
      return { ...state, session: action.payload };
    case AuthActions.SET_USER:
      return { ...state, user: action.payload };
    case AuthActions.SET_PROFILE:
      return { 
        ...state, 
        profile: action.payload,
        isAdmin: action.payload?.role === 'admin',
      };
    case AuthActions.SET_ACTIONS:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

// ==================== THEME STATE ====================
const initialThemeState: ThemeState = {
  mode: 'light',
  system: true,
  toggleTheme: () => {},
  setTheme: () => {},
  getCurrentTheme: () => 'light',
};

const ThemeActions = {
  SET_THEME: 'SET_THEME',
  SET_SYSTEM: 'SET_SYSTEM',
} as const;

type ThemeAction =
  | { type: typeof ThemeActions.SET_THEME; payload: 'light' | 'dark' | 'system' }
  | { type: typeof ThemeActions.SET_SYSTEM; payload: boolean };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case ThemeActions.SET_THEME:
      return { 
        ...state, 
        mode: action.payload === 'system' ? 'light' : action.payload,
        system: action.payload === 'system',
        setTheme: (mode: 'light' | 'dark' | 'system') => {
          // Esta função será definida no provider
        },
      };
    case ThemeActions.SET_SYSTEM:
      return { ...state, system: action.payload };
    default:
      return state;
  }
};

// ==================== NOTIFICATION STATE ====================
const initialNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filters: { unread_only: true },
  loading: false,
  error: null,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  setFilters: () => {},
  fetchNotifications: async () => {},
};

const NotificationActions = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_FILTERS: 'SET_FILTERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ACTIONS: 'SET_ACTIONS',
} as const;

type NotificationAction =
  | { type: typeof NotificationActions.SET_NOTIFICATIONS; payload: Notification[] }
  | { type: typeof NotificationActions.ADD_NOTIFICATION; payload: Notification }
  | { type: typeof NotificationActions.REMOVE_NOTIFICATION; payload: string }
  | { type: typeof NotificationActions.MARK_AS_READ; payload: string }
  | { type: typeof NotificationActions.MARK_ALL_AS_READ }
  | { type: typeof NotificationActions.CLEAR_ALL }
  | { type: typeof NotificationActions.SET_FILTERS; payload: Partial<NotificationFilters> }
  | { type: typeof NotificationActions.SET_LOADING; payload: boolean }
  | { type: typeof NotificationActions.SET_ERROR; payload: string | null }
  | { type: typeof NotificationActions.SET_ACTIONS; payload: Partial<NotificationState> };

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case NotificationActions.SET_NOTIFICATIONS:
      const unreadCount = action.payload.filter(n => !n.read).length;
      return { ...state, notifications: action.payload, unreadCount };
    
    case NotificationActions.ADD_NOTIFICATION:
      const newNotifications = [action.payload, ...state.notifications];
      const newUnreadCount = action.payload.read ? state.unreadCount : state.unreadCount + 1;
      return { ...state, notifications: newNotifications, unreadCount: newUnreadCount };
    
    case NotificationActions.REMOVE_NOTIFICATION:
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      return { ...state, notifications: filtered, unreadCount: filtered.filter(n => !n.read).length };
    
    case NotificationActions.MARK_AS_READ:
      const marked = state.notifications.map(n => 
        n.id === action.payload ? { ...n, read: true, read_at: new Date().toISOString() } : n
      );
      return { ...state, notifications: marked, unreadCount: marked.filter(n => !n.read).length };
    
    case NotificationActions.MARK_ALL_AS_READ:
      const allMarked = state.notifications.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }));
      return { ...state, notifications: allMarked, unreadCount: 0 };
    
    case NotificationActions.CLEAR_ALL:
      return { ...state, notifications: [], unreadCount: 0 };
    
    case NotificationActions.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case NotificationActions.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case NotificationActions.SET_ERROR:
      return { ...state, error: action.payload };
    
    case NotificationActions.SET_ACTIONS:
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
};

// ==================== APP STATE ====================
const AppActions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
} as const;

type AppAction =
  | { type: typeof AppActions.SET_LOADING; payload: boolean }
  | { type: typeof AppActions.SET_ERROR; payload: string | null };

const appReducer = (state: { isLoading: boolean; error: string | null }, action: AppAction) => {
  switch (action.type) {
    case AppActions.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case AppActions.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// ==================== CONTEXT ====================
const AppStoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<{
    auth: AuthAction;
    theme: ThemeAction;
    notifications: NotificationAction;
    app: AppAction;
  }>;
} | null>(null);

// ==================== PROVIDER ====================
interface AppStoreProviderProps {
  children: ReactNode;
}

export const AppStoreProvider = ({ children }: AppStoreProviderProps) => {
  // Estados
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [themeState, themeDispatch] = useReducer(themeReducer, initialThemeState);
  const [notificationState, notificationDispatch] = useReducer(notificationReducer, initialNotificationState);
  const [appState, appDispatch] = useReducer(appReducer, { isLoading: false, error: null });

  // Ações auxiliares
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, role, full_name, created_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        authLogger.error('Erro ao carregar profile:', error);
        authDispatch({ type: AuthActions.SET_PROFILE, payload: null });
      } else {
        authDispatch({ type: AuthActions.SET_PROFILE, payload: data as UserProfile });
      }
    } catch (error) {
      authLogger.warn('Erro ao carregar profile:', error);
      authDispatch({ type: AuthActions.SET_PROFILE, payload: null });
    }
  }, []);

  const saveProfileToCache = useCallback((profile: UserProfile | null) => {
    if (typeof window !== 'undefined') {
      try {
        if (profile) {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profile, _timestamp: Date.now() }));
        } else {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
      } catch (error) {
        authLogger.warn('Erro ao salvar perfil no cache:', error);
      }
    }
  }, []);

  // Tema
  const toggleTheme = useCallback(() => {
    themeDispatch({ type: ThemeActions.SET_THEME, payload: themeState.mode === 'light' ? 'dark' : 'light' });
  }, [themeState.mode]);

  const setTheme = useCallback((mode: 'light' | 'dark' | 'system') => {
    themeDispatch({ type: ThemeActions.SET_THEME, payload: mode });
  }, []);

  const getCurrentTheme = useCallback((): 'light' | 'dark' => {
    if (themeState.system) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeState.mode;
  }, [themeState.mode, themeState.system]);

  // Notificações
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    notificationDispatch({ type: NotificationActions.ADD_NOTIFICATION, payload: newNotification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    notificationDispatch({ type: NotificationActions.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationDispatch({ type: NotificationActions.MARK_AS_READ, payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationDispatch({ type: NotificationActions.MARK_ALL_AS_READ });
  }, []);

  const clearAll = useCallback(() => {
    notificationDispatch({ type: NotificationActions.CLEAR_ALL });
  }, []);

  const setFilters = useCallback((filters: Partial<NotificationFilters>) => {
    notificationDispatch({ type: NotificationActions.SET_FILTERS, payload: filters });
  }, []);

  const fetchNotifications = useCallback(async () => {
    notificationDispatch({ type: NotificationActions.SET_LOADING, payload: true });
    notificationDispatch({ type: NotificationActions.SET_ERROR, payload: null });

    try {
      // Implementar fetch de notificações
      // Por enquanto, mantido como placeholder
      notificationDispatch({ type: NotificationActions.SET_LOADING, payload: false });
    } catch (error) {
      notificationDispatch({ type: NotificationActions.SET_ERROR, payload: 'Erro ao carregar notificações' });
      notificationDispatch({ type: NotificationActions.SET_LOADING, payload: false });
    }
  }, []);

  // Autenticação
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Efeito para inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      themeDispatch({ type: ThemeActions.SET_THEME, payload: savedTheme as 'light' | 'dark' | 'system' });
    }
  }, []);

  // Efeito para salvar tema
  useEffect(() => {
    const theme = themeState.system ? 'system' : themeState.mode;
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', getCurrentTheme() === 'dark');
  }, [themeState.mode, themeState.system, getCurrentTheme]);

  // Efeito para carregar perfil do cache
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed._timestamp || 0);
          if (cacheAge < 24 * 60 * 60 * 1000) {
            authDispatch({ type: AuthActions.SET_PROFILE, payload: parsed });
          }
        }
      } catch (error) {
        authLogger.warn('Erro ao carregar perfil do cache:', error);
      }
    }
  }, []);

  // Efeito para configurar ações
  useEffect(() => {
    authDispatch({
      type: AuthActions.SET_ACTIONS,
      payload: {
        signIn,
        signOut,
        resetPassword,
      },
    });
  }, [signIn, signOut, resetPassword]);

  // Efeito para configurar ações de notificações
  useEffect(() => {
    notificationDispatch({
      type: NotificationActions.SET_ACTIONS,
      payload: {
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        setFilters,
        fetchNotifications,
      },
    });
  }, [addNotification, removeNotification, markAsRead, markAllAsRead, clearAll, setFilters, fetchNotifications]);

  // Efeito para configurar ações de tema
  useEffect(() => {
    themeDispatch({
      type: ThemeActions.SET_THEME,
      payload: themeState.mode,
    });
    themeDispatch({
      type: ThemeActions.SET_SYSTEM,
      payload: themeState.system,
    });
  }, [toggleTheme, setTheme, getCurrentTheme, themeState.mode, themeState.system]);

  const state: AppState = {
    auth: {
      ...authState,
      toggleTheme,
      setTheme,
      getCurrentTheme,
    },
    theme: {
      ...themeState,
      toggleTheme,
      setTheme,
      getCurrentTheme,
    },
    notifications: {
      ...notificationState,
    },
    isLoading: appState.isLoading,
    error: appState.error,
  };

  const dispatch = (action: { auth: AuthAction; theme: ThemeAction; notifications: NotificationAction; app: AppAction }) => {
    if (action.auth) authDispatch(action.auth);
    if (action.theme) themeDispatch(action.theme);
    if (action.notifications) notificationDispatch(action.notifications);
    if (action.app) appDispatch(action.app);
  };

  return (
    <AppStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStoreContext.Provider>
  );
};

// ==================== HOOKS ====================
export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};

export const useAuthState = () => {
  const { state } = useAppStore();
  return state.auth;
};

export const useThemeState = () => {
  const { state } = useAppStore();
  return state.theme;
};

export const useNotificationState = () => {
  const { state } = useAppStore();
  return state.notifications;
};

export const useAppState = () => {
  const { state } = useAppStore();
  return {
    isLoading: state.isLoading,
    error: state.error,
  };
};