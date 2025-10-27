/**
 * Tipos relacionados à administração do sistema
 */

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  exp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

/**
 * Tipos para estatísticas do sistema
 */
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPrestadores: number;
  totalVistorias: number;
  totalDocuments: number;
}

/**
 * Filtros para listagem de usuários
 */
export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
}

/**
 * Tipos para Sessões
 */
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, any>;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
  is_current?: boolean;
}

/**
 * Tipos para Sistema de Permissões
 */
export type SystemModule =
  | 'users'
  | 'contracts'
  | 'prestadores'
  | 'vistorias'
  | 'documents'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'admin';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'bulk_edit'
  | 'manage_permissions';

export interface Permission {
  id: string;
  module: SystemModule;
  action: PermissionAction;
  name: string;
  description: string;
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

/**
 * Tipos para Segurança
 */
export interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface PasswordChange {
  user_id: string;
  last_password_change: string;
}

/**
 * Estatísticas expandidas do sistema
 */
export interface ExtendedSystemStats extends SystemStats {
  totalSessions: number;
  activeSessions: number;
  failedLoginAttempts: number;
  auditLogsCount: number;
  integrityIssues: number;
}
