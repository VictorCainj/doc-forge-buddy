import * as Sentry from '@sentry/react';

/**
 * Inicializa o Sentry para error tracking
 * @param dsn - DSN do projeto Sentry (opcional, pode vir de variável de ambiente)
 */
export const initSentry = (dsn?: string) => {
  const sentryDsn = dsn || import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn && import.meta.env.PROD) {
    console.warn('⚠️ Sentry DSN não configurado. Error tracking desabilitado.');
    return;
  }

  if (!import.meta.env.PROD) {
    console.log('📊 Sentry configurado (modo desenvolvimento)');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring - Ajustar sample rate baseado no environment
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.5 : 1.0,
    // Session Replay
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE || 'development',
    // Configuração de contexto padrão
    defaultIntegrations: true,
    // Capturar console logs como breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filtrar breadcrumbs muito verbosos
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
    // Capture 100% of unhandled exceptions
    beforeSend(event, hint) {
      // Filtrar erros conhecidos
      if (event.exception) {
        const error = hint.originalException;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Ignorar erros de navegação/cancelamento
        if (
          errorMessage.includes('Navigation cancelled') ||
          errorMessage.includes('ChunkLoadError') ||
          errorMessage.includes('Loading chunk')
        ) {
          return null;
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry inicializado com sucesso');
};

/**
 * Captura uma exceção manualmente
 * @param error - Erro a ser capturado
 * @param context - Contexto adicional
 */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>
) => {
  if (context) {
    Sentry.setContext('additional_context', context);
  }
  Sentry.captureException(error);
};

/**
 * Captura uma mensagem
 * @param message - Mensagem a ser capturada
 * @param level - Nível da mensagem
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Define o usuário no contexto do Sentry
 * @param user - Informações do usuário
 */
export const setUser = (user: {
  id?: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser(user);
};

/**
 * Limpa o contexto do usuário
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Adiciona breadcrumb (rastro de navegação/ações)
 * @param breadcrumb - Breadcrumb a ser adicionado
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};
