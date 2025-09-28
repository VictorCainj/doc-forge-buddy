/**
 * Utilitário de logging para substituir // console statements
 * Permite controle de nível de log e facilita debugging em produção
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(_message: string, ..._args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      // console.debug(`[DEBUG] ${_message}`, ..._args);
    }
  }

  info(_message: string, ..._args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      // console.info(`[INFO] ${_message}`, ..._args);
    }
  }

  warn(_message: string, ..._args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      // console.warn(`[WARN] ${_message}`, ..._args);
    }
  }

  error(_message: string, ..._args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      // console.error(`[ERROR] ${_message}`, ..._args);
    }
  }

  // Método para logs que devem sempre aparecer (críticos)
  critical(_message: string, ..._args: unknown[]) {
    // console.error(`[CRITICAL] ${_message}`, ..._args);
  }
}

// Instância global do logger
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para autenticação
export const authLogger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para banco de dados
export const dbLogger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
);

// Logger específico para formulários
export const formLogger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
);

// Funções de conveniência para uso direto
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
