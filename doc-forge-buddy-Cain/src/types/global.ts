/**
 * Tipos globais do sistema de state management
 */

import { User, Session, AuthError } from '@supabase/supabase-js';
import { Notification, NotificationFilters } from '@/features/notifications/types/notification';

export interface UserProfile {
  user_id: string;
  role: string;
  full_name: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  system: boolean;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  getCurrentTheme: () => 'light' | 'dark';
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  loading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setFilters: (filters: Partial<NotificationFilters>) => void;
  fetchNotifications: () => Promise<void>;
}

export interface AppState {
  auth: AuthState;
  theme: ThemeState;
  notifications: NotificationState;
  isLoading: boolean;
  error: string | null;
}