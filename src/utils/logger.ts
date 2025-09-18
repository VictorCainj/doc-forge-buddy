/**
 * Sistema de logging condicional
 * Remove automaticamente logs em produção para melhor performance e segurança
 */
/* eslint-disable no-console */

// type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const isDevelopment = import.meta.env.DEV;

/**
 * Logger principal do sistema
 * - Em desenvolvimento: mostra todos os logs
 * - Em produção: mostra apenas erros
 */
export const logger: Logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // Erros sempre devem ser logados, mesmo em produção
    console.error(`[ERROR] ${message}`, ...args);
  },
};

/**
 * Hook para logging em componentes React
 * @returns Logger configurado
 */
export const useLogger = (): Logger => {
  return logger;
};

/**
 * Logger específico para desenvolvimento
 * @param component Nome do componente
 * @returns Logger com contexto do componente
 */
export const createComponentLogger = (component: string): Logger => {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        console.debug(`[${component}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        console.info(`[${component}] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        console.warn(`[${component}] ${message}`, ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${component}] ${message}`, ...args);
    },
  };
};

/**
 * Logger para operações de banco de dados
 */
export const dbLogger = createComponentLogger('DATABASE');

/**
 * Logger para operações de autenticação
 */
export const authLogger = createComponentLogger('AUTH');

/**
 * Logger para operações de formulário
 */
export const formLogger = createComponentLogger('FORM');
