/**
 * Store específico para gerenciamento de notificações
 * Integração com sistema de notificações da aplicação
 */

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { Notification, NotificationFilters } from '@/features/notifications/types/notification';
import { useNotificationState } from './appStore';

export interface NotificationStore {
  state: NotificationState;
  actions: NotificationActions;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  loading: boolean;
  error: string | null;
  // Estados específicos de UI
  showToast: boolean;
  selectedNotifications: string[];
  sortBy: 'created_at' | 'priority' | 'read';
  sortOrder: 'asc' | 'desc';
}

export interface NotificationActions {
  // CRUD básico
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  
  // Filtros e busca
  setFilters: (filters: Partial<NotificationFilters>) => void;
  searchNotifications: (query: string) => Notification[];
  
  // Seleção
  selectNotification: (id: string) => void;
  deselectNotification: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearSelection: () => void;
  
  // Ordenação
  setSorting: (field: 'created_at' | 'priority' | 'read', order: 'asc' | 'desc') => void;
  
  // UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  showToastNotification: () => void;
  hideToastNotification: () => void;
  
  // Utilitários
  getNotificationsByType: (type: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
  getUnreadCount: () => number;
  hasUnreadNotifications: () => boolean;
}

// Ações do reducer
const NotificationStoreActions = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_FILTERS: 'SET_FILTERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SHOW_TOAST: 'SET_SHOW_TOAST',
  SET_SELECTED: 'SET_SELECTED',
  ADD_SELECTED: 'ADD_SELECTED',
  REMOVE_SELECTED: 'REMOVE_SELECTED',
  SET_SORTING: 'SET_SORTING',
} as const;

type NotificationStoreAction =
  | { type: typeof NotificationStoreActions.SET_NOTIFICATIONS; payload: Notification[] }
  | { type: typeof NotificationStoreActions.ADD_NOTIFICATION; payload: Notification }
  | { type: typeof NotificationStoreActions.REMOVE_NOTIFICATION; payload: string }
  | { type: typeof NotificationStoreActions.MARK_AS_READ; payload: string }
  | { type: typeof NotificationStoreActions.MARK_ALL_AS_READ }
  | { type: typeof NotificationStoreActions.CLEAR_ALL }
  | { type: typeof NotificationStoreActions.SET_FILTERS; payload: Partial<NotificationFilters> }
  | { type: typeof NotificationStoreActions.SET_LOADING; payload: boolean }
  | { type: typeof NotificationStoreActions.SET_ERROR; payload: string | null }
  | { type: typeof NotificationStoreActions.SET_SHOW_TOAST; payload: boolean }
  | { type: typeof NotificationStoreActions.SET_SELECTED; payload: string[] }
  | { type: typeof NotificationStoreActions.ADD_SELECTED; payload: string }
  | { type: typeof NotificationStoreActions.REMOVE_SELECTED; payload: string }
  | { type: typeof NotificationStoreActions.SET_SORTING; payload: { field: 'created_at' | 'priority' | 'read'; order: 'asc' | 'desc' } };

// Estado inicial
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filters: { unread_only: true },
  loading: false,
  error: null,
  showToast: false,
  selectedNotifications: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// Reducer
const notificationStoreReducer = (state: NotificationState, action: NotificationStoreAction): NotificationState => {
  switch (action.type) {
    case NotificationStoreActions.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length,
      };

    case NotificationStoreActions.ADD_NOTIFICATION:
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: action.payload.read ? state.unreadCount : state.unreadCount + 1,
      };

    case NotificationStoreActions.REMOVE_NOTIFICATION:
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filtered,
        unreadCount: filtered.filter(n => !n.read).length,
        selectedNotifications: state.selectedNotifications.filter(id => id !== action.payload),
      };

    case NotificationStoreActions.MARK_AS_READ:
      const marked = state.notifications.map(n => 
        n.id === action.payload ? { ...n, read: true, read_at: new Date().toISOString() } : n
      );
      return {
        ...state,
        notifications: marked,
        unreadCount: marked.filter(n => !n.read).length,
      };

    case NotificationStoreActions.MARK_ALL_AS_READ:
      const allMarked = state.notifications.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }));
      return {
        ...state,
        notifications: allMarked,
        unreadCount: 0,
      };

    case NotificationStoreActions.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        selectedNotifications: [],
      };

    case NotificationStoreActions.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case NotificationStoreActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case NotificationStoreActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case NotificationStoreActions.SET_SHOW_TOAST:
      return {
        ...state,
        showToast: action.payload,
      };

    case NotificationStoreActions.SET_SELECTED:
      return {
        ...state,
        selectedNotifications: action.payload,
      };

    case NotificationStoreActions.ADD_SELECTED:
      return {
        ...state,
        selectedNotifications: [...new Set([...state.selectedNotifications, action.payload])],
      };

    case NotificationStoreActions.REMOVE_SELECTED:
      return {
        ...state,
        selectedNotifications: state.selectedNotifications.filter(id => id !== action.payload),
      };

    case NotificationStoreActions.SET_SORTING:
      return {
        ...state,
        sortBy: action.payload.field,
        sortOrder: action.payload.order,
      };

    default:
      return state;
  }
};

// Context
const NotificationStoreContext = createContext<NotificationStore | null>(null);

// Provider
interface NotificationStoreProviderProps {
  children: ReactNode;
}

export const NotificationStoreProvider = ({ children }: NotificationStoreProviderProps) => {
  const [state, dispatch] = useReducer(notificationStoreReducer, initialState);

  // Ações básicas
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: NotificationStoreActions.ADD_NOTIFICATION, payload: newNotification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: NotificationStoreActions.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: NotificationStoreActions.MARK_AS_READ, payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: NotificationStoreActions.MARK_ALL_AS_READ });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: NotificationStoreActions.CLEAR_ALL });
  }, []);

  // Filtros
  const setFilters = useCallback((filters: Partial<NotificationFilters>) => {
    dispatch({ type: NotificationStoreActions.SET_FILTERS, payload: filters });
  }, []);

  const searchNotifications = useCallback((query: string): Notification[] => {
    return state.notifications.filter(notification => 
      notification.title.toLowerCase().includes(query.toLowerCase()) ||
      notification.message.toLowerCase().includes(query.toLowerCase())
    );
  }, [state.notifications]);

  // Seleção
  const selectNotification = useCallback((id: string) => {
    dispatch({ type: NotificationStoreActions.ADD_SELECTED, payload: id });
  }, []);

  const deselectNotification = useCallback((id: string) => {
    dispatch({ type: NotificationStoreActions.REMOVE_SELECTED, payload: id });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = state.notifications.map(n => n.id);
    dispatch({ type: NotificationStoreActions.SET_SELECTED, payload: allIds });
  }, [state.notifications]);

  const deselectAll = useCallback(() => {
    dispatch({ type: NotificationStoreActions.SET_SELECTED, payload: [] });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: NotificationStoreActions.SET_SELECTED, payload: [] });
  }, []);

  // Ordenação
  const setSorting = useCallback((field: 'created_at' | 'priority' | 'read', order: 'asc' | 'desc') => {
    dispatch({ type: NotificationStoreActions.SET_SORTING, payload: { field, order } });
  }, []);

  // UI
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: NotificationStoreActions.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: NotificationStoreActions.SET_ERROR, payload: error });
  }, []);

  const showToastNotification = useCallback(() => {
    dispatch({ type: NotificationStoreActions.SET_SHOW_TOAST, payload: true });
    // Auto-hide após 5 segundos
    setTimeout(() => {
      dispatch({ type: NotificationStoreActions.SET_SHOW_TOAST, payload: false });
    }, 5000);
  }, []);

  const hideToastNotification = useCallback(() => {
    dispatch({ type: NotificationStoreActions.SET_SHOW_TOAST, payload: false });
  }, []);

  // Utilitários
  const getNotificationsByType = useCallback((type: string): Notification[] => {
    return state.notifications.filter(n => n.type === type);
  }, [state.notifications]);

  const getNotificationsByPriority = useCallback((priority: string): Notification[] => {
    return state.notifications.filter(n => n.priority === priority);
  }, [state.notifications]);

  const getUnreadCount = useCallback((): number => {
    return state.notifications.filter(n => !n.read).length;
  }, [state.notifications]);

  const hasUnreadNotifications = useCallback((): boolean => {
    return state.notifications.some(n => !n.read);
  }, [state.notifications]);

  const store: NotificationStore = {
    state,
    actions: {
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      setFilters,
      searchNotifications,
      selectNotification,
      deselectNotification,
      selectAll,
      deselectAll,
      clearSelection,
      setSorting,
      setLoading,
      setError,
      showToastNotification,
      hideToastNotification,
      getNotificationsByType,
      getNotificationsByPriority,
      getUnreadCount,
      hasUnreadNotifications,
    },
  };

  return (
    <NotificationStoreContext.Provider value={store}>
      {children}
    </NotificationStoreContext.Provider>
  );
};

// Hook
export const useNotificationStore = (): NotificationStore => {
  const context = useContext(NotificationStoreContext);
  if (!context) {
    throw new Error('useNotificationStore must be used within a NotificationStoreProvider');
  }
  return context;
};