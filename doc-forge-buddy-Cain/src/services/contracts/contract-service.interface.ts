/**
 * @fileoverview Interface do ContractService
 * @description Interface específica para o serviço de contratos que extende IService com métodos específicos de negócio
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

import { IService } from '@/services/core/interfaces';
import { 
  Contract, 
  CreateContractData, 
  UpdateContractData,
  ContractFormData,
  DocumentType,
  VistoriaType
} from '@/types/domain/contract';
import { SearchFilters, PaginationOptions, PaginatedResult, OperationCallbacks } from '@/types/domain/common';

/**
 * Filtros específicos para contratos
 * @description Estende SearchFilters com campos específicos para filtrar contratos
 */
export interface ContractFilters extends SearchFilters {
  /** Status do contrato */
  status?: ContractStatus;
  /** Tipo de documento */
  documentType?: DocumentType;
  /** Endereço do imóvel */
  propertyAddress?: string;
  /** Nome do cliente */
  clientName?: string;
  /** Intervalo de datas */
  dateRange?: {
    /** Data de início */
    start: string;
    /** Data de fim */
    end: string;
  };
  /** Tags associadas */
  tags?: string[];
  /** Contratos favoritos apenas */
  isFavorite?: boolean;
  /** Tipo de vistoria */
  vistoriaType?: VistoriaType;
}

/**
 * Status de contrato expandido
 * @description Status possíveis para um contrato durante seu ciclo de vida
 */
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled' | 'renewed' | 'rescinded';

/**
 * Métricas específicas de contrato
 * @description Estrutura para armazenar métricas e estatísticas de contratos
 */
export interface ContractMetrics {
  /** Total de contratos */
  total: number;
  /** Distribuição por status */
  byStatus: Record<ContractStatus, number>;
  /** Distribuição por tipo de documento */
  byDocumentType: Record<DocumentType, number>;
  /** Duração média dos contratos em dias (opcional) */
  averageDuration?: number;
  /** Taxa de conclusão em porcentagem */
  completionRate: number;
  /** Atividade recente */
  recentActivity: {
    /** Contratos criados recentemente */
    created: number;
    /** Contratos atualizados recentemente */
    updated: number;
    /** Contratos terminados recentemente */
    terminated: number;
  };
}

/**
 * Dados para renewal de contrato
 * @description Estrutura para dados necessários na renovação de um contrato
 */
export interface ContractRenewalData {
  /** Nova data de fim do contrato */
  newEndDate: string;
  /** Nova data de início (opcional, padrão: data atual) */
  newStartDate?: string;
  /** Motivo da renovação (opcional) */
  renewalReason?: string;
  /** Termos atualizados (opcional) */
  updatedTerms?: Partial<ContractFormData>;
}

/**
 * Dados para terminação de contrato
 * @description Estrutura para dados necessários na terminação de um contrato
 */
export interface ContractTerminationData {
  /** Data de terminação */
  terminationDate: string;
  /** Motivo da terminação */
  reason: string;
  /** Tipo de terminação */
  terminationType: 'mutual' | 'unilateral' | 'breach' | 'expiration';
  /** Condição do imóvel (opcional) */
  propertyCondition?: 'good' | 'fair' | 'poor' | 'damage';
  /** Valor de possíveis danos (opcional) */
  damagesAmount?: number;
  /** Data de devolução das chaves (opcional) */
  returnDate?: string;
}

/**
 * Resultado de cálculo de métricas
 * @description Estrutura para resultados de cálculos de métricas de contratos
 */
export interface ContractCalculationResult {
  /** Métricas calculadas */
  metrics: ContractMetrics;
  /** Insights derivados das métricas */
  insights: string[];
  /** Recomendações baseadas nos dados */
  recommendations: string[];
  /** Alertas e notificações */
  alerts: Array<{
    /** Tipo do alerta */
    type: 'warning' | 'critical' | 'info';
    /** Mensagem do alerta */
    message: string;
    /** ID do contrato associado (opcional) */
    contractId?: string;
  }>;
}

/**
 * Interface principal do ContractService
 * @description Interface específica para serviços de contrato que extende IService
 */
export interface IContractService extends IService<Contract, CreateContractData, UpdateContractData> {
  // === Renewal Operations ===
  /**
   * Renova um contrato existente
   * @param id ID do contrato a ser renovado
   * @param renewalData Dados necessários para renovação
   * @param callbacks Callbacks de operação (opcional)
   * @returns Promise com o contrato renovado
   * @example
   * ```typescript
   * await contractService.renewContract('contract-123', {
   *   newEndDate: '2025-12-31',
   *   renewalReason: 'Renovação anual'
   * });
   * ```
   * @returns Promise com contrato renovado
   */
  renewContract(id: string, renewalData: ContractRenewalData, callbacks?: OperationCallbacks<Contract>): Promise<Contract>;
  
  /**
   * Verifica se um contrato pode ser renovado
   * @param id ID do contrato
   * @returns Promise com resultado da verificação
   */
  canRenewContract(id: string): Promise<{ canRenew: boolean; reason?: string }>;

  // === Termination Operations ===
  /**
   * Termina um contrato
   * @param id ID do contrato
   * @param terminationData Dados da terminação
   * @param callbacks Callbacks de operação
   * @returns Promise com contrato terminado
   */
  terminateContract(id: string, terminationData: ContractTerminationData, callbacks?: OperationCallbacks<Contract>): Promise<Contract>;
  
  /**
   * Verifica se um contrato pode ser terminado
   * @param id ID do contrato
   * @returns Promise com resultado da verificação
   */
  canTerminateContract(id: string): Promise<{ canTerminate: boolean; reason?: string }>;

  // === Property-based Operations ===
  /**
   * Busca contratos por propriedade
   * @param propertyId ID da propriedade
   * @param filters Filtros adicionais
   * @param options Opções de paginação
   * @returns Promise com lista de contratos
   */
  getContractsByProperty(propertyId: string, filters?: ContractFilters, options?: PaginationOptions): Promise<PaginatedResult<Contract>>;
  
  /**
   * Verifica se há contratos ativos para uma propriedade
   * @param propertyId ID da propriedade
   * @returns Promise com resultado da verificação
   */
  hasActiveContractsForProperty(propertyId: string): Promise<boolean>;

  // === Metrics and Analytics ===
  /**
   * Calcula métricas de um contrato específico
   * @param contractId ID do contrato
   * @returns Promise com métricas calculadas
   */
  calculateContractMetrics(contractId: string): Promise<ContractMetrics>;
  
  /**
   * Calcula métricas globais de todos os contratos
   * @param filters Filtros para cálculo das métricas
   * @returns Promise com métricas globais
   */
  calculateGlobalMetrics(filters?: ContractFilters): Promise<ContractCalculationResult>;
  
  /**
   * Gera relatório de contratos
   * @param reportType Tipo do relatório
   * @param filters Filtros para o relatório
   * @returns Promise com dados do relatório
   */
  generateReport(reportType: 'summary' | 'detailed' | 'analytics', filters?: ContractFilters): Promise<unknown>;

  // === Template and Generation ===
  /**
   * Gera conteúdo do contrato baseado no template
   * @param contractId ID do contrato
   * @param templateType Tipo do template
   * @returns Promise com conteúdo gerado
   */
  generateContractContent(contractId: string, templateType: DocumentType): Promise<string>;
  
  /**
   * Atualiza dados do formulário do contrato
   * @param contractId ID do contrato
   * @param formData Novos dados do formulário
   * @param callbacks Callbacks de operação
   * @returns Promise com contrato atualizado
   */
  updateContractFormData(contractId: string, formData: Partial<ContractFormData>, callbacks?: OperationCallbacks<Contract>): Promise<Contract>;

  // === Search and Filtering ===
  /**
   * Busca contratos com filtros avançados
   * @param searchQuery Query de busca textual
   * @param filters Filtros estruturados
   * @param options Opções de paginação
   * @returns Promise com resultado da busca
   */
  searchContracts(
    searchQuery: string, 
    filters?: ContractFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<Contract>>;
  
  /**
   * Busca contratos relacionados (mesmo cliente, propriedade, etc.)
   * @param contractId ID do contrato base
   * @param relationshipType Tipo de relacionamento
   * @returns Promise com contratos relacionados
   */
  findRelatedContracts(contractId: string, relationshipType: 'client' | 'property' | 'documentType'): Promise<Contract[]>;

  // === Status Management ===
  /**
   * Atualiza status do contrato
   * @param id ID do contrato
   * @param status Novo status
   * @param reason Razão da mudança
   * @param callbacks Callbacks de operação
   * @returns Promise com contrato atualizado
   */
  updateContractStatus(
    id: string, 
    status: ContractStatus, 
    reason?: string, 
    callbacks?: OperationCallbacks<Contract>
  ): Promise<Contract>;
  
  /**
   * Verifica contratos que precisam de ação
   * @returns Promise com lista de contratos que precisam de atenção
   */
  getContractsNeedingAttention(): Promise<Array<{
    contract: Contract;
    attentionType: 'expiring' | 'overdue' | 'missing_documents' | 'pending_renewal';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>>;

  // === Favorites and Tags ===
  /**
   * Adiciona contrato aos favoritos
   * @param contractId ID do contrato
   * @returns Promise<void>
   */
  addToFavorites(contractId: string): Promise<void>;
  
  /**
   * Remove contrato dos favoritos
   * @param contractId ID do contrato
   * @returns Promise<void>
   */
  removeFromFavorites(contractId: string): Promise<void>;
  
  /**
   * Adiciona tag ao contrato
   * @param contractId ID do contrato
   * @param tagName Nome da tag
   * @param color Cor da tag
   * @returns Promise<void>
   */
  addTag(contractId: string, tagName: string, color: string): Promise<void>;
  
  /**
   * Remove tag do contrato
   * @param contractId ID do contrato
   * @param tagName Nome da tag
   * @returns Promise<void>
   */
  removeTag(contractId: string, tagName: string): Promise<void>;
  
  /**
   * Lista tags do contrato
   * @param contractId ID do contrato
   * @returns Promise com lista de tags
   */
  getContractTags(contractId: string): Promise<Array<{ name: string; color: string; isAutomatic: boolean }>>;

  // === Bulk Operations ===
  /**
   * Operações em lote
   * @param operation Tipo da operação
   * @param contractIds IDs dos contratos
   * @param data Dados da operação
   * @returns Promise com resultado da operação em lote
   */
  bulkOperation(
    operation: 'update_status' | 'add_tags' | 'remove_tags' | 'archive',
    contractIds: string[],
    data?: unknown
  ): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }>;

  // === Validation ===
  /**
   * Valida dados do formulário de contrato
   * @param formData Dados do formulário
   * @returns Promise com resultado da validação
   */
  validateContractFormData(formData: ContractFormData): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
    suggestions: string[];
  }>;
  
  /**
   * Valida se um número de contrato é único
   * @param contractNumber Número do contrato
   * @param excludeId ID a ser excluído da verificação
   * @returns Promise com resultado da validação
   */
  isContractNumberUnique(contractNumber: string, excludeId?: string): Promise<boolean>;
}