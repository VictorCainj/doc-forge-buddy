/**
 * ServiceContainer - Sistema de injeção de dependências
 * Gerencia o ciclo de vida e dependências entre services
 */

import { ServiceConfig, ServiceContext } from './interfaces';

/**
 * Interface para factory de services
 */
export interface ServiceFactory<T = unknown> {
  (container: ServiceContainer): T;
}

/**
 * Interface para registro de service
 */
export interface ServiceRegistration {
  implementation: ServiceFactory | new () => unknown;
  singleton: boolean;
  dependsOn?: string[];
  config?: ServiceConfig;
  context?: ServiceContext;
  instance?: unknown; // Para singletons
}

/**
 * ServiceContainer principal
 * Implementa padrão Singleton e Factory
 */
export class ServiceContainer {
  private services = new Map<string, ServiceRegistration>();
  private factories = new Map<string, ServiceFactory>();
  private instances = new Map<string, unknown>();
  private context: ServiceContext;
  private initialized = false;

  constructor(context: ServiceContext = {}) {
    this.context = {
      ...context,
      requestId: context.requestId || this.generateRequestId(),
      correlationId: context.correlationId || this.generateCorrelationId()
    };
  }

  // === Registration Methods ===
  
  /**
   * Registra um service no container
   */
  register<T>(
    token: string, 
    implementation: ServiceFactory<T> | (new () => T), 
    options: {
      singleton?: boolean;
      dependsOn?: string[];
      config?: ServiceConfig;
      context?: ServiceContext;
    } = {}
  ): void {
    if (this.initialized) {
      throw new Error('Cannot register services after container initialization');
    }

    this.services.set(token, {
      implementation,
      singleton: options.singleton ?? true,
      dependsOn: options.dependsOn,
      config: options.config,
      context: options.context
    });
  }

  /**
   * Registra um service factory
   */
  registerFactory<T>(token: string, factory: ServiceFactory<T>): void {
    if (this.initialized) {
      throw new Error('Cannot register factories after container initialization');
    }

    this.factories.set(token, factory);
  }

  /**
   * Registra um service como singleton
   */
  registerSingleton<T>(
    token: string, 
    implementation: ServiceFactory<T> | (new () => T), 
    dependsOn?: string[]
  ): void {
    this.register(token, implementation, { singleton: true, dependsOn });
  }

  /**
   * Registra um service como transiente
   */
  registerTransient<T>(
    token: string, 
    implementation: ServiceFactory<T> | (new () => T), 
    dependsOn?: string[]
  ): void {
    this.register(token, implementation, { singleton: false, dependsOn });
  }

  // === Resolution Methods ===

  /**
   * Resolve um service do container
   */
  get<T>(token: string): T {
    this.ensureInitialized();

    // Verificar se já tem uma instância cached (singleton)
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Verificar factory primeiro
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      const instance = factory(this);
      return instance;
    }

    // Verificar service registration
    if (this.services.has(token)) {
      const registration = this.services.get(token)!;
      
      // Verificar dependências
      if (registration.dependsOn) {
        for (const dependency of registration.dependsOn) {
          this.get(dependency); // Força resolução da dependência
        }
      }

      // Criar instância
      const instance = this.createInstance<T>(registration);
      
      // Cache se for singleton
      if (registration.singleton) {
        this.instances.set(token, instance);
      }

      return instance;
    }

    throw new Error(`Service '${token}' not found in container`);
  }

  /**
   * Resolve múltiplos services
   */
  getMany<T>(tokens: string[]): T[] {
    return tokens.map(token => this.get<T>(token));
  }

  /**
   * Resolve um service opcional (não throws se não encontrado)
   */
  getOptional<T>(token: string): T | null {
    try {
      return this.get<T>(token);
    } catch {
      return null;
    }
  }

  // === Lifecycle Methods ===

  /**
   * Inicializa o container
   */
  initialize(): void {
    this.initialized = true;

    // Inicializar services dependentes
    for (const [token, registration] of this.services) {
      if (registration.dependsOn) {
        for (const dependency of registration.dependsOn) {
          this.get(dependency);
        }
      }
    }
  }

  /**
   * Disposes todos os services
   */
  dispose(): void {
    for (const [token, instance] of this.instances) {
      if (this.isDisposable(instance)) {
        (instance as Disposable).dispose();
      }
    }

    this.instances.clear();
    this.initialized = false;
  }

  /**
   * Cria novo escopo do container
   */
  createScope(): ServiceContainer {
    const scope = new ServiceContainer({
      ...this.context,
      requestId: this.generateRequestId()
    });

    // Copiar registros para o novo escopo
    for (const [token, registration] of this.services) {
      scope.services.set(token, { ...registration });
    }

    for (const [token, factory] of this.factories) {
      scope.factories.set(token, factory);
    }

    return scope;
  }

  // === Configuration Methods ===

  /**
   * Atualiza contexto do container
   */
  updateContext(updates: Partial<ServiceContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Obtém contexto atual
   */
  getContext(): ServiceContext {
    return { ...this.context };
  }

  /**
   * Verifica se um service está registrado
   */
  has(token: string): boolean {
    return this.services.has(token) || this.factories.has(token);
  }

  /**
   * Lista todos os tokens registrados
   */
  listRegisteredServices(): string[] {
    return [...this.services.keys(), ...this.factories.keys()];
  }

  /**
   * Verifica se um service é singleton
   */
  isSingleton(token: string): boolean {
    const registration = this.services.get(token);
    return registration?.singleton ?? false;
  }

  /**
   * Obtém dependências de um service
   */
  getDependencies(token: string): string[] {
    const registration = this.services.get(token);
    return registration?.dependsOn ?? [];
  }

  // === Private Methods ===

  private createInstance<T>(registration: ServiceRegistration): T {
    const { implementation, config, context } = registration;

    if (typeof implementation === 'function') {
      // Factory function
      return (implementation as ServiceFactory<T>)(this);
    } else {
      // Constructor function
      const Constructor = implementation as new () => T;
      return new Constructor();
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  private isDisposable(instance: unknown): instance is Disposable {
    return typeof instance === 'object' && 
           instance !== null && 
           typeof (instance as Disposable).dispose === 'function';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Interface para objetos que podem ser disposable
 */
export interface Disposable {
  dispose(): void | Promise<void>;
}

/**
 * Factory para criar container básico com services padrão
 */
export class ServiceContainerFactory {
  static createDefault(): ServiceContainer {
    const container = new ServiceContainer();

    // Registrar services padrão
    this.registerDefaultServices(container);

    return container;
  }

  private static registerDefaultServices(container: ServiceContainer): void {
    // Importar e registrar services
    const { ContractService } = require('@/services/contracts/contract.service');
    const { NotificationService } = require('@/services/notifications/notification.service');
    const { ValidationService } = require('@/services/validation/validation.service');
    const { EventBus } = require('@/services/events/event-bus');

    container.registerSingleton('ContractService', () => new ContractService());
    container.registerSingleton('NotificationService', () => new NotificationService());
    container.registerSingleton('ValidationService', () => new ValidationService());
    container.registerSingleton('EventBus', () => new EventBus());
  }
}

/**
 * Decorator para auto-registrar services
 */
export function Service(token?: string) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    const serviceToken = token || constructor.name;
    
    return class extends constructor {
      static readonly TOKEN = serviceToken;
      static readonly CONTAINER_ADDED = true;
    };
  };
}

/**
 * Decorator para injeção de dependência
 */
export function Inject(token: string) {
  return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
    // Marcar propriedade para injeção
    if (!target.constructor.__injections) {
      target.constructor.__injections = new Map();
    }
    
    target.constructor.__injections.set(propertyKey, {
      token,
      parameterIndex
    });
  };
}

/**
 * Hook para usar container no React
 */
export function useServiceContainer(): ServiceContainer {
  // Implementação simplificada - na prática seria um hook mais robusto
  const global = globalThis as any;
  
  if (!global.__serviceContainer) {
    global.__serviceContainer = ServiceContainerFactory.createDefault();
  }
  
  return global.__serviceContainer as ServiceContainer;
}

/**
 * Hook para usar service específico
 */
export function useService<T>(token: string): T {
  const container = useServiceContainer();
  return container.get<T>(token);
}