/**
 * Tipos consolidados de usuário/perfil
 * Substitui duplicações entre domain, business/admin.ts e Supabase types
 */

import { UserRole, BaseEntity } from './base';
import { Tables } from '@/integrations/supabase/types';

// =============================================================================
// USER PROFILE CONSOLIDADO
// =============================================================================

export interface UserProfile extends BaseEntity {
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  exp: number;
  level: number;
  last_password_change: string | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string[] | null;
  updated_at: string;
}

// Payload para criação de usuário
export interface CreateUserPayload {
  email: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
}

// Payload para atualização de usuário
export interface UpdateUserPayload {
  id?: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  exp?: number;
  level?: number;
}

// Filtros para busca de usuários
export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  email?: string;
}

// =============================================================================
// SESSÕES E SEGURANÇA
// =============================================================================

export interface UserSession extends BaseEntity {
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, any>;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  is_current?: boolean;
}

// Tentativas de login
export interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

// Histórico de senhas
export interface PasswordChange {
  user_id: string;
  last_password_change: string;
}

// =============================================================================
// PERMISSÕES E ROLES
// =============================================================================

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface UserCustomPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_by: string | null;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
}

// =============================================================================
// ESTATÍSTICAS DO SISTEMA
// =============================================================================

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPrestadores: number;
  totalVistorias: number;
  totalDocuments: number;
}

export interface ExtendedSystemStats extends SystemStats {
  totalSessions: number;
  activeSessions: number;
  failedLoginAttempts: number;
  auditLogsCount: number;
  integrityIssues: number;
}

// =============================================================================
// ERROS DE AUTENTICAÇÃO
// =============================================================================

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoginError extends AuthError {
  type:
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_NOT_CONFIRMED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
}

export interface DatabaseError extends AuthError {
  type:
    | 'CONNECTION_ERROR'
    | 'VALIDATION_ERROR'
    | 'PERMISSION_ERROR'
    | 'UNKNOWN_ERROR';
}

// =============================================================================
// HELPERS PARA PARSING DE ERROS
// =============================================================================

/**
 * Analisa um erro de autenticação e retorna informações tipadas
 */
export const parseAuthError = (error: unknown): LoginError => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;

    if (message.includes('Invalid login credentials')) {
      return {
        type: 'INVALID_CREDENTIALS',
        message: 'Email ou senha incorretos',
      };
    }

    if (message.includes('Email not confirmed')) {
      return {
        type: 'EMAIL_NOT_CONFIRMED',
        message: 'Por favor, verifique seu email antes de fazer login',
      };
    }

    if (message.includes('Network') || message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      };
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'Erro inesperado. Tente novamente.',
  };
};

/**
 * Analisa erros de banco de dados
 */
export const parseDatabaseError = (error: unknown): DatabaseError => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;

    if (message.includes('connection') || message.includes('network')) {
      return {
        type: 'CONNECTION_ERROR',
        message: 'Erro de conexão com o banco de dados',
      };
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        type: 'PERMISSION_ERROR',
        message: 'Sem permissão para realizar esta operação',
      };
    }

    if (message.includes('validation') || message.includes('constraint')) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Dados inválidos fornecidos',
      };
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'Erro inesperado no banco de dados',
  };
};

// =============================================================================
// MAPPING COM SUPABASE TYPES
// =============================================================================

/**
 * Mapeia profile do Supabase para interface consolidada
 */
export const mapSupabaseProfile = (dbProfile: Tables<'profiles'>['Row']): UserProfile => {
  return {
    id: dbProfile.id,
    user_id: dbProfile.user_id,
    email: dbProfile.email,
    full_name: dbProfile.full_name,
    role: dbProfile.role,
    is_active: dbProfile.is_active,
    exp: dbProfile.exp,
    level: dbProfile.level,
    last_password_change: dbProfile.last_password_change,
    two_factor_enabled: dbProfile.two_factor_enabled,
    two_factor_secret: dbProfile.two_factor_secret,
    two_factor_backup_codes: dbProfile.two_factor_backup_codes,
    created_at: dbProfile.created_at,
    updated_at: dbProfile.updated_at
  };
};

/**
 * Mapeia session do Supabase para interface consolidada
 */
export const mapSupabaseSession = (dbSession: Tables<'user_sessions'>['Row']): UserSession => {
  return {
    id: dbSession.id,
    user_id: dbSession.user_id,
    session_token: dbSession.session_token,
    ip_address: dbSession.ip_address,
    user_agent: dbSession.user_agent,
    device_info: dbSession.device_info as Record<string, any> || {},
    is_active: dbSession.is_active,
    last_activity: dbSession.last_activity,
    expires_at: dbSession.expires_at,
    created_at: dbSession.created_at
  };
};