/**
 * Tipos consolidados de auditoria
 * Substitui duplicações entre domain/audit.ts e Supabase types
 */

import { AuditAction, BaseEntity } from './base';
import { Tables } from '@/integrations/supabase/types';

// =============================================================================
// AUDIT LOG CONSOLIDADO
// =============================================================================

export interface AuditLog extends BaseEntity {
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

// Tipos para filtros de auditoria
export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction;
  entity_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

// Estatísticas de auditoria
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

// Payload para criação de audit log
export interface CreateAuditLogPayload {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  metadata?: Record<string, any>;
}

// =============================================================================
// MAPPING COM SUPABASE TYPES
// =============================================================================

/**
 * Mapeia audit_log do Supabase para interface consolidada
 */
export const mapSupabaseAuditLog = (dbLog: Tables<'audit_logs'>['Row']): AuditLog => {
  return {
    id: dbLog.id,
    user_id: dbLog.user_id,
    action: dbLog.action,
    entity_type: dbLog.entity_type,
    entity_id: dbLog.entity_id,
    old_data: dbLog.old_data as Record<string, any> | null,
    new_data: dbLog.new_data as Record<string, any> | null,
    ip_address: dbLog.ip_address,
    user_agent: dbLog.user_agent,
    metadata: dbLog.metadata as Record<string, any> || {},
    created_at: dbLog.created_at,
    updated_at: dbLog.created_at // Supabase não tem updated_at para audit_logs
  };
};

/**
 * Mapeia payload para insert no Supabase
 */
export const mapToSupabaseAuditInsert = (
  payload: CreateAuditLogPayload,
  userId?: string
): Tables<'audit_logs'>['Insert'] => {
  return {
    user_id: userId || null,
    action: payload.action,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id || null,
    old_data: payload.old_data || null,
    new_data: payload.new_data || null,
    metadata: payload.metadata || {},
  };
};