/**
 * EventBus - Sistema de eventos para comunicação entre services
 * Implementa padrão Observer para eventos internos da aplicação
 */

export interface EventData {
  type: string;
  [key: string]: unknown;
}

export interface EventHandler {
  (event: EventData): void | Promise<void>;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface EventBusConfig {
  enableLogging?: boolean;
  maxHandlers?: number;
  timeout?: number;
  retryAttempts?: number;
}

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private subscriptions = new Map<string, EventSubscription>();
  private config: EventBusConfig;
  private eventHistory: EventData[] = [];
  private maxHistorySize = 1000;

  constructor(config?: EventBusConfig) {
    this.config = {
      enableLogging: false,
      maxHandlers: 100,
      timeout: 5000, // 5 segundos
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Emite um evento
   */
  async emit(event: EventData): Promise<void> {
    this.log('Emitting event', event);

    // Adicionar ao histórico
    this.addToHistory(event);

    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      this.log('No handlers found for event type', event.type);
      return;
    }

    // Executar handlers de forma assíncrona
    const handlerPromises: Promise<void>[] = [];

    for (const handler of handlers) {
      const handlerPromise = this.executeHandler(handler, event);
      handlerPromises.push(handlerPromise);
    }

    try {
      // Aguardar todos os handlers (com timeout)
      await Promise.race([
        Promise.all(handlerPromises),
        this.createTimeoutPromise()
      ]);
    } catch (error) {
      this.log('Error executing handlers', error);
      // Não throw - eventos devem ser fire-and-forget
    }
  }

  /**
   * Emite evento de forma fire-and-forget (não await)
   */
  emitAsync(event: EventData): void {
    this.emit(event).catch(error => {
      this.log('Async emit error', error);
    });
  }

  /**
   * Registra handler para um tipo de evento
   */
  on(eventType: string, handler: EventHandler): EventSubscription {
    this.log('Registering handler for event type', eventType);

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;

    // Verificar limite de handlers
    if (handlers.size >= this.config.maxHandlers!) {
      throw new Error(`Maximum number of handlers (${this.config.maxHandlers}) reached for event type: ${eventType}`);
    }

    handlers.add(handler);

    // Retornar subscription
    const subscription: EventSubscription = {
      unsubscribe: () => {
        handlers.delete(handler);
        this.log('Handler unsubscribed from event type', eventType);
        
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };

    this.subscriptions.set(`${eventType}_${Date.now()}_${Math.random()}`, subscription);

    return subscription;
  }

  /**
   * Registra handler que será executado apenas uma vez
   */
  once(eventType: string, handler: EventHandler): EventSubscription {
    let executed = false;
    const wrappedHandler: EventHandler = async (event) => {
      if (executed) return;
      executed = true;
      
      try {
        await handler(event);
      } finally {
        subscription.unsubscribe();
      }
    };

    const subscription = this.on(eventType, wrappedHandler);
    return subscription;
  }

  /**
   * Remove handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      this.log('Handler removed from event type', eventType);
      
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Remove todos os handlers de um tipo de evento
   */
  removeAllHandlers(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
      this.log('All handlers removed for event type', eventType);
    } else {
      this.handlers.clear();
      this.log('All handlers removed');
    }
  }

  /**
   * Verifica se há handlers para um tipo de evento
   */
  hasHandlers(eventType: string): boolean {
    const handlers = this.handlers.get(eventType);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Obtém número de handlers para um tipo de evento
   */
  getHandlerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * Lista todos os tipos de evento registrados
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Obtém histórico de eventos
   */
  getEventHistory(limit?: number, eventType?: string): EventData[] {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return [...history];
  }

  /**
   * Limpa histórico de eventos
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.log('Event history cleared');
  }

  /**
   * Configura handler global para todos os eventos
   */
  onAny(handler: EventHandler): EventSubscription {
    return this.on('*', handler);
  }

  /**
   * Cria middleware para interceptar eventos
   */
  createMiddleware(middleware: (event: EventData, next: () => Promise<void>) => Promise<void>): void {
    const originalEmit = this.emit.bind(this);
    
    this.emit = async (event: EventData) => {
      await middleware(event, () => originalEmit(event));
    };
  }

  /**
   * Cria event proxy para delegação
   */
  createProxy(eventType: string): { emit: (data: unknown) => void } {
    return {
      emit: (data: unknown) => {
        this.emitAsync({ type: eventType, data });
      }
    };
  }

  /**
   * Batch emit - emite múltiplos eventos
   */
  async emitBatch(events: EventData[]): Promise<void> {
    this.log('Emitting batch of events', events.length);
    
    const promises = events.map(event => this.emit(event));
    await Promise.all(promises);
  }

  /**
   * Emite evento de forma condicional
   */
  async emitIf(condition: boolean, event: EventData): Promise<void> {
    if (condition) {
      await this.emit(event);
    }
  }

  /**
   * Aguarda um evento específico
   */
  waitFor(eventType: string, timeout?: number): Promise<EventData> {
    return new Promise((resolve, reject) => {
      const timer = timeout ? setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout) : null;

      const subscription = this.once(eventType, (event) => {
        if (timer) clearTimeout(timer);
        resolve(event);
      });
    });
  }

  /**
   * Obtém estatísticas do event bus
   */
  getStats(): {
    registeredEventTypes: string[];
    totalHandlers: number;
    historySize: number;
    config: EventBusConfig;
  } {
    return {
      registeredEventTypes: this.getRegisteredEventTypes(),
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.size, 0),
      historySize: this.eventHistory.length,
      config: this.config
    };
  }

  /**
   * Dispose todos os recursos
   */
  dispose(): void {
    this.removeAllHandlers();
    this.clearHistory();
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    this.log('EventBus disposed');
  }

  // === Private Methods ===

  private async executeHandler(handler: EventHandler, event: EventData): Promise<void> {
    try {
      // Criar timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Handler execution timeout')), this.config.timeout!);
      });

      // Executar handler com timeout
      await Promise.race([handler(event), timeoutPromise]);
      
      this.log('Handler executed successfully', event.type);
    } catch (error) {
      this.log('Handler execution error', error);
      // Implementar retry logic se necessário
      throw error;
    }
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('EventBus operation timeout')), this.config.timeout! * 2);
    });
  }

  private addToHistory(event: EventData): void {
    this.eventHistory.push({
      ...event,
      timestamp: new Date().toISOString()
    });

    // Manter limite de histórico
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.config.enableLogging) {
      console.log(`[EventBus] ${message}`, data);
    }
  }
}

// === Event Types Constants ===

export const CONTRACT_EVENTS = {
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

export const SYSTEM_EVENTS = {
  ERROR: 'system.error',
  WARNING: 'system.warning',
  INFO: 'system.info',
  STARTUP: 'system.startup',
  SHUTDOWN: 'system.shutdown',
  CONFIG_CHANGED: 'system.configChanged'
} as const;

export const USER_EVENTS = {
  LOGIN: 'user.login',
  LOGOUT: 'user.logout',
  PROFILE_UPDATED: 'user.profileUpdated',
  PERMISSION_CHANGED: 'user.permissionChanged'
} as const;

// === Event Type Guards ===

export function isContractEvent(event: EventData): event is EventData & { type: typeof CONTRACT_EVENTS[keyof typeof CONTRACT_EVENTS] } {
  return Object.values(CONTRACT_EVENTS).includes(event.type as any);
}

export function isSystemEvent(event: EventData): event is EventData & { type: typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS] } {
  return Object.values(SYSTEM_EVENTS).includes(event.type as any);
}

export function isUserEvent(event: EventData): event is EventData & { type: typeof USER_EVENTS[keyof typeof USER_EVENTS] } {
  return Object.values(USER_EVENTS).includes(event.type as any);
}

// === Event Builder ===

export class EventBuilder {
  private event: EventData = { type: '' };

  static create(type: string): EventBuilder {
    return new EventBuilder().setType(type);
  }

  setType(type: string): EventBuilder {
    this.event.type = type;
    return this;
  }

  setData(key: string, value: unknown): EventBuilder {
    this.event[key] = value;
    return this;
  }

  setDataObject(data: Record<string, unknown>): EventBuilder {
    Object.assign(this.event, data);
    return this;
  }

  build(): EventData {
    return { ...this.event };
  }
}