/**
 * Biblioteca de Tipos Compartilhados
 * 
 * Este é o ponto de entrada principal para todos os tipos compartilhados
 * da aplicação. Esta biblioteca fornece uma base sólida e consistente
 * para o desenvolvimento em TypeScript.
 * 
 * ## Estrutura:
 * 
 * - **base.ts**: Tipos fundamentais, entidades, API responses, erros
 * - **validation.ts**: Schemas Zod, validações, tipos de formulário
 * - **events.ts**: Eventos da aplicação, interações, sistema
 * - **ui.ts**: Props de componentes, tema, acessibilidade
 * - **database.ts**: Extensões Supabase, queries, repositories
 * - **audit.ts**: Tipos de auditoria e logging
 * - **user.ts**: Tipos de usuário e autenticação
 * 
 * ## Como usar:
 * 
 * ```typescript
 * // Importar tipos específicos
 * import type { UserProfile, Contract } from '@/types/shared';
 * 
 * // Importar schemas de validação
 * import { createUserSchema, contractSchema } from '@/types/shared';
 * 
 * // Importar helpers
 * import { EventFactory, createPaginationParams } from '@/types/shared';
 * ```
 */

// =============================================================================
// EXPORTS PRINCIPAIS
// =============================================================================

// Base types
export * from './base';

// Validation types
export * from './validation';

// Events types
export * from './events';

// UI types
export * from './ui';

// Database types
export * from './database';

// Existing shared types
export * from './audit';
export * from './user';

// =============================================================================
// RE-EXPORTS ESPECÍFICOS MAIS UTILIZADOS
// =============================================================================

// Common types
export type {
  Status,
  Priority,
  LoadingState,
  CrudOperation,
  ToastVariant,
  AuditAction,
  UserRole,
  PermissionAction,
  SystemModule,
  VistoriaType,
  PersonType,
  ContractStatus,
  BaseEntity,
  BaseFormData,
  SupabaseJson,
  DatabaseJson,
  Optional,
  RequiredFields,
  DeepPartial
} from './base';

// Validation schemas
export {
  uuidSchema,
  emailSchema,
  passwordSchema,
  createUserSchema,
  contractSchema,
  loginSchema,
  validateCPF,
  validateCNPJ
} from './validation';

// Event helpers
export { EventFactory } from './events';

// UI component props
export type {
  ButtonProps,
  InputProps,
  CardProps,
  ModalProps,
  TableProps,
  FormProps,
  ThemeConfig as UIThemeConfig
} from './ui';

// Database types
export type {
  Profile,
  Contract,
  VistoriaAnalise,
  UserSession,
  PaginatedResult,
  BaseRepository
} from './database';

// =============================================================================
// UTILITÁRIOS GLOBAIS
// =============================================================================

/**
 * Verifica se o código está executando no browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Verifica se o código está executando no servidor
 */
export const isServer = !isBrowser;

/**
 * Type guard para verificar se um valor é um UUID
 */
export const isUUID = (value: unknown): value is string => {
  return typeof value === 'string' && 
         /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Type guard para verificar se um valor é um email válido
 */
export const isEmail = (value: unknown): value is string => {
  return typeof value === 'string' && 
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/**
 * Type guard para verificar se um valor é uma data ISO válida
 */
export const isISODate = (value: unknown): value is string => {
  return typeof value === 'string' && 
         !isNaN(Date.parse(value)) && 
         value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
};

// =============================================================================
// CONFIGURAÇÕES PADRÃO
// =============================================================================

/**
 * Valores padrão para paginação
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100
} as const;

/**
 * Status padrão para entidades
 */
export const DEFAULT_STATUS = {
  active: true,
  inactive: false
} as const;

/**
 * Limites do sistema
 */
export const SYSTEM_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxNameLength: 100,
  maxEmailLength: 254,
  maxPasswordLength: 255,
  maxDescriptionLength: 1000,
  maxSearchResults: 1000,
  defaultPageSize: 20,
  maxPageSize: 100
} as const;

// =============================================================================
// METADATA
// =============================================================================

/**
 * Versão da biblioteca
 */
export const SHARED_TYPES_VERSION = '1.0.0';

/**
 * Metadata da biblioteca
 */
export const LIBRARY_METADATA = {
  name: '@doc-forge-buddy/shared-types',
  version: SHARED_TYPES_VERSION,
  description: 'Biblioteca centralizada de tipos TypeScript para Doc Forge Buddy',
  keywords: [
    'typescript',
    'types',
    'zod',
    'validation',
    'supabase',
    'react',
    'ui',
    'database',
    'events'
  ],
  engines: {
    node: '>=18.0.0',
    typescript: '>=5.0.0'
  }
} as const;

export default {
  version: SHARED_TYPES_VERSION,
  metadata: LIBRARY_METADATA,
  defaults: {
    pagination: DEFAULT_PAGINATION,
    status: DEFAULT_STATUS,
    limits: SYSTEM_LIMITS
  },
  helpers: {
    isUUID,
    isEmail,
    isISODate,
    isBrowser,
    isServer
  }
};