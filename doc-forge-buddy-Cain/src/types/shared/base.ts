/**
 * Tipos fundamentais do sistema
 * Tipos base reutilizados em toda aplicação
 */

import { Json } from '@/integrations/supabase/types';

// =============================================================================
// TIPOS PRIMITIVOS CONSOLIDADOS
// =============================================================================

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list';
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

// =============================================================================
// ENUMS DO SISTEMA
// =============================================================================

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  BULK_EDIT = 'bulk_edit',
  MANAGE_PERMISSIONS = 'manage_permissions'
}

export enum SystemModule {
  USERS = 'users',
  CONTRACTS = 'contracts',
  PRESTADORES = 'prestadores',
  VISTORIAS = 'vistorias',
  DOCUMENTS = 'documents',
  REPORTS = 'reports',
  AUDIT = 'audit',
  SETTINGS = 'settings',
  ADMIN = 'admin'
}

export enum VistoriaType {
  INICIAL = 'inicial',
  FINAL = 'final',
  VISTORIA = 'vistoria',
  REVISTORIA = 'revistoria',
  NAO_REALIZADA = 'nao_realizada'
}

export enum PersonType {
  LOCADOR = 'locador',
  LOCATARIO = 'locatario'
}

export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

// =============================================================================
// INTERFACES BASE
// =============================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface BaseFormData {
  [key: string]: string | number | boolean | null | undefined;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type SupabaseJson = Json;
export type DatabaseJson = Json;

// =============================================================================
// HELPERS PARA SUPABASE
// =============================================================================

/**
 * Converte dados para formato JSON do Supabase
 */
export const toSupabaseJson = <T>(data: T): SupabaseJson => {
  return JSON.parse(JSON.stringify(data)) as SupabaseJson;
};

/**
 * Converte JSON do Supabase para tipo específico
 */
export const fromSupabaseJson = <T>(json: SupabaseJson): T => {
  return json as T;
};

/**
 * Limpa payload removendo campos undefined
 * Evita problemas com políticas RLS do Supabase
 */
export const cleanPayload = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const hasProperty = <T extends Record<string, unknown>, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> => {
  return prop in obj;
};