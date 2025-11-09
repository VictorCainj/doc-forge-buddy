/**
 * Erro customizado para operações de repository
 * Padroniza o tratamento de erros em todas as operações de dados
 */

import { DatabaseError, parseDatabaseError } from '@/types/domain/auth';

export enum RepositoryErrorType {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNIQUE_CONSTRAINT = 'UNIQUE_CONSTRAINT',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  BULK_OPERATION_ERROR = 'BULK_OPERATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class RepositoryError extends Error {
  public readonly type: RepositoryErrorType;
  public readonly code?: string;
  public readonly status?: number;
  public readonly originalError?: unknown;
  public readonly entity?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    type: RepositoryErrorType = RepositoryErrorType.UNKNOWN_ERROR,
    originalError?: unknown,
    entity?: string,
    operation?: string
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.type = type;
    this.originalError = originalError;
    this.entity = entity;
    this.operation = operation;

    // Extrai informações adicionais do erro original
    if (originalError && typeof originalError === 'object') {
      const error = originalError as { code?: string; status?: number; message?: string };
      this.code = error.code;
      this.status = error.status;
    }

    // Garante que a pilha de erros seja preservada
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }

  /**
   * Cria erro para entidade não encontrada
   */
  static notFound(entity: string, id: string): RepositoryError {
    return new RepositoryError(
      `Entidade ${entity} com ID ${id} não encontrada`,
      RepositoryErrorType.NOT_FOUND,
      null,
      entity,
      'findById'
    );
  }

  /**
   * Cria erro para validação
   */
  static validation(message: string, originalError?: unknown, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.VALIDATION_ERROR,
      originalError,
      entity,
      'validation'
    );
  }

  /**
   * Cria erro para conexão
   */
  static connection(message: string, originalError?: unknown, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.CONNECTION_ERROR,
      originalError,
      entity,
      'connection'
    );
  }

  /**
   * Cria erro para permissão
   */
  static permission(message: string, originalError?: unknown, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.PERMISSION_ERROR,
      originalError,
      entity,
      'permission'
    );
  }

  /**
   * Cria erro para constraint única
   */
  static uniqueConstraint(field: string, value: any, entity?: string): RepositoryError {
    return new RepositoryError(
      `Valor '${value}' para o campo '${field}' já existe`,
      RepositoryErrorType.UNIQUE_CONSTRAINT,
      null,
      entity,
      'create'
    );
  }

  /**
   * Cria erro para constraint de chave estrangeira
   */
  static foreignKeyConstraint(message: string, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.FOREIGN_KEY_CONSTRAINT,
      null,
      entity,
      'foreign_key'
    );
  }

  /**
   * Cria erro para transação
   */
  static transaction(message: string, originalError?: unknown, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.TRANSACTION_ERROR,
      originalError,
      entity,
      'transaction'
    );
  }

  /**
   * Cria erro para operação em lote
   */
  static bulkOperation(message: string, originalError?: unknown, entity?: string): RepositoryError {
    return new RepositoryError(
      message,
      RepositoryErrorType.BULK_OPERATION_ERROR,
      originalError,
      entity,
      'bulk_operation'
    );
  }

  /**
   * Converte erro desconhecido para RepositoryError
   */
  static fromUnknown(error: unknown, entity?: string, operation?: string): RepositoryError {
    if (error instanceof RepositoryError) {
      return error;
    }

    // Converte para DatabaseError se possível
    if (error && typeof error === 'object') {
      const dbError = parseDatabaseError(error);
      return new RepositoryError(
        dbError.message,
        RepositoryErrorType.CONNECTION_ERROR,
        error,
        entity,
        operation
      );
    }

    return new RepositoryError(
      error instanceof Error ? error.message : 'Erro desconhecido',
      RepositoryErrorType.UNKNOWN_ERROR,
      error,
      entity,
      operation
    );
  }

  /**
   * Converte para string com informações detalhadas
   */
  toString(): string {
    const parts = [
      `[${this.type}] ${this.message}`,
      this.entity && `Entidade: ${this.entity}`,
      this.operation && `Operação: ${this.operation}`,
      this.code && `Código: ${this.code}`,
      this.status && `Status: ${this.status}`
    ].filter(Boolean);

    return parts.join(' | ');
  }

  /**
   * Converte para JSON para logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      status: this.status,
      entity: this.entity,
      operation: this.operation,
      stack: this.stack,
      originalError: this.originalError
    };
  }
}