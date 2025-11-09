// Hooks de Business Logic - Ponto de entrada
export * from './contracts';
export * from './vistoria';
export * from './documents';
export * from './performance';
export * from './analytics';

// Tipos principais
export type {
  ContractStatus,
  ContractTransition,
  ContractValidation
} from './contracts/useContractLifecycle';

export type {
  VistoriaStep,
  VistoriaStatus,
  WorkflowTransition
} from './vistoria/useVistoriaWorkflow';

export type {
  Apontamento,
  ApontamentoCategory,
  ApontamentoFilter,
  ApontamentoStats
} from './vistoria/useApontamentoManager';

export type {
  DocumentTemplate,
  GeneratedDocument,
  DocumentData
} from './documents/useDocumentGeneration';

export type {
  DocumentHistoryEntry,
  DocumentVersion,
  AuditTrail
} from './documents/useDocumentHistory';

export type {
  OptimisticContext,
  OptimisticState
} from './performance/useOptimisticUpdate';

export type {
  SyncEntity,
  SyncSettings,
  SyncStats
} from './performance/useBackgroundSync';

export type {
  UserActivity,
  UserJourney,
  ConversionEvent,
  AnalyticsStats
} from './analytics/useUserActivity';

export type {
  PerformanceMetric,
  WebVitals,
  PerformanceAlert,
  PerformanceReport
} from './analytics/usePerformanceMetrics';