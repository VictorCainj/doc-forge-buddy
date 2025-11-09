/**
 * Data Transfer Objects para Usuários
 * Comunicação segura entre camadas da aplicação
 */

import { z } from 'zod';
import { UserRole } from '../shared/base';

// =============================================================================
// DTOs DE ENTRADA (CREATE/UPDATE)
// =============================================================================

/**
 * DTO para criação de usuário
 */
export interface CreateUserDTO {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  document?: string;
  documentType?: 'CPF' | 'CNPJ';
  role: UserRole;
  isActive: boolean;
  // Dados específicos do perfil
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

/**
 * DTO para atualização de usuário
 */
export interface UpdateUserDTO {
  id?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  document?: string;
  documentType?: 'CPF' | 'CNPJ';
  role?: UserRole;
  isActive?: boolean;
  exp?: number;
  level?: number;
  // Dados específicos do perfil
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  updatedAt: string;
}

// =============================================================================
// DTOs DE RESPOSTA (READ)
// =============================================================================

/**
 * DTO de resposta de usuário completo
 */
export interface UserResponseDTO {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  document?: string;
  documentType?: 'CPF' | 'CNPJ';
  role: UserRole;
  isActive: boolean;
  exp: number;
  level: number;
  // Dados do perfil
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  createdAt: string;
  updatedAt: string;
  // Campos calculados
  isOnline: boolean;
  lastActivity?: string;
  isVerified: boolean;
  daysSinceLastLogin?: number;
}

/**
 * DTO para listagem de usuários
 */
export interface UserListItemDTO {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastActivity?: string;
  createdAt: string;
  isOnline: boolean;
}

/**
 * DTO para busca de usuários
 */
export interface UserSearchDTO {
  query?: string;
  role?: UserRole;
  isActive?: boolean;
  isOnline?: boolean;
  city?: string;
  state?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// =============================================================================
// DTOs ESPECÍFICOS PARA FUNCIONALIDADES
// =============================================================================

/**
 * DTO para perfil público (dados que podem ser expostos)
 */
export interface PublicUserDTO {
  id: string;
  fullName: string;
  role: 'locatario' | 'locador' | 'admin';
  city?: string;
  state?: string;
  isVerified: boolean;
}

/**
 * DTO para dados de autenticação
 */
export interface AuthUserDTO {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

/**
 * DTO para estatísticas de usuário
 */
export interface UserStatsDTO {
  userId: string;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalProperties: number;
  activeProperties: number;
  lastActivity: string;
  joinDate: string;
  monthlyActivity: {
    month: string;
    activityCount: number;
  }[];
}

// =============================================================================
// SCHEMAS DE VALIDAÇÃO ZOD
// =============================================================================

/**
 * Schema para criação de usuário
 */
export const CreateUserSchema = z.object({
  email: z.string()
    .email('Email deve ter um formato válido')
    .min(5, 'Email deve ter pelo menos 5 caracteres')
    .max(254, 'Email deve ter no máximo 254 caracteres'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial')
    .optional(),
  fullName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve ter o formato (11) 99999-9999')
    .optional(),
  document: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Documento deve ter formato CPF (999.999.999-99) ou CNPJ (99.999.999/9999-99)')
    .optional(),
  documentType: z.enum(['CPF', 'CNPJ']).optional(),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean().default(true),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter o formato 00000-000')
    .optional(),
  birthDate: z.string().datetime().optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone de emergência deve ter o formato (11) 99999-9999')
    .optional()
}).refine(
  (data) => {
    if (data.document && !data.documentType) {
      return false;
    }
    return true;
  },
  { message: 'Tipo de documento é obrigatório quando documento é fornecido', path: ['documentType'] }
);

/**
 * Schema para atualização de usuário
 */
export const UpdateUserSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  email: z.string().email().min(5).max(254).optional(),
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
  document: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .optional(),
  documentType: z.enum(['CPF', 'CNPJ']).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  exp: z.number().int().min(0).optional(),
  level: z.number().int().min(0).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  birthDate: z.string().datetime().optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
  updatedAt: z.string().datetime('Data de atualização deve ser uma data válida')
}).refine(
  (data) => {
    if (data.document && !data.documentType) {
      return false;
    }
    return true;
  },
  { message: 'Tipo de documento é obrigatório quando documento é fornecido', path: ['documentType'] }
);

/**
 * Schema para busca de usuários
 */
export const UserSearchSchema = z.object({
  query: z.string().max(100).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional()
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserSearchInput = z.infer<typeof UserSearchSchema>;

// =============================================================================
// FUNÇÕES DE MAPEAMENTO
// =============================================================================

/**
 * Converte perfil de usuário para DTO de resposta
 */
export function userToResponseDTO(user: any): UserResponseDTO {
  return {
    id: user.id,
    userId: user.userId || user.user_id,
    email: user.email,
    fullName: user.fullName || user.full_name || '',
    phone: user.phone,
    document: user.document,
    documentType: user.documentType || user.document_type,
    role: user.role,
    isActive: user.isActive !== false,
    exp: user.exp || 0,
    level: user.level || 1,
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode || user.zip_code,
    birthDate: user.birthDate || user.birth_date,
    emergencyContact: user.emergencyContact || user.emergency_contact,
    emergencyPhone: user.emergencyPhone || user.emergency_phone,
    twoFactorEnabled: user.twoFactorEnabled || user.two_factor_enabled || false,
    lastPasswordChange: user.lastPasswordChange || user.last_password_change,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
    isOnline: user.isOnline || false,
    lastActivity: user.lastActivity || user.last_activity,
    isVerified: user.isVerified !== false,
    daysSinceLastLogin: user.daysSinceLastLogin
  };
}

/**
 * Converte usuário para item de lista
 */
export function userToListItemDTO(user: any): UserListItemDTO {
  return {
    id: user.id,
    userId: user.userId || user.user_id,
    email: user.email,
    fullName: user.fullName || user.full_name || '',
    role: user.role,
    isActive: user.isActive !== false,
    lastActivity: user.lastActivity || user.last_activity,
    createdAt: user.createdAt || user.created_at,
    isOnline: user.isOnline || false
  };
}

/**
 * Converte usuário para DTO público
 */
export function userToPublicDTO(user: any): PublicUserDTO {
  return {
    id: user.id,
    fullName: user.fullName || user.full_name || '',
    role: user.role === 'admin' ? 'admin' : 'locatario', // Ajustado para o tipo correto
    city: user.city,
    state: user.state,
    isVerified: user.isVerified !== false
  };
}

/**
 * Converte usuário para DTO de autenticação
 */
export function userToAuthDTO(user: any, permissions: string[] = []): AuthUserDTO {
  return {
    id: user.id,
    userId: user.userId || user.user_id,
    email: user.email,
    fullName: user.fullName || user.full_name || '',
    role: user.role,
    isActive: user.isActive !== false,
    twoFactorEnabled: user.twoFactorEnabled || user.two_factor_enabled || false,
    permissions,
    token: user.token,
    refreshToken: user.refreshToken,
    expiresAt: user.expiresAt
  };
}

/**
 * Converte DTO para entidade
 */
export function dtoToUserEntity(dto: CreateUserInput | UpdateUserInput): any {
  return {
    ...dto,
    exp: (dto as any).exp ? Number((dto as any).exp) : 0,
    level: (dto as any).level ? Number((dto as any).level) : 1
  };
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Valida e converte DTO de criação
 */
export function validateCreateUser(data: unknown): CreateUserInput {
  return CreateUserSchema.parse(data);
}

/**
 * Valida e converte DTO de atualização
 */
export function validateUpdateUser(data: unknown): UpdateUserInput {
  return UpdateUserSchema.parse(data);
}

/**
 * Valida e converte DTO de busca
 */
export function validateUserSearch(data: unknown): UserSearchInput {
  return UserSearchSchema.parse(data);
}

/**
 * Sanitiza dados sensíveis do usuário
 */
export function sanitizeUserData(user: any): Partial<UserResponseDTO> {
  const { password, twoFactorSecret, twoFactorBackupCodes, ...sanitized } = user;
  return sanitized;
}

/**
 * Formata nome completo
 */
export function formatFullName(user: UserResponseDTO): string {
  return user.fullName;
}

/**
 * Verifica se usuário tem permissão
 */
export function hasPermission(user: AuthUserDTO, permission: string): boolean {
  return user.permissions.includes(permission) || user.role === 'admin';
}

/**
 * Calcula dias desde último login
 */
export function calculateDaysSinceLastLogin(lastActivity?: string): number | undefined {
  if (!lastActivity) return undefined;
  
  const lastActivityDate = new Date(lastActivity);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastActivityDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Verifica se um objeto é um DTO de criação válido
 */
export function isCreateUserDTO(obj: any): obj is CreateUserDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.email === 'string' &&
    typeof obj.fullName === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.isActive === 'boolean'
  );
}

/**
 * Verifica se um objeto é um DTO de resposta válido
 */
export function isUserResponseDTO(obj: any): obj is UserResponseDTO {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.fullName === 'string' &&
    typeof obj.role === 'string'
  );
}

/**
 * Filtra usuários por critérios
 */
export function filterUsers(users: UserResponseDTO[], criteria: UserSearchInput): UserResponseDTO[] {
  return users.filter(user => {
    if (criteria.query && 
        !user.fullName.toLowerCase().includes(criteria.query.toLowerCase()) &&
        !user.email.toLowerCase().includes(criteria.query.toLowerCase())) {
      return false;
    }
    
    if (criteria.role && user.role !== criteria.role) return false;
    if (criteria.isActive !== undefined && user.isActive !== criteria.isActive) return false;
    if (criteria.isOnline !== undefined && user.isOnline !== criteria.isOnline) return false;
    if (criteria.city && user.city !== criteria.city) return false;
    if (criteria.state && user.state !== criteria.state) return false;
    
    if (criteria.createdAfter) {
      const createdAfter = new Date(criteria.createdAfter);
      const userCreated = new Date(user.createdAt);
      if (userCreated < createdAfter) return false;
    }
    
    if (criteria.createdBefore) {
      const createdBefore = new Date(criteria.createdBefore);
      const userCreated = new Date(user.createdAt);
      if (userCreated > createdBefore) return false;
    }
    
    return true;
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Schemas
  CreateUserSchema,
  UpdateUserSchema,
  UserSearchSchema,
  
  // Types
  CreateUserInput,
  UpdateUserInput,
  UserSearchInput,
  
  // Mappers
  userToResponseDTO,
  userToListItemDTO,
  userToPublicDTO,
  userToAuthDTO,
  dtoToUserEntity,
  
  // Validators
  validateCreateUser,
  validateUpdateUser,
  validateUserSearch,
  
  // Utilities
  sanitizeUserData,
  formatFullName,
  hasPermission,
  calculateDaysSinceLastLogin,
  filterUsers,
  
  // Type Guards
  isCreateUserDTO,
  isUserResponseDTO
};