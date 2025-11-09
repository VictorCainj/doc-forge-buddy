/**
 * Factory pattern para Repository
 * Centraliza a criação e gerenciamento de repositories
 */

import { ContractRepository } from './ContractRepository';
import { UserRepository } from './UserRepository';
import { VistoriaRepository } from './VistoriaRepository';
import { DocumentRepository } from './DocumentRepository';
import { NotificationRepository } from './NotificationRepository';
import { repositoryLogger } from './logging/RepositoryLogger';

// Enum para tipos de repository
export enum RepositoryType {
  CONTRACT = 'contract',
  USER = 'user',
  VISTORIA = 'vistoria',
  DOCUMENT = 'document',
  NOTIFICATION = 'notification'
}

export interface RepositoryFactoryConfig {
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  defaultUserId?: string | null;
  cacheEnabled?: boolean;
  cacheTimeout?: number;
}

export class RepositoryFactory {
  private static repositories = new Map<string, any>();
  private static config: RepositoryFactoryConfig = {
    enableLogging: true,
    enablePerformanceMonitoring: true,
    defaultUserId: null,
    cacheEnabled: false,
    cacheTimeout: 300000 // 5 minutos
  };
  private static cache = new Map<string, { repository: any; timestamp: number }>();

  /**
   * Configura o factory
   */
  static configure(config: Partial<RepositoryFactoryConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Aplica configurações ao logger
    if (repositoryLogger) {
      repositoryLogger.setEnabled(this.config.enableLogging || true);
    }
  }

  /**
   * Obtém um repository do tipo especificado
   */
  static get<T = any>(
    type: RepositoryType,
    userId?: string | null
  ): T {
    const effectiveUserId = userId || this.config.defaultUserId;
    const cacheKey = `${type}_${effectiveUserId || 'anonymous'}`;

    // Verifica cache se habilitado
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < (this.config.cacheTimeout || 300000)) {
        repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'getFromCache', 
          `Returning cached repository: ${type}`, Date.now());
        return cached.repository;
      }
    }

    // Cria nova instância se não existe no cache
    if (!this.repositories.has(cacheKey)) {
      const repository = this.createRepository(type, effectiveUserId);
      this.repositories.set(cacheKey, repository);
      
      // Armazena no cache se habilitado
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          repository,
          timestamp: Date.now()
        });
      }
    }

    const result = this.repositories.get(cacheKey);
    
    repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'get', 
      `Created/returned repository: ${type}`, Date.now());

    return result;
  }

  /**
   * Cria repository específico
   */
  private static createRepository(type: RepositoryType, userId?: string | null): any {
    switch (type) {
      case RepositoryType.CONTRACT:
        return new ContractRepository(userId);
      
      case RepositoryType.USER:
        return new UserRepository(userId);
      
      case RepositoryType.VISTORIA:
        return new VistoriaRepository(userId);
      
      case RepositoryType.DOCUMENT:
        return new DocumentRepository(userId);
      
      case RepositoryType.NOTIFICATION:
        return new NotificationRepository(userId);
      
      default:
        throw new Error(`Tipo de repository não suportado: ${type}`);
    }
  }

  /**
   * Limpa cache de repositories
   */
  static clearCache(): void {
    this.cache.clear();
    repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'clearCache', 
      'Cache cleared', Date.now());
  }

  /**
   * Remove repository específico do cache
   */
  static removeFromCache(type: RepositoryType, userId?: string | null): void {
    const effectiveUserId = userId || this.config.defaultUserId;
    const cacheKey = `${type}_${effectiveUserId || 'anonymous'}`;
    
    this.cache.delete(cacheKey);
    repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'removeFromCache', 
      `Removed from cache: ${cacheKey}`, Date.now());
  }

  /**
   * Limpa todos os repositories da memória
   */
  static clearAll(): void {
    this.repositories.clear();
    this.clearCache();
    repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'clearAll', 
      'All repositories cleared', Date.now());
  }

  /**
   * Lista todos os repositories em cache
   */
  static getCachedRepositories(): Array<{ type: string; userId: string | null; timestamp: number }> {
    const cached: Array<{ type: string; userId: string | null; timestamp: number }> = [];
    
    this.cache.forEach((value, key) => {
      const [type, userId] = key.split('_');
      cached.push({
        type,
        userId: userId === 'anonymous' ? null : userId,
        timestamp: value.timestamp
      });
    });
    
    return cached;
  }

  /**
   * Obtém estatísticas do factory
   */
  static getStats(): {
    totalRepositories: number;
    cachedRepositories: number;
    config: RepositoryFactoryConfig;
    cacheEntries: Array<{ type: string; userId: string | null; age: number }>;
  } {
    const cacheEntries = this.getCachedRepositories().map(entry => ({
      ...entry,
      age: Date.now() - entry.timestamp
    }));

    return {
      totalRepositories: this.repositories.size,
      cachedRepositories: this.cache.size,
      config: { ...this.config },
      cacheEntries
    };
  }

  /**
   * Verifica se um tipo de repository é suportado
   */
  static isSupported(type: string): type is RepositoryType {
    return Object.values(RepositoryType).includes(type as RepositoryType);
  }

  /**
   * Lista tipos de repository suportados
   */
  static getSupportedTypes(): RepositoryType[] {
    return Object.values(RepositoryType);
  }

  /**
   * Precarrega repositories para melhor performance
   */
  static preloadRepositories(userId?: string | null): void {
    const effectiveUserId = userId || this.config.defaultUserId;
    
    repositoryLogger.logQuery?.('INFO', 'RepositoryFactory', 'preload', 
      'Preloading all repositories', Date.now());

    // Carrega todos os tipos suportados
    this.getSupportedTypes().forEach(type => {
      this.get(type, effectiveUserId);
    });
  }

  /**
   * Executa ação em múltiplos repositories
   */
  static async executeOnRepositories<R>(
    types: RepositoryType[],
    action: (repository: any) => Promise<R>,
    userId?: string | null
  ): Promise<Record<RepositoryType, R | null>> {
    const effectiveUserId = userId || this.config.defaultUserId;
    const results: Record<RepositoryType, R | null> = {} as any;

    for (const type of types) {
      try {
        const repository = this.get(type, effectiveUserId);
        results[type] = await action(repository);
      } catch (error) {
        console.error(`Erro ao executar ação no repository ${type}:`, error);
        results[type] = null;
      }
    }

    return results;
  }

  /**
   * Obtém repositories ativos por tipo
   */
  static getActiveRepositories(): Array<{ type: string; userId: string | null; operations: number }> {
    const active: Array<{ type: string; userId: string | null; operations: number }> = [];
    
    this.repositories.forEach((repository, key) => {
      const [type, userId] = key.split('_');
      // Aqui você pode adicionar lógica para contar operações se necessário
      active.push({
        type,
        userId: userId === 'anonymous' ? null : userId,
        operations: 0 // Implementar contagem de operações se necessário
      });
    });
    
    return active;
  }

  /**
   * Health check dos repositories
   */
  static async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    repositories: Record<RepositoryType, { status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }>;
    config: RepositoryFactoryConfig;
  }> {
    const results: Record<RepositoryType, { status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }> = {} as any;
    let healthyCount = 0;
    let totalCount = 0;

    for (const type of this.getSupportedTypes()) {
      totalCount++;
      try {
        const repository = this.get(type, this.config.defaultUserId);
        
        // Teste simples de conectividade
        // Pode ser expandido para testes mais robustos
        await repository.count();
        
        results[type] = { status: 'healthy' };
        healthyCount++;
      } catch (error) {
        results[type] = { 
          status: 'unhealthy', 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }

    const overall = healthyCount === totalCount ? 'healthy' : 
                   healthyCount > 0 ? 'degraded' : 'unhealthy';

    return {
      overall,
      repositories: results,
      config: { ...this.config }
    };
  }

  /**
   * Contexto para execução de múltiplas operações
   */
  static createContext(userId?: string | null) {
    const effectiveUserId = userId || this.config.defaultUserId;
    
    return {
      getContractRepository: () => this.get<ContractRepository>(RepositoryType.CONTRACT, effectiveUserId),
      getUserRepository: () => this.get<UserRepository>(RepositoryType.USER, effectiveUserId),
      getVistoriaRepository: () => this.get<VistoriaRepository>(RepositoryType.VISTORIA, effectiveUserId),
      getDocumentRepository: () => this.get<DocumentRepository>(RepositoryType.DOCUMENT, effectiveUserId),
      getNotificationRepository: () => this.get<NotificationRepository>(RepositoryType.NOTIFICATION, effectiveUserId),
      
      // Métodos de conveniência
      getAll: () => ({
        contract: this.get<ContractRepository>(RepositoryType.CONTRACT, effectiveUserId),
        user: this.get<UserRepository>(RepositoryType.USER, effectiveUserId),
        vistoria: this.get<VistoriaRepository>(RepositoryType.VISTORIA, effectiveUserId),
        document: this.get<DocumentRepository>(RepositoryType.DOCUMENT, effectiveUserId),
        notification: this.get<NotificationRepository>(RepositoryType.NOTIFICATION, effectiveUserId)
      })
    };
  }
}

// Export convenience functions
export const getContractRepository = (userId?: string | null) => 
  RepositoryFactory.get<ContractRepository>(RepositoryType.CONTRACT, userId);

export const getUserRepository = (userId?: string | null) => 
  RepositoryFactory.get<UserRepository>(RepositoryType.USER, userId);

export const getVistoriaRepository = (userId?: string | null) => 
  RepositoryFactory.get<VistoriaRepository>(RepositoryType.VISTORIA, userId);

export const getDocumentRepository = (userId?: string | null) => 
  RepositoryFactory.get<DocumentRepository>(RepositoryType.DOCUMENT, userId);

export const getNotificationRepository = (userId?: string | null) => 
  RepositoryFactory.get<NotificationRepository>(RepositoryType.NOTIFICATION, userId);

export const createRepositoryContext = (userId?: string | null) => 
  RepositoryFactory.createContext(userId);