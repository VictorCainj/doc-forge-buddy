/**
 * Tipos relacionados ao sistema de auditoria
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'STATUS_CHANGE';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email?: string;
  user_name?: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction;
  entity_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_entity: Record<string, number>;
  top_users: Array<{
    user_id: string;
    email: string;
    full_name: string;
    count: number;
  }>;
  events_by_day: Record<string, number>;
}

export interface CreateAuditLogPayload {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  metadata?: Record<string, any>;
}
