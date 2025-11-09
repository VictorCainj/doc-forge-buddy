/**
 * Índice principal dos Repositories
 * Exporta todas as classes, interfaces e utilitários
 */

// Base interfaces and errors
export { IRepository } from './interfaces/IRepository';
export { RepositoryError, RepositoryErrorType } from './errors/RepositoryError';

// Base repository
export { BaseRepository } from './BaseRepository';

// Logging system
export { repositoryLogger, LogLevel, createQueryTimer } from './logging/RepositoryLogger';

// Specific repositories
export { ContractRepository } from './ContractRepository';
export { UserRepository } from './UserRepository';
export { VistoriaRepository } from './VistoriaRepository';
export { DocumentRepository, type Document, type CreateDocumentData, type UpdateDocumentData } from './DocumentRepository';
export { NotificationRepository, type Notification, type CreateNotificationData, type UpdateNotificationData, type NotificationType, type NotificationStatus } from './NotificationRepository';

// Factory pattern
export { RepositoryFactory, RepositoryType, type RepositoryFactoryConfig } from './RepositoryFactory';

// Convenience functions
export {
  getContractRepository,
  getUserRepository,
  getVistoriaRepository,
  getDocumentRepository,
  getNotificationRepository,
  createRepositoryContext
} from './RepositoryFactory';

// Types
export type {
  BaseEntity,
  UserProfile,
  Contract,
  VistoriaAnalise,
  Document as DocumentType,
  Notification as NotificationType
} from '@/types/shared/base';

// Performance and monitoring helpers
export const enableRepositoryLogging = (enabled = true) => {
  RepositoryFactory.configure({ enableLogging: enabled });
};

export const enableRepositoryCaching = (enabled = true, timeout = 300000) => {
  RepositoryFactory.configure({ 
    cacheEnabled: enabled, 
    cacheTimeout: timeout 
  });
};

export const getRepositoryStats = () => {
  return RepositoryFactory.getStats();
};

export const clearRepositoryCache = () => {
  RepositoryFactory.clearCache();
};

export const healthCheckRepositories = async () => {
  return await RepositoryFactory.healthCheck();
};

// Configuration helper
export const configureRepositories = (config: Partial<RepositoryFactoryConfig>) => {
  RepositoryFactory.configure(config);
};