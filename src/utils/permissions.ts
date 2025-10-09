import { UserProfile } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';

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
}

export interface UserPermission {
  module: SystemModule;
  action: PermissionAction;
  name: string;
  description: string;
  granted_by_role: boolean;
  custom_grant: boolean;
  expires_at: string | null;
}

/**
 * Verifica se o usuário é administrador
 */
export const isAdmin = (profile: UserProfile | null): boolean => {
  return profile?.role === 'admin';
};

/**
 * Verifica se o usuário pode gerenciar outros usuários
 */
export const canManageUsers = (profile: UserProfile | null): boolean => {
  return isAdmin(profile);
};

/**
 * Verifica se o usuário pode realizar edição em massa
 */
export const canBulkEdit = (profile: UserProfile | null): boolean => {
  return isAdmin(profile);
};

/**
 * Verifica se o usuário está ativo
 */
export const isActiveUser = (profile: UserProfile | null): boolean => {
  return profile?.is_active === true;
};

/**
 * Verifica se o usuário tem permissão e está ativo
 */
export const hasPermissionAndActive = (
  profile: UserProfile | null
): boolean => {
  return isAdmin(profile) && isActiveUser(profile);
};

/**
 * Verifica se o usuário tem uma permissão específica
 */
export const hasPermission = async (
  userId: string,
  module: SystemModule,
  action: PermissionAction
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('user_has_permission', {
      p_user_id: userId,
      p_module: module,
      p_action: action,
    });

    if (error) throw error;
    return data as boolean;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
};

/**
 * Obter todas as permissões de um usuário
 */
export const getUserPermissions = async (
  userId: string
): Promise<UserPermission[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (error) throw error;
    return (data as UserPermission[]) || [];
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    return [];
  }
};

/**
 * Verificar múltiplas permissões de uma vez
 */
export const hasAnyPermission = async (
  userId: string,
  permissions: Array<{ module: SystemModule; action: PermissionAction }>
): Promise<boolean> => {
  try {
    const checks = await Promise.all(
      permissions.map((perm) => hasPermission(userId, perm.module, perm.action))
    );
    return checks.some((result) => result === true);
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return false;
  }
};

/**
 * Verificar se o usuário tem todas as permissões especificadas
 */
export const hasAllPermissions = async (
  userId: string,
  permissions: Array<{ module: SystemModule; action: PermissionAction }>
): Promise<boolean> => {
  try {
    const checks = await Promise.all(
      permissions.map((perm) => hasPermission(userId, perm.module, perm.action))
    );
    return checks.every((result) => result === true);
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return false;
  }
};

/**
 * Cache de permissões em memória (performance)
 */
const permissionsCache = new Map<
  string,
  { permissions: UserPermission[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obter permissões com cache
 */
export const getUserPermissionsCached = async (
  userId: string
): Promise<UserPermission[]> => {
  const cached = permissionsCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  const permissions = await getUserPermissions(userId);
  permissionsCache.set(userId, { permissions, timestamp: now });

  return permissions;
};

/**
 * Limpar cache de permissões
 */
export const clearPermissionsCache = (userId?: string) => {
  if (userId) {
    permissionsCache.delete(userId);
  } else {
    permissionsCache.clear();
  }
};
