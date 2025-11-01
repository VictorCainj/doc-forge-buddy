/**
 * Utilitário de logging para substituir console statements
 * Permite controle de nível de log e facilita debugging em produção
 * REMOVE TODOS OS LOGS EM PRODUÇÃO para melhorar performance e segurança
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private isProduction: boolean;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
    this.isProduction = import.meta.env.PROD;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    // Warnings sempre aparecem, mas apenas em desenvolvimento
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    // Errors sempre aparecem em desenvolvimento, mas não em produção para evitar console errors
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, ...args);
    }
    // Em produção, apenas registrar no Sentry ou sistema de monitoramento
  }

  // Método para logs que devem sempre aparecer (críticos)
  critical(message: string, ...args: unknown[]) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[CRITICAL] ${message}`, ...args);
    }
  }
}

// Instância global do logger
export const logger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para autenticação
export const authLogger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para banco de dados
export const dbLogger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para formulários
export const formLogger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN
);

// Funções de conveniência para uso direto
// Estas funções NÃO aparecem no console em produção
export const log = {
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, ...args),
  critical: (message: string, ...args: unknown[]) =>
    logger.critical(message, ...args),
};
