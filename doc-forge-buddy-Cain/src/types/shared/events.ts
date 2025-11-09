/**
 * Eventos da Aplicação
 * 
 * Este módulo contém os tipos para eventos do sistema, interações de usuário
 * e eventos de negócio para uso com EventEmitter, Zustand stores ou Context API.
 */

import type { UUID } from './base';
import type { UserRole, AuditAction } from './base';
import type { UserFilters, ContractFilters, VistoriaFilters, PrestadorFilters, AuditFilters } from './validation';

// ============================================================================
// TIPOS BASE DE EVENTOS
// ============================================================================

/**
 * Interface base para todos os eventos
 */
export interface BaseEvent {
  /** Identificador único do evento */
  id: UUID;
  /** Timestamp do evento */
  timestamp: string;
  /** ID do usuário que disparou o evento (quando aplicável) */
  userId?: UUID;
  /** Sessão do usuário */
  sessionId?: UUID;
  /** Contexto adicional do evento */
  context?: Record<string, unknown>;
}

/**
 * Tipos de origem do evento
 */
export type EventSource = 'user' | 'system' | 'api' | 'websocket' | 'timer';

/**
 * Níveis de prioridade do evento
 */
export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

// ============================================================================
// EVENTOS DE AUTENTICAÇÃO
// ============================================================================

/**
 * Eventos de login/logout
 */
export interface AuthEvent extends BaseEvent {
  type: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'session_expired';
  email?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Eventos de mudança de senha
 */
export interface PasswordChangeEvent extends BaseEvent {
  type: 'password_changed' | 'password_change_failed';
  userId: UUID;
  reason: 'user_initiated' | 'admin_reset' | 'security_breach';
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// EVENTOS DE NAVEGAÇÃO
// ============================================================================

/**
 * Eventos de navegação de página
 */
export interface NavigationEvent extends BaseEvent {
  type: 'page_view' | 'route_change';
  from: string;
  to: string;
  method: 'click' | 'direct' | 'back' | 'forward';
  referrer?: string;
  pageTitle?: string;
}

/**
 * Eventos de ação do usuário
 */
export interface UserActionEvent extends BaseEvent {
  type: 'button_click' | 'form_submit' | 'search' | 'filter' | 'sort';
  elementId?: string;
  elementText?: string;
  formId?: string;
  searchQuery?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EVENTOS DE FORMULÁRIO
// ============================================================================

/**
 * Eventos de formulário
 */
export interface FormEvent extends BaseEvent {
  type: 'form_start' | 'form_submit' | 'form_error' | 'form_validation_error';
  formId: string;
  formName?: string;
  fields?: string[];
  errors?: Record<string, string[]>;
  duration?: number; // em milliseconds
}

// ============================================================================
// EVENTOS DE DADOS
// ============================================================================

/**
 * Eventos de CRUD de entidades
 */
export interface DataEvent extends BaseEvent {
  type: 'create' | 'read' | 'update' | 'delete' | 'list';
  entity: string; // 'contract', 'vistoria', 'prestador', etc.
  entityId?: UUID;
  method: 'manual' | 'api' | 'import' | 'bulk';
  success: boolean;
  dataCount?: number; // para list/create
  errorMessage?: string;
}

/**
 * Eventos de sincronização de dados
 */
export interface SyncEvent extends BaseEvent {
  type: 'sync_start' | 'sync_success' | 'sync_error' | 'sync_conflict';
  source: 'supabase' | 'local' | 'external';
  tables?: string[];
  recordsCount?: number;
  conflicts?: number;
  errorDetails?: string;
}

// ============================================================================
// EVENTOS DE ARQUIVO
// ============================================================================

/**
 * Eventos de upload/download
 */
export interface FileEvent extends BaseEvent {
  type: 'file_upload' | 'file_download' | 'file_delete' | 'file_error';
  fileName: string;
  fileSize: number;
  fileType: string;
  fileId?: UUID;
  bucket?: string;
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// EVENTOS DE CHAT
// ============================================================================

/**
 * Eventos do sistema de chat
 */
export interface ChatEvent extends BaseEvent {
  type: 'message_sent' | 'message_received' | 'session_start' | 'session_end' | 'feedback_given';
  sessionId?: UUID;
  messageId?: UUID;
  messageLength?: number;
  responseTime?: number; // em milliseconds
  satisfaction?: number; // 1-5
  mode?: string; // 'análise', 'copywriting', etc.
}

// ============================================================================
// EVENTOS DE VISTORIA
// ============================================================================

/**
 * Eventos específicos de vistoria
 */
export interface VistoriaEvent extends BaseEvent {
  type: 'vistoria_start' | 'vistoria_complete' | 'image_upload' | 'apontamento_add' | 'revistoria_request';
  vistoriaId?: UUID;
  contractId?: UUID;
  imagesCount?: number;
  apontamentosCount?: number;
  hasIssues?: boolean;
  requiresRevistoria?: boolean;
}

// ============================================================================
// EVENTOS DE NOTIFICAÇÃO
// ============================================================================

/**
 * Eventos de notificação
 */
export interface NotificationEvent extends BaseEvent {
  type: 'notification_sent' | 'notification_read' | 'notification_clicked' | 'notification_dismissed';
  notificationId: UUID;
  notificationType: string;
  channel: 'in_app' | 'email' | 'push';
  userId: UUID;
  readAt?: string;
  clickedAt?: string;
}

// ============================================================================
// EVENTOS DE SISTEMA
// ============================================================================

/**
 * Eventos de monitoramento do sistema
 */
export interface SystemEvent extends BaseEvent {
  type: 'api_error' | 'performance_issue' | 'storage_warning' | 'security_alert' | 'maintenance_mode';
  severity: 'info' | 'warning' | 'error' | 'critical';
  component?: string; // 'api', 'database', 'ui', etc.
  errorCode?: string;
  errorDetails?: string;
  performance?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

// ============================================================================
// EVENTOS DE AUDITORIA
// ============================================================================

/**
 * Eventos de auditoria do sistema
 */
export interface AuditEvent extends BaseEvent {
  type: 'permission_denied' | 'suspicious_activity' | 'data_export' | 'bulk_operation' | 'admin_action';
  action: AuditAction;
  resource: string;
  resourceId?: UUID;
  userRole?: UserRole;
  result: 'success' | 'failure' | 'blocked';
  details?: Record<string, unknown>;
}

// ============================================================================
// EVENTOS DE BUSINESS LOGIC
// ============================================================================

/**
 * Eventos de lógica de negócio
 */
export interface BusinessEvent extends BaseEvent {
  type: 'contract_generated' | 'document_printed' | 'deadline_approaching' | 'payment_overdue' | 'revenue_generated';
  entityId?: UUID;
  entityType?: string;
  value?: number; // para eventos monetários
  currency?: string;
  dueDate?: string;
  status?: string;
}

// ============================================================================
// EVENTO DISPATCHER
// ============================================================================

/**
 * Union type de todos os eventos
 */
export type AppEvent = 
  | AuthEvent
  | PasswordChangeEvent
  | NavigationEvent
  | UserActionEvent
  | FormEvent
  | DataEvent
  | SyncEvent
  | FileEvent
  | ChatEvent
  | VistoriaEvent
  | NotificationEvent
  | SystemEvent
  | AuditEvent
  | BusinessEvent;

/**
 * Configuração do dispatcher de eventos
 */
export interface EventDispatcherConfig {
  /** Máximo de eventos para manter em memória */
  maxEvents: number;
  /** Categorias de eventos para monitorar */
  enabledCategories: string[];
  /** Transmitir eventos via WebSocket */
  broadcast: boolean;
  /** Armazenar eventos no banco */
  persist: boolean;
  /** Callback personalizado para processamento */
  customHandler?: (event: AppEvent) => void;
}

/**
 * Estatísticas de eventos
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageEventsPerHour: number;
  errorEvents: number;
  lastEventTime?: string;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Interface para listeners de evento
 */
export interface EventListener<T extends AppEvent = AppEvent> {
  /** ID único do listener */
  id: string;
  /** Categorias de evento para escutar */
  eventTypes: string[];
  /** Callback quando evento for disparado */
  callback: (event: T) => void | Promise<void>;
  /** Se deve ser chamado apenas uma vez */
  once?: boolean;
  /** Se está ativo */
  enabled: boolean;
}

// ============================================================================
// HELPERS PARA CRIAÇÃO DE EVENTOS
// ============================================================================

/**
 * Factory para criar eventos comuns
 */
export const EventFactory = {
  /**
   * Cria evento de ação de usuário
   */
  userAction: (type: UserActionEvent['type'], data: Partial<UserActionEvent> = {}): UserActionEvent => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    success: true,
    ...data
  }),

  /**
   * Cria evento de dados
   */
  dataOperation: (
    type: DataEvent['type'],
    entity: string,
    data: Partial<DataEvent> = {}
  ): DataEvent => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    entity,
    success: true,
    method: 'manual',
    ...data
  }),

  /**
   * Cria evento de erro
   */
  error: (type: SystemEvent['type'], error: string, data: Partial<SystemEvent> = {}): SystemEvent => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    severity: 'error',
    errorDetails: error,
    success: false,
    ...data
  })
};

// ============================================================================
// ANALYTICS E MONITORAMENTO
// ============================================================================

/**
 * Configuração de analytics
 */
export interface AnalyticsConfig {
  /** ID do projeto (Google Analytics, etc.) */
  projectId?: string;
  /** Evento para tracking */
  trackEvents: boolean;
  /** Tracking de performance */
  trackPerformance: boolean;
  /** Tracking de erros */
  trackErrors: boolean;
  /** Sampling rate (0-1) */
  samplingRate: number;
}

/**
 * Dados de analytics agregados
 */
export interface AnalyticsData {
  userId?: string;
  sessionId: string;
  events: AppEvent[];
  performance: {
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
  };
  metadata: {
    userAgent: string;
    screen: string;
    language: string;
    timezone: string;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  BaseEvent,
  AppEvent,
  EventListener,
  EventDispatcherConfig,
  EventStats,
  AnalyticsConfig,
  AnalyticsData
};

export { EventFactory };

export default {};