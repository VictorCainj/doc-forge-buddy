/**
 * Tipos específicos para tratamento de erros de autenticação
 * Melhora a tipagem e tratamento de erros
 */

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoginError extends AuthError {
  type:
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_NOT_CONFIRMED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
}

/**
 * Analisa um erro de autenticação e retorna informações tipadas
 * @param error Erro desconhecido
 * @returns Erro tipado com informações específicas
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
 */
export interface DatabaseError extends AuthError {
  type:
    | 'CONNECTION_ERROR'
    | 'VALIDATION_ERROR'
    | 'PERMISSION_ERROR'
    | 'UNKNOWN_ERROR';
}

/**
 * Analisa erros de banco de dados
 * @param error Erro desconhecido
 * @returns Erro tipado de banco de dados
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
