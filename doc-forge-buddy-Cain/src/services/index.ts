/**
 * Services Layer - Índice principal
 * Exporta todos os services e interfaces implementados
 */

// Core interfaces and base classes
export * from './core/interfaces';
export * from './core/base-service';
export * from './core/service-container';
export * from './core/service-decorators';

// Contract-specific services
export * from './contracts/contract-service.interface';
export * from './contracts/contract.service';
export * from './contracts/contract.repository';

// Support services
export * from './notifications/notification.service';
export * from './validation/validation.service';
export * from './events/event-bus';

// === Service Factory Functions ===

import { ServiceContainer, ServiceContainerFactory } from './core/service-container';
import { ContractService } from './contracts/contract.service';
import { NotificationService } from './notifications/notification.service';
import { ValidationService } from './validation/validation.service';
import { EventBus } from './events/event-bus';

/**
 * Cria e configura o container de services padrão
 */
export function createDefaultServiceContainer(): ServiceContainer {
  return ServiceContainerFactory.createDefault();
}

/**
 * Cria instância do ContractService
 */
export function createContractService(): ContractService {
  return new ContractService();
}

/**
 * Cria instância do NotificationService
 */
export function createNotificationService(): NotificationService {
  return new NotificationService();
}

/**
 * Cria instância do ValidationService
 */
export function createValidationService(): ValidationService {
  return new ValidationService();
}

/**
 * Cria instância do EventBus
 */
export function createEventBus(): EventBus {
  return new EventBus();
}

/**
 * Cria todos os services como um conjunto
 */
export function createServiceSet() {
  return {
    contractService: createContractService(),
    notificationService: createNotificationService(),
    validationService: createValidationService(),
    eventBus: createEventBus()
  };
}

// === Type Guards ===

import { Contract } from '@/types/domain/contract';
import { EventData } from './events/event-bus';
import { ContractFilters } from './contracts/contract-service.interface';

/**
 * Verifica se um objeto é um Contract
 */
export function isContract(obj: unknown): obj is Contract {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'form_data' in obj &&
         'document_type' in obj;
}

/**
 * Verifica se um evento é específico de contrato
 */
export function isContractEvent(event: EventData): event is EventData & { 
  type: 'contract.created' | 'contract.updated' | 'contract.deleted' | 
       'contract.renewed' | 'contract.terminated' | 'contract.statusChanged' |
       'contract.expiring' | 'contract.expired' | 'contract.formDataUpdated' |
       'document.generated' | 'contract.favoriteAdded' | 'contract.favoriteRemoved' |
       'contract.tagAdded' | 'contract.tagRemoved';
} {
  return typeof event === 'object' && 
         event !== null && 
         'type' in event && 
         String(event.type).startsWith('contract.');
}

/**
 * Verifica se filtros são válidos para contratos
 */
export function isValidContractFilters(filters: unknown): filters is ContractFilters {
  if (typeof filters !== 'object' || filters === null) return true; // Empty filters are valid
  
  const f = filters as any;
  return typeof f.status === 'string' || 
         typeof f.documentType === 'string' ||
         typeof f.propertyAddress === 'string' ||
         typeof f.clientName === 'string' ||
         (f.dateRange && typeof f.dateRange.start === 'string' && typeof f.dateRange.end === 'string') ||
         (Array.isArray(f.tags)) ||
         typeof f.isFavorite === 'boolean' ||
         typeof f.query === 'string';
}

// === Constants ===

export const SERVICE_CONFIG = {
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
  MAX_CONCURRENT_OPERATIONS: 10
} as const;

export const CONTRACT_SERVICE_EVENTS = {
  CREATED: 'contract.created',
  UPDATED: 'contract.updated',
  DELETED: 'contract.deleted',
  RENEWED: 'contract.renewed',
  TERMINATED: 'contract.terminated',
  STATUS_CHANGED: 'contract.statusChanged',
  EXPIRING: 'contract.expiring',
  EXPIRED: 'contract.expired',
  FORM_DATA_UPDATED: 'contract.formDataUpdated',
  DOCUMENT_GENERATED: 'document.generated',
  FAVORITE_ADDED: 'contract.favoriteAdded',
  FAVORITE_REMOVED: 'contract.favoriteRemoved',
  TAG_ADDED: 'contract.tagAdded',
  TAG_REMOVED: 'contract.tagRemoved'
} as const;

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook'
} as const;

export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// === Utility Functions ===

/**
 * Cria contexto de service padrão
 */
export function createServiceContext(userId?: string, tenantId?: string) {
  return {
    userId,
    tenantId,
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    metadata: {}
  };
}

/**
 * Valida configuração de service
 */
export function validateServiceConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
    errors.push('Timeout must be a positive number');
  }

  if (config.retryAttempts && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
    errors.push('Retry attempts must be a non-negative number');
  }

  if (config.enableMetrics && typeof config.enableMetrics !== 'boolean') {
    errors.push('Enable metrics must be a boolean');
  }

  if (config.enableValidation && typeof config.enableValidation !== 'boolean') {
    errors.push('Enable validation must be a boolean');
  }

  if (config.enableLogging && typeof config.enableLogging !== 'boolean') {
    errors.push('Enable logging must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Deep merge de configurações
 */
export function mergeServiceConfig(...configs: any[]): any {
  return configs.reduce((merged, config) => {
    if (!config) return merged;
    
    for (const [key, value] of Object.entries(config)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = mergeServiceConfig(merged[key] || {}, value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }, {});
}

/**
 * Serializa service para cache
 */
export function serializeServiceData(data: any): string {
  if (data === null || data === undefined) return 'null';
  
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return JSON.stringify(data);
  }
  
  if (data instanceof Date) {
    return JSON.stringify({ __type: 'Date', value: data.toISOString() });
  }
  
  if (data instanceof Error) {
    return JSON.stringify({ 
      __type: 'Error', 
      message: data.message, 
      stack: data.stack 
    });
  }
  
  return JSON.stringify(data);
}

/**
 * Deserializa service do cache
 */
export function deserializeServiceData(data: string): any {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed && typeof parsed === 'object' && parsed.__type) {
      switch (parsed.__type) {
        case 'Date':
          return new Date(parsed.value);
        case 'Error':
          const error = new Error(parsed.message);
          error.stack = parsed.stack;
          return error;
        default:
          return parsed;
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to deserialize service data:', error);
    return data;
  }
}

// === React Hooks (simplified versions) ===

import { useState, useEffect } from 'react';

/**
 * Hook para usar service do container
 */
export function useService<T>(token: string): T | null {
  const [service, setService] = useState<T | null>(null);

  useEffect(() => {
    try {
      const container = createDefaultServiceContainer();
      const instance = container.get<T>(token);
      setService(instance);
    } catch (error) {
      console.error(`Failed to get service ${token}:`, error);
      setService(null);
    }
  }, [token]);

  return service;
}

/**
 * Hook para usar ContractService
 */
export function useContractService(): ContractService | null {
  return useService<ContractService>('ContractService');
}

/**
 * Hook para usar NotificationService
 */
export function useNotificationService(): NotificationService | null {
  return useService<NotificationService>('NotificationService');
}

// === Default exports ===

const services = {
  contractService: createContractService,
  notificationService: createNotificationService,
  validationService: createValidationService,
  eventBus: createEventBus,
  container: createDefaultServiceContainer
};

export default services;
