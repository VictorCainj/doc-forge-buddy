/**
 * Validação e Schemas Zod
 * 
 * Este módulo contém schemas de validação, regras e tipos de formulário
 * usando Zod para validação runtime e integração com React Hook Form.
 */

import { z } from 'zod';
import type { BaseFormData } from './base';
import type { UserRole, AuditAction, PermissionAction, SystemModule } from './base';

// ============================================================================
// SCHEMAS PRIMITIVOS
// ============================================================================

/**
 * Schema para UUID
 */
export const uuidSchema = z.string().uuid('ID deve ser um UUID válido');

/**
 * Schema para email
 */
export const emailSchema = z
  .string()
  .email('Email deve ter um formato válido')
  .min(5, 'Email deve ter pelo menos 5 caracteres')
  .max(254, 'Email deve ter no máximo 254 caracteres');

/**
 * Schema para senha
 */
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

/**
 * Schema para telefone brasileiro
 */
export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve ter o formato (11) 99999-9999');

/**
 * Schema para CPF
 */
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve ter o formato 999.999.999-99');

/**
 * Schema para CNPJ
 */
export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve ter o formato 99.999.999/9999-99');

// ============================================================================
// SCHEMAS DE ENUMS
// ============================================================================

/**
 * Schema para roles de usuário
 */
export const userRoleSchema = z.enum(['admin', 'user']);

/**
 * Schema para ações de auditoria
 */
export const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE', 
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_RESET',
  'BULK_UPDATE',
  'BULK_DELETE',
  'EXPORT',
  'IMPORT',
  'PERMISSION_CHANGE',
  'ROLE_CHANGE',
  'STATUS_CHANGE'
]);

/**
 * Schema para ações de permissão
 */
export const permissionActionSchema = z.enum([
  'view',
  'create',
  'update', 
  'delete',
  'export',
  'import',
  'bulk_edit',
  'manage_permissions'
]);

/**
 * Schema para módulos do sistema
 */
export const systemModuleSchema = z.enum([
  'users',
  'contracts',
  'prestadores',
  'vistorias',
  'documents',
  'reports',
  'audit',
  'settings',
  'admin'
]);

/**
 * Schema para status
 */
export const statusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled']);

/**
 * Schema para prioridade
 */
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// ============================================================================
// SCHEMAS DE ENTIDADES
// ============================================================================

/**
 * Schema base para entidades
 */
export const baseEntitySchema = z.object({
  id: uuidSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  user_id: uuidSchema.nullable().optional()
});

/**
 * Schema para dados de formulário base
 */
export const baseFormDataSchema = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined()
  ])
);

// ============================================================================
// SCHEMAS DE USUÁRIO
// ============================================================================

/**
 * Schema para criação de usuário
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
  full_name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: userRoleSchema.default('user')
});

/**
 * Schema para atualização de usuário
 */
export const updateUserSchema = z.object({
  id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
  email: emailSchema.optional(),
  full_name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
  exp: z.number().min(0).optional(),
  level: z.number().min(0).optional()
});

/**
 * Schema para filtros de usuário
 */
export const userFiltersSchema = z.object({
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  email: z.string().optional()
});

// ============================================================================
// SCHEMAS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
});

/**
 * Schema para mudança de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

/**
 * Schema para reset de senha
 */
export const resetPasswordSchema = z.object({
  email: emailSchema
});

// ============================================================================
// SCHEMAS DE CONTRATO
// ============================================================================

/**
 * Schema para contrato
 */
export const contractSchema = z.object({
  id: uuidSchema.optional(),
  numero_contrato: z.string().min(1, 'Número do contrato é obrigatório'),
  nome_locatario: z.string().min(1, 'Nome do locatário é obrigatório'),
  nome_proprietario: z.string().min(1, 'Nome do proprietário é obrigatório'),
  email_proprietario: emailSchema,
  endereco_imovel: z.string().min(1, 'Endereço do imóvel é obrigatório'),
  data_inicio_desocupacao: z.string().min(1, 'Data de início é obrigatória'),
  data_termino_desocupacao: z.string().min(1, 'Data de término é obrigatória'),
  data_comunicacao: z.string().min(1, 'Data de comunicação é obrigatória'),
  prazo_dias: z.string().min(1, 'Prazo em dias é obrigatório')
});

/**
 * Schema para filtros de contrato
 */
export const contractFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'expired', 'pending', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  locatario: z.string().optional(),
  proprietario: z.string().optional()
});

// ============================================================================
// SCHEMAS DE VISTORIA
// ============================================================================

/**
 * Schema para vistoria
 */
export const vistoriaSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  contract_id: uuidSchema.optional(),
  dados_vistoria: z.record(z.unknown()),
  apontamentos: z.record(z.unknown()).optional(),
  public_document_id: uuidSchema.optional()
});

/**
 * Schema para filtros de vistoria
 */
export const vistoriaFiltersSchema = z.object({
  search: z.string().optional(),
  contract_id: uuidSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

// ============================================================================
// SCHEMAS DE PRESTADOR
// ============================================================================

/**
 * Schema para prestador de serviço
 */
export const prestadorSchema = z.object({
  id: uuidSchema.optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: emailSchema.optional(),
  telefone: phoneSchema.optional(),
  cnpj: cnpjSchema.optional(),
  endereco: z.string().optional(),
  especialidade: z.string().optional(),
  observacoes: z.string().optional()
});

/**
 * Schema para filtros de prestador
 */
export const prestadorFiltersSchema = z.object({
  search: z.string().optional(),
  especialidade: z.string().optional(),
  is_active: z.boolean().optional()
});

// ============================================================================
// SCHEMAS DE AUDITORIA
// ============================================================================

/**
 * Schema para log de auditoria
 */
export const auditLogSchema = z.object({
  id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
  action: auditActionSchema,
  entity_type: z.string().min(1, 'Tipo de entidade é obrigatório'),
  entity_id: uuidSchema.optional(),
  old_data: z.record(z.unknown()).nullable().optional(),
  new_data: z.record(z.unknown()).nullable().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

/**
 * Schema para filtros de auditoria
 */
export const auditFiltersSchema = z.object({
  user_id: uuidSchema.optional(),
  action: auditActionSchema.optional(),
  entity_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional()
});

// ============================================================================
// SCHEMAS DE NOTIFICAÇÃO
// ============================================================================

/**
 * Schema para notificação
 */
export const notificationSchema = z.object({
  id: uuidSchema.optional(),
  user_id: uuidSchema,
  type: z.string().min(1, 'Tipo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  metadata: z.record(z.unknown()).default({}),
  read: z.boolean().default(false),
  read_at: z.string().datetime().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

// ============================================================================
// SCHEMAS DE ARQUIVO
// ============================================================================

/**
 * Schema para upload de arquivo
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  name: z.string().optional(),
  type: z.string().optional(),
  size: z.number().optional()
});

// ============================================================================
// VALIDADORES UTILITÁRIOS
// ============================================================================

/**
 * Validador de CPF
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Validação básica de dígitos repetidos
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  return digit === parseInt(cleaned.charAt(10));
};

/**
 * Validador de CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  
  // Validação básica
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

// ============================================================================
// TYPES INFERIDOS DOS SCHEMAS
// ============================================================================

// Tipos TypeScript inferidos dos schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type VistoriaInput = z.infer<typeof vistoriaSchema>;
export type PrestadorInput = z.infer<typeof prestadorSchema>;
export type AuditLogInput = z.infer<typeof auditLogSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;

// Tipos de filtros
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type ContractFilters = z.infer<typeof contractFiltersSchema>;
export type VistoriaFilters = z.infer<typeof vistoriaFiltersSchema>;
export type PrestadorFilters = z.infer<typeof prestadorFiltersSchema>;
export type AuditFilters = z.infer<typeof auditFiltersSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Primitivos
  uuidSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  cpfSchema,
  cnpjSchema,
  
  // Enums
  userRoleSchema,
  auditActionSchema,
  permissionActionSchema,
  systemModuleSchema,
  statusSchema,
  prioritySchema,
  
  // Entidades
  baseEntitySchema,
  baseFormDataSchema,
  
  // Usuário
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  
  // Autenticação
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  
  // Negócio
  contractSchema,
  contractFiltersSchema,
  vistoriaSchema,
  vistoriaFiltersSchema,
  prestadorSchema,
  prestadorFiltersSchema,
  
  // Sistema
  auditLogSchema,
  auditFiltersSchema,
  notificationSchema,
  fileUploadSchema,
  
  // Utilitários
  validateCPF,
  validateCNPJ
};