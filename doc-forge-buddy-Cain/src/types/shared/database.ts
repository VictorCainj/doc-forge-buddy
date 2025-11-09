/**
 * Extensões de Database e Supabase
 * 
 * Este módulo contém tipos avançados para trabalhar com o Supabase,
 * incluindo query builders, types extensions e helpers para database.
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { UUID, LoadingState } from './base';

// ============================================================================
// TIPOS PRINCIPAIS DE TABELAS
// ============================================================================

/**
 * Tipos principais das tabelas do banco
 */
export type Profile = Tables<'profiles'>;
export type Contract = Tables<'contracts'>;
export type VistoriaAnalise = Tables<'vistoria_analises'>;
export type VistoriaImage = Tables<'vistoria_images'>;
export type Prestador = Tables<'prestadores'>;
export type AuditLog = Tables<'audit_logs'>;
export type UserSession = Tables<'user_sessions'>;
export type Notification = Tables<'notifications'>;
export type SavedTerm = Tables<'saved_terms'>;
export type PublicDocument = Tables<'public_documents'>;
export type Permission = Tables<'permissions'>;
export type RolePermission = Tables<'role_permissions'>;
export type UserPermission = Tables<'user_permissions'>;

/**
 * Tipos Insert das tabelas
 */
export type ProfileInsert = TablesInsert<'profiles'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type VistoriaAnaliseInsert = TablesInsert<'vistoria_analises'>;
export type VistoriaImageInsert = TablesInsert<'vistoria_images'>;
export type PrestadorInsert = TablesInsert<'prestadores'>;
export type AuditLogInsert = TablesInsert<'audit_logs'>;
export type UserSessionInsert = TablesInsert<'user_sessions'>;
export type NotificationInsert = TablesInsert<'notifications'>;
export type SavedTermInsert = TablesInsert<'saved_terms'>;
export type PublicDocumentInsert = TablesInsert<'public_documents'>;

/**
 * Tipos Update das tabelas
 */
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type ContractUpdate = TablesUpdate<'contracts'>;
export type VistoriaAnaliseUpdate = TablesUpdate<'vistoria_analises'>;
export type VistoriaImageUpdate = TablesUpdate<'vistoria_images'>;
export type PrestadorUpdate = TablesUpdate<'prestadores'>;
export type AuditLogUpdate = TablesUpdate<'audit_logs'>;
export type UserSessionUpdate = TablesUpdate<'user_sessions'>;
export type NotificationUpdate = TablesUpdate<'notifications'>;
export type SavedTermUpdate = TablesUpdate<'saved_terms'>;
export type PublicDocumentUpdate = TablesUpdate<'public_documents'>;

// ============================================================================
// ENUMS E TIPOS UNION
// ============================================================================

/**
 * Ações de auditoria
 */
export type AuditAction = Database['public']['Enums']['audit_action'];

/**
 * Ações de permissão
 */
export type PermissionAction = Database['public']['Enums']['permission_action'];

/**
 * Módulos do sistema
 */
export type SystemModule = Database['public']['Enums']['system_module'];

/**
 * Roles de usuário
 */
export type UserRole = Database['public']['Enums']['user_role'];

// ============================================================================
// QUERY BUILDERS E HELPERS
// ============================================================================

/**
 * Parâmetros base para queries
 */
export interface BaseQueryParams {
  /** Limite de resultados */
  limit?: number;
  /** Offset para paginação */
  offset?: number;
  /** Campo para ordenação */
  orderBy?: string;
  /** Direção da ordenação */
  orderDirection?: 'asc' | 'desc';
  /** Filtros da query */
  filters?: Record<string, unknown>;
}

/**
 * Parâmetros para queries de busca
 */
export interface SearchQueryParams extends BaseQueryParams {
  /** Texto de busca */
  search?: string;
  /** Campos para buscar */
  searchFields?: string[];
  /** Match mode */
  searchMode?: 'exact' | 'partial' | 'fuzzy';
  /** Relevância mínima (para busca fuzzy) */
  minRelevance?: number;
}

/**
 * Parâmetros para paginação
 */
export interface PaginationParams {
  /** Página atual (1-based) */
  page: number;
  /** Itens por página */
  pageSize: number;
  /** Total de itens (opcional) */
  total?: number;
}

/**
 * Resultado de query com paginação
 */
export interface PaginatedResult<T> {
  /** Dados da página */
  data: T[];
  /** Metadados da paginação */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  /** Metadados extras */
  meta?: Record<string, unknown>;
}

// ============================================================================
// REPOSITORY PATTERNS
// ============================================================================

/**
 * Interface base para repositories
 */
export interface BaseRepository<T, InsertT, UpdateT> {
  /** Busca por ID */
  findById(id: UUID): Promise<T | null>;
  /** Busca todos com filtros */
  findMany(params?: BaseQueryParams): Promise<PaginatedResult<T>>;
  /** Busca por texto */
  search(params: SearchQueryParams): Promise<PaginatedResult<T>>;
  /** Cria novo registro */
  create(data: InsertT): Promise<T>;
  /** Atualiza registro */
  update(id: UUID, data: UpdateT): Promise<T>;
  /** Remove registro */
  delete(id: UUID): Promise<void>;
  /** Conta registros */
  count(filters?: Record<string, unknown>): Promise<number>;
  /** Verifica se existe */
  exists(filters: Record<string, unknown>): Promise<boolean>;
}

/**
 * Repository específico para profiles
 */
export interface ProfileRepository extends BaseRepository<Profile, ProfileInsert, ProfileUpdate> {
  /** Busca por email */
  findByEmail(email: string): Promise<Profile | null>;
  /** Busca por role */
  findByRole(role: UserRole): Promise<PaginatedResult<Profile>>;
  /** Busca usuários ativos */
  findActive(): Promise<PaginatedResult<Profile>>;
  /** Atualiza último login */
  updateLastLogin(userId: UUID): Promise<void>;
}

/**
 * Repository específico para contratos
 */
export interface ContractRepository extends BaseRepository<Contract, ContractInsert, ContractUpdate> {
  /** Busca por locatário */
  findByLocatario(nome: string): Promise<PaginatedResult<Contract>>;
  /** Busca por proprietário */
  findByProprietario(nome: string): Promise<PaginatedResult<Contract>>;
  /** Busca por status */
  findByStatus(status: string): Promise<PaginatedResult<Contract>>;
  /** Busca contratos próximos ao vencimento */
  findExpiring(days: number): Promise<Contract[]>;
  /** Busca estatísticas */
  getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    pending: number;
  }>;
}

/**
 * Repository específico para vistorias
 */
export interface VistoriaRepository extends BaseRepository<VistoriaAnalise, VistoriaAnaliseInsert, VistoriaAnaliseUpdate> {
  /** Busca por contrato */
  findByContract(contractId: UUID): Promise<PaginatedResult<VistoriaAnalise>>;
  /** Busca vistorias com imagens */
  findWithImages(): Promise<VistoriaAnalise[]>;
  /** Busca estatísticas */
  getStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    withIssues: number;
  }>;
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

/**
 * Resultado de operação do service
 */
export interface ServiceResult<T> {
  /** Dados de retorno */
  data: T;
  /** Se foi bem-sucedido */
  success: boolean;
  /** Mensagem de feedback */
  message?: string;
  /** Erros específicos */
  errors?: string[];
  /** Metadados */
  meta?: Record<string, unknown>;
}

/**
 * Service com cache
 */
export interface CacheableService<T> {
  /** Busca com cache */
  getCached(key: string): Promise<T | null>;
  /** Define cache */
  setCache(key: string, data: T, ttl?: number): Promise<void>;
  /** Remove do cache */
  invalidateCache(key: string): Promise<void>;
  /** Limpa todo o cache */
  clearCache(): Promise<void>;
  /** Força refresh */
  refresh(key: string): Promise<T>;
}

/**
 * Service com auditoria
 */
export interface AuditableService {
  /** Registra ação de auditoria */
  logAudit(
    action: AuditAction,
    entityType: string,
    entityId?: UUID,
    oldData?: unknown,
    newData?: unknown
  ): Promise<void>;
  /** Busca logs de auditoria */
  getAuditLogs(params: {
    userId?: UUID;
    entityType?: string;
    entityId?: UUID;
    action?: AuditAction;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<PaginatedResult<AuditLog>>;
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Configuração de transação
 */
export interface TransactionConfig {
  /** Timeout da transação (ms) */
  timeout?: number;
  /** Nível de isolamento */
  isolation?: 'read-committed' | 'repeatable-read' | 'serializable';
  /** Retry automático em caso de conflito */
  retryOnConflict?: boolean;
  /** Número máximo de tentativas */
  maxRetries?: number;
}

/**
 * Resultado de transação
 */
export interface TransactionResult<T> {
  /** Dados retornados */
  data: T;
  /** ID da transação */
  transactionId: string;
  /** Duração da transação */
  duration: number;
  /** Se foi bem-sucedida */
  success: boolean;
}

/**
 * Runner de transação
 */
export interface TransactionRunner {
  /** Executa operação em transação */
  run<T>(
    operation: (client: any) => Promise<T>,
    config?: TransactionConfig
  ): Promise<TransactionResult<T>>;
  /** Executa múltiplas operações em sequência */
  runBatch<T>(
    operations: Array<(client: any) => Promise<T>>,
    config?: TransactionConfig
  ): Promise<TransactionResult<T[]>>;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Configuração de subscription real-time
 */
export interface RealtimeConfig {
  /** Canal da subscription */
  channel: string;
  /** Eventos para escutar */
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  /** Filtros específicos */
  filter?: string;
  /** Callback de mudança */
  onChange: (payload: any) => void;
  /** Callback de erro */
  onError?: (error: Error) => void;
  /** Callback de status */
  onStatus?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED') => void;
}

/**
 * Subscription manager
 */
export interface SubscriptionManager {
  /** Cria nova subscription */
  subscribe<T>(config: RealtimeConfig): () => void;
  /** Remove todas as subscriptions */
  unsubscribeAll(): void;
  /** Status das subscriptions */
  getStatus(): Record<string, 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>;
  /** Reconecta todas as subscriptions */
  reconnectAll(): void;
}

// ============================================================================
// BACKUP E MIGRATION
// ============================================================================

/**
 * Configuração de backup
 */
export interface BackupConfig {
  /** Nome do backup */
  name: string;
  /** Tabelas para incluir */
  tables?: string[];
  /** Tabelas para excluir */
  excludeTables?: string[];
  /** Formato de saída */
  format: 'json' | 'csv' | 'sql';
  /** Comprimir resultado */
  compress?: boolean;
  /** Incluir metadados */
  includeMetadata?: boolean;
}

/**
 * Status de migração
 */
export interface MigrationStatus {
  /** ID da migração */
  id: string;
  /** Nome da migração */
  name: string;
  /** Status atual */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  /** Data de início */
  startedAt: string;
  /** Data de conclusão */
  completedAt?: string;
  /** Erro (se houver) */
  error?: string;
  /** Progresso (0-100) */
  progress: number;
}

// ============================================================================
// SECURITY E RLS
// ============================================================================

/**
 * Política RLS
 */
export interface RLSPolicy {
  /** Nome da política */
  name: string;
  /** Tabela aplicável */
  table: string;
  /** Tipo de operação */
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  /** Usar WITH CHECK */
  using?: string;
  /** Restrições WITH CHECK */
  withCheck?: string;
  /** Roles afetados */
  roles?: string[];
}

/**
 * Permissão de usuário
 */
export interface UserPermission {
  /** ID do usuário */
  userId: UUID;
  /** Recurso */
  resource: string;
  /** Ação */
  action: string;
  /** Se está grantada */
  granted: boolean;
  /** Data de expiração */
  expiresAt?: string;
  /** Permissão por role */
  byRole?: boolean;
}

// ============================================================================
// VALIDATION E CONSTRAINTS
// ============================================================================

/**
 * Validação de constraint
 */
export interface ConstraintValidation {
  /** Nome do constraint */
  name: string;
  /** Tabela aplicável */
  table: string;
  /** Tipo de validação */
  type: 'check' | 'unique' | 'foreign_key' | 'not_null' | 'default';
  /** Expressão SQL */
  expression?: string;
  /** Mensagem de erro */
  errorMessage: string;
  /** Severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  /** Se é válido */
  valid: boolean;
  /** Erros encontrados */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Informações extras */
  info?: Record<string, unknown>;
}

// ============================================================================
// MONITORING E PERFORMANCE
// ============================================================================

/**
 * Métrica de performance
 */
export interface PerformanceMetric {
  /** Nome da métrica */
  name: string;
  /** Valor da métrica */
  value: number;
  /** Unidade */
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  /** Tags para categorização */
  tags?: Record<string, string>;
  /** Timestamp */
  timestamp: string;
  /** Contexto adicional */
  context?: Record<string, unknown>;
}

/**
 * Health check
 */
export interface HealthCheck {
  /** Nome do serviço */
  service: string;
  /** Status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Tempo de resposta */
  responseTime?: number;
  /** Última verificação */
  lastCheck: string;
  /** Detalhes do status */
  details?: Record<string, unknown>;
  /** Erro (se houver) */
  error?: string;
}

// ============================================================================
// HELPERS E UTILITÁRIOS
// ============================================================================

/**
 * Converte tipos de banco para tipos da aplicação
 */
export type DatabaseToApp<T extends keyof Database['public']['Tables']> = {
  [K in Database['public']['Tables'][T]['Row']]: Database['public']['Tables'][T]['Row'][K];
};

/**
 * Converte tipos de insert para types de aplicação
 */
export type InsertToApp<T extends keyof Database['public']['Tables']> = {
  [K in Database['public']['Tables'][T]['Insert']]: Database['public']['Tables'][T]['Insert'][K];
};

/**
 * Helper para criar filtros de query
 */
export const createQueryFilters = (filters: Record<string, unknown>) => {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);
};

/**
 * Helper para paginação
 */
export const createPaginationParams = (page: number, pageSize: number) => {
  const offset = (page - 1) * pageSize;
  return { limit: pageSize, offset };
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Tables
  Profile,
  Contract,
  VistoriaAnalise,
  VistoriaImage,
  Prestador,
  AuditLog,
  UserSession,
  Notification,
  SavedTerm,
  PublicDocument,
  Permission,
  RolePermission,
  UserPermission,
  
  // Inserts
  ProfileInsert,
  ContractInsert,
  VistoriaAnaliseInsert,
  VistoriaImageInsert,
  PrestadorInsert,
  AuditLogInsert,
  UserSessionInsert,
  NotificationInsert,
  SavedTermInsert,
  PublicDocumentInsert,
  
  // Updates
  ProfileUpdate,
  ContractUpdate,
  VistoriaAnaliseUpdate,
  VistoriaImageUpdate,
  PrestadorUpdate,
  AuditLogUpdate,
  UserSessionUpdate,
  NotificationUpdate,
  SavedTermUpdate,
  PublicDocumentUpdate,
  
  // Enums
  AuditAction,
  PermissionAction,
  SystemModule,
  UserRole,
  
  // Query
  BaseQueryParams,
  SearchQueryParams,
  PaginationParams,
  PaginatedResult,
  
  // Repository
  BaseRepository,
  ProfileRepository,
  ContractRepository,
  VistoriaRepository,
  
  // Service
  ServiceResult,
  CacheableService,
  AuditableService,
  
  // Transaction
  TransactionConfig,
  TransactionResult,
  TransactionRunner,
  
  // Real-time
  RealtimeConfig,
  SubscriptionManager,
  
  // Backup/Migration
  BackupConfig,
  MigrationStatus,
  
  // Security
  RLSPolicy,
  UserPermission,
  
  // Validation
  ConstraintValidation,
  ValidationResult,
  
  // Monitoring
  PerformanceMetric,
  HealthCheck
};

export {
  createQueryFilters,
  createPaginationParams,
  DatabaseToApp,
  InsertToApp
};

export default {};