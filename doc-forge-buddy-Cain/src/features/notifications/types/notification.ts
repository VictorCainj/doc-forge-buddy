/**
 * Tipos de notificações do sistema
 */

export type NotificationType =
  | 'contract_expiring'
  | 'contract_expiring_7days'
  | 'contract_expiring_1day'
  | 'vistoria_scheduled'
  | 'vistoria_reminder'
  | 'vistoria_today'
  | 'contract_history'
  | 'contract_created'
  | 'contract_updated'
  | 'document_generated'
  | 'entrega_chaves_pending'
  | 'contract_bills_pending'
  | 'vistoria_completed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationMetadata {
  contract_id?: string;
  vistoria_id?: string;
  document_id?: string;
  date?: string;
  days_remaining?: number;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  priority: NotificationPriority;
}

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  priority?: NotificationPriority;
  expires_at?: string | null;
}

export interface NotificationFilters {
  unread_only?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

export interface NotificationCount {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}
