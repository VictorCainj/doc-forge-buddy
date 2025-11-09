import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/shared/use-toast';

// Tipos de erro
export interface QueryError {
  message: string;
  code?: string | number;
  status?: number;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface MutationError extends QueryError {
  variables?: any;
  mutationType: 'create' | 'update' | 'delete' | 'custom';
}

// Handler centralizado de erros
class QueryErrorHandler {
  private errorQueue: QueryError[] = [];
  private maxQueueSize = 100;
  private notificationThreshold = 3; // Máximo de notificações por minuto

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Capturar erros não tratados
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event.reason);
    });
  }

  // Handler para erros de query
  handleQueryError = (error: any, query: any) => {
    const queryError: QueryError = {
      message: error?.message || 'Erro desconhecido na consulta',
      code: error?.code,
      status: error?.status,
      details: error?.details,
      timestamp: new Date(),
      context: {
        queryKey: query?.queryKey,
        queryHash: query?.queryHash,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    };

    this.logError(error, query);
    this.handleNetworkError(error);
    this.showUserNotification(queryError);
    
    return queryError;
  };

  // Handler para erros de mutation
  handleMutationError = (error: any, variables: any, context: any) => {
    const mutationError: MutationError = {
      message: error?.message || 'Erro desconhecido na mutação',
      code: error?.code,
      status: error?.status,
      details: error?.details,
      timestamp: new Date(),
      variables,
      mutationType: this.determineMutationType(variables),
      context: {
        operation: context?.operation,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      }
    };

    this.logError(error, context);
    this.handleNetworkError(error);
    this.handleOptimisticUpdateRollback(error, context);
    this.showMutationNotification(mutationError);
    
    return mutationError;
  };

  // Log de erro para monitoramento
  logError(error: any, context?: any) {
    // Adicionar à fila de erros
    this.errorQueue.push({
      message: error?.message || 'Unknown error',
      code: error?.code,
      status: error?.status,
      timestamp: new Date(),
      context
    });

    // Manter tamanho da fila
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log para console em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('Query Error:', {
        error,
        context,
        timestamp: new Date().toISOString()
      });
    }

    // Enviar para serviço de monitoramento (ex: Sentry)
    if (window.Sentry && import.meta.env.PROD) {
      window.Sentry.captureException(error, {
        extra: { context }
      });
    }
  }

  // Tratar erros de rede
  private handleNetworkError(error: any) {
    if (!navigator.onLine) {
      this.showOfflineNotification();
    } else if (error?.code === 'NETWORK_ERROR') {
      this.showNetworkErrorNotification();
    }
  }

  // Rollback de optimistic updates
  private handleOptimisticUpdateRollback(error: any, context: any) {
    if (context?.previousData && error) {
      // Se houve otimistic update, rolling back
      this.logEvent('optimistic_update_rolled_back', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Notificações para o usuário
  private showUserNotification(error: QueryError) {
    // Limitar notificações spam
    if (this.shouldShowNotification()) {
      const { toast: toastImpl } = { toast };
      
      switch (error.status) {
        case 401:
          toastImpl({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
            duration: 8000
          });
          break;
          
        case 403:
          toastImpl({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar este recurso.",
            variant: "destructive",
            duration: 5000
          });
          break;
          
        case 404:
          toastImpl({
            title: "Recurso não encontrado",
            description: "O item solicitado não foi encontrado.",
            variant: "destructive",
            duration: 4000
          });
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          toastImpl({
            title: "Erro do servidor",
            description: "Estamos tendo problemas técnicos. Tente novamente em alguns minutos.",
            variant: "destructive",
            duration: 8000
          });
          break;
          
        default:
          if (error.status && error.status >= 400) {
            toastImpl({
              title: "Erro na requisição",
              description: error.message || "Ocorreu um erro inesperado.",
              variant: "destructive",
              duration: 4000
            });
          }
      }
    }
  }

  private showMutationNotification(error: MutationError) {
    const { toast: toastImpl } = { toast };
    
    toastImpl({
      title: "Erro na operação",
      description: `Não foi possível ${this.getActionDescription(error.mutationType)}: ${error.message}`,
      variant: "destructive",
      duration: 5000
    });
  }

  private showOfflineNotification() {
    const { toast: toastImpl } = { toast };
    toastImpl({
      title: "Sem conexão",
      description: "Você está offline. Algumas funcionalidades podem não estar disponíveis.",
      variant: "default",
      duration: 6000
    });
  }

  private showNetworkErrorNotification() {
    const { toast: toastImpl } = { toast };
    toastImpl({
      title: "Erro de conexão",
      description: "Não foi possível conectar ao servidor. Verifique sua internet.",
      variant: "destructive",
      duration: 5000
    });
  }

  // Utilitários
  private determineMutationType(variables: any): 'create' | 'update' | 'delete' | 'custom' {
    if (variables?.action) {
      switch (variables.action) {
        case 'create': return 'create';
        case 'update': return 'update';
        case 'delete': return 'delete';
        default: return 'custom';
      }
    }
    return 'custom';
  }

  private getActionDescription(type: string): string {
    switch (type) {
      case 'create': return 'criar o item';
      case 'update': return 'atualizar o item';
      case 'delete': return 'remover o item';
      default: return 'executar a operação';
    }
  }

  private shouldShowNotification(): boolean {
    // Implementar lógica para evitar spam de notificações
    const recentErrors = this.errorQueue.filter(
      error => Date.now() - error.timestamp.getTime() < 60000 // Último minuto
    );
    return recentErrors.length < this.notificationThreshold;
  }

  private handleUnhandledRejection(reason: any) {
    const error: QueryError = {
      message: reason?.message || 'Unhandled promise rejection',
      code: reason?.code,
      status: reason?.status,
      timestamp: new Date(),
      context: { type: 'unhandled_rejection' }
    };
    
    this.logError(reason, { type: 'unhandled_rejection' });
  }

  // Log de eventos para analytics
  logEvent(event: string, data?: any) {
    if (import.meta.env.DEV) {
      console.log(`Query Event: ${event}`, data);
    }
    
    // Enviar para analytics em produção
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('event', 'query_event', {
        event_category: 'query_performance',
        event_label: event,
        value: data
      });
    }
  }

  // Obter estatísticas de erro
  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recent = this.errorQueue.filter(e => e.timestamp.getTime() > oneHourAgo);
    const last24h = this.errorQueue.filter(e => e.timestamp.getTime() > oneDayAgo);
    
    return {
      total: this.errorQueue.length,
      lastHour: recent.length,
      last24h: last24h.length,
      byStatus: this.errorQueue.reduce((acc, error) => {
        acc[error.status || 'unknown'] = (acc[error.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const errorHandler = new QueryErrorHandler();

// Declarar tipo global para Sentry
declare global {
  interface Window {
    Sentry: any;
    gtag: any;
  }
}