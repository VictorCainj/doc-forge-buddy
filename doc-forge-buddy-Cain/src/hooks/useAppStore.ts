/**
 * Hooks customizados para o sistema de state management
 * Facilita o uso dos stores em componentes
 */

import { useCallback, useEffect, useMemo } from 'react';
import { 
  useAppStore, 
  useAuthState, 
  useThemeState, 
  useNotificationState,
  useAppState 
} from '@/stores';
import { useContractStore } from '@/stores/contractStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Notification } from '@/features/notifications/types/notification';

// ==================== HOOKS DE AUTENTICAÇÃO ====================
export const useAuth = () => {
  const auth = useAuthState();
  
  return useMemo(() => ({
    user: auth.user,
    session: auth.session,
    profile: auth.profile,
    isAdmin: auth.isAdmin,
    loading: auth.loading,
    isAuthenticated: !!auth.user,
    signIn: auth.signIn,
    signOut: auth.signOut,
    resetPassword: auth.resetPassword,
  }), [auth]);
};

// ==================== HOOKS DE TEMA ====================
export const useTheme = () => {
  const theme = useThemeState();
  
  return useMemo(() => ({
    mode: theme.mode,
    isDark: theme.mode === 'dark',
    isSystem: theme.system,
    isLight: theme.mode === 'light',
    toggleTheme: theme.toggleTheme,
    setTheme: theme.setTheme,
    getCurrentTheme: theme.getCurrentTheme,
  }), [theme]);
};

// ==================== HOOKS DE NOTIFICAÇÕES ====================
export const useNotifications = () => {
  const notifications = useNotificationState();
  const notificationStore = useNotificationStore();
  
  return useMemo(() => ({
    // Estado do store global
    global: {
      notifications: notifications.notifications,
      unreadCount: notifications.unreadCount,
      loading: notifications.loading,
      error: notifications.error,
    },
    
    // Ações do store global
    actions: {
      addNotification: notifications.addNotification,
      removeNotification: notifications.removeNotification,
      markAsRead: notifications.markAsRead,
      markAllAsRead: notifications.markAllAsRead,
      clearAll: notifications.clearAll,
      setFilters: notifications.setFilters,
    },
    
    // Estado do store específico
    store: {
      notifications: notificationStore.state.notifications,
      unreadCount: notificationStore.state.unreadCount,
      selectedNotifications: notificationStore.state.selectedNotifications,
      showToast: notificationStore.state.showToast,
      sortBy: notificationStore.state.sortBy,
      sortOrder: notificationStore.state.sortOrder,
    },
    
    // Ações do store específico
    storeActions: notificationStore.actions,
  }), [notifications, notificationStore]);
};

// ==================== HOOKS DE CONTRATOS ====================
export const useContracts = () => {
  const contractStore = useContractStore();
  
  return useMemo(() => ({
    state: contractStore.state,
    actions: contractStore.actions,
  }), [contractStore]);
};

// ==================== HOOKS DE ESTADO GLOBAL ====================
export const useGlobalState = () => {
  const appState = useAppState();
  const auth = useAuth();
  const theme = useTheme();
  const notifications = useNotifications();
  const contracts = useContracts();
  
  return useMemo(() => ({
    app: appState,
    auth,
    theme,
    notifications,
    contracts,
  }), [appState, auth, theme, notifications, contracts]);
};

// ==================== HOOKS DE UTILITÁRIOS ====================
export const useLoadingState = () => {
  const { isLoading } = useAppState();
  const auth = useAuth();
  const notifications = useNotifications();
  
  return useMemo(() => ({
    isLoading: isLoading || auth.loading || notifications.global.loading,
    auth: auth.loading,
    notifications: notifications.global.loading,
  }), [isLoading, auth.loading, notifications.global.loading]);
};

export const useErrorState = () => {
  const appState = useAppState();
  const notifications = useNotifications();
  const contracts = useContracts();
  
  return useMemo(() => ({
    global: appState.error,
    notifications: notifications.global.error,
    contracts: contracts.state.errors.general,
  }), [appState.error, notifications.global.error, contracts.state.errors.general]);
};

// ==================== HOOKS DE PREFERÊNCIAS ====================
export const useUserPreferences = () => {
  const theme = useTheme();
  const auth = useAuth();
  
  // Salvar preferências do usuário
  const savePreference = useCallback((key: string, value: any) => {
    if (!auth.user) return;
    
    const preferences = {
      theme: theme.mode,
      systemTheme: theme.system,
      // Adicionar mais preferências conforme necessário
    };
    
    localStorage.setItem(`user_preferences_${auth.user.id}`, JSON.stringify(preferences));
  }, [auth.user, theme]);
  
  // Carregar preferências do usuário
  const loadPreferences = useCallback(() => {
    if (!auth.user) return null;
    
    try {
      const saved = localStorage.getItem(`user_preferences_${auth.user.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [auth.user]);
  
  // Auto-load das preferências
  useEffect(() => {
    const preferences = loadPreferences();
    if (preferences) {
      if (preferences.theme) {
        theme.setTheme(preferences.theme);
      }
      if (preferences.systemTheme !== undefined) {
        // Implementar toggle system theme se necessário
      }
    }
  }, [loadPreferences, theme]);
  
  return {
    savePreference,
    loadPreferences,
  };
};

// ==================== HOOKS DE COMPORTAMENTO ====================
export const useAppBehavior = () => {
  const { isLoading } = useAppState();
  const auth = useAuth();
  const notifications = useNotifications();
  
  // Detectar se a app está em estado de "focus"
  const isAppActive = useMemo(() => {
    return !isLoading && auth.user !== null;
  }, [isLoading, auth.user]);
  
  // Detectar se há dados pendentes para salvar
  const hasPendingChanges = useMemo(() => {
    return notifications.global.notifications.some(n => !n.read);
  }, [notifications.global.notifications]);
  
  // Detectar se deve mostrar indicadores de loading
  const shouldShowLoading = useMemo(() => {
    return isLoading || auth.loading;
  }, [isLoading, auth.loading]);
  
  return {
    isAppActive,
    hasPendingChanges,
    shouldShowLoading,
  };
};

// ==================== HOOK DE INICIALIZAÇÃO ====================
export const useAppInitialization = () => {
  const auth = useAuth();
  const theme = useTheme();
  const { loadPreferences } = useUserPreferences();
  
  const initialize = useCallback(async () => {
    // Carregar preferências do usuário
    const preferences = loadPreferences();
    if (preferences) {
      if (preferences.theme) {
        theme.setTheme(preferences.theme);
      }
    }
    
    // Outras inicializações podem ser adicionadas aqui
    // - Carregar configurações do usuário
    // - Inicializar caches
    // - Verificar atualizações
  }, [loadPreferences, theme]);
  
  useEffect(() => {
    if (auth.user) {
      initialize();
    }
  }, [auth.user, initialize]);
  
  return { initialize };
};