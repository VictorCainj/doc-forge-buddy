/**
 * @fileoverview Tipos específicos para autenticação
 * @description Melhora a tipagem e tratamento de erros de autenticação
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

/**
 * Interface para erros de autenticação
 * @description Estrutura base para erros relacionados à autenticação
 */
export interface AuthError {
  /** Mensagem descritiva do erro */
  message: string;
  /** Código de erro específico (opcional) */
  code?: string;
  /** Código de status HTTP (opcional) */
  status?: number;
}

/**
 * Enum para tipos de erro de login
 * @description Classificação específica dos tipos de erro de login
 */
export type LoginErrorType = 
  | 'INVALID_CREDENTIALS'    /** Credenciais inválidas */
  | 'EMAIL_NOT_CONFIRMED'    /** Email não confirmado */
  | 'NETWORK_ERROR'          /** Erro de rede */
  | 'UNKNOWN_ERROR';         /** Erro desconhecido */

/**
 * Interface para erros de login específicos
 * @description Erro de login com tipagem específica do tipo de erro
 */
export interface LoginError extends AuthError {
  /** Tipo específico do erro de login */
  type: LoginErrorType;
}

/**
 * Analisa um erro de autenticação e retorna informações tipadas
 * @description Converte erros genéricos em erros de login tipados com mensagens amigáveis
 * @param error Erro desconhecido a ser analisado
 * @returns Erro tipado com informações específicas para o usuário
 * @example
 * ```typescript
 * const error = parseAuthError(supabaseError);
 * console.log(error.type); // 'INVALID_CREDENTIALS'
 * console.log(error.message); // 'Email ou senha incorretos'
 * ```
 */
export const parseAuthError = (error: unknown): LoginError => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;

    if (message.includes('Invalid login credentials')) {
      return {
        type: 'INVALID_CREDENTIALS',
        message: 'Email ou senha incorretos',
      };
    }

    if (message.includes('Email not confirmed')) {
      return {
        type: 'EMAIL_NOT_CONFIRMED',
        message: 'Por favor, verifique seu email antes de fazer login',
      };
    }

    if (message.includes('Network') || message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      };
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'Erro inesperado. Tente novamente.',
  };
};

/**
 * Interface para erros de banco de dados
 * @description Erros específicos relacionados a operações de banco de dados
 */
export interface DatabaseError extends AuthError {
  /** Tipo específico do erro de banco */
  type:
    | 'CONNECTION_ERROR'      /** Erro de conexão */
    | 'VALIDATION_ERROR'      /** Erro de validação de dados */
    | 'PERMISSION_ERROR'      /** Erro de permissão/acesso */
    | 'UNKNOWN_ERROR';        /** Erro desconhecido */
}

/**
 * Analisa erros de banco de dados
 * @description Converte erros de banco genéricos em erros tipados com mensagens específicas
 * @param error Erro desconhecido a ser analisado
 * @returns Erro de banco de dados tipado
 * @example
 * ```typescript
 * const error = parseDatabaseError(dbError);
 * if (error.type === 'CONNECTION_ERROR') {
 *   console.log('Problema de conexão com banco');
 * }
 * ```
 */
export const parseDatabaseError = (error: unknown): DatabaseError => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;

    if (message.includes('connection') || message.includes('network')) {
      return {
        type: 'CONNECTION_ERROR',
        message: 'Erro de conexão com o banco de dados',
      };
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        type: 'PERMISSION_ERROR',
        message: 'Sem permissão para realizar esta operação',
      };
    }

    if (message.includes('validation') || message.includes('constraint')) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Dados inválidos fornecidos',
      };
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'Erro inesperado no banco de dados',
  };
};
