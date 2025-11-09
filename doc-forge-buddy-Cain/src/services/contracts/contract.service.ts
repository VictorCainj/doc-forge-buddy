/**
 * Implementação do ContractService
 * Serviço específico para lógica de negócio de contratos
 */

import { BaseService } from '@/services/core/base-service';
import { 
  IContractService,
  ContractFilters,
  ContractMetrics,
  ContractRenewalData,
  ContractTerminationData,
  ContractCalculationResult
} from './contract-service.interface';
import { 
  Contract, 
  CreateContractData, 
  UpdateContractData,
  ContractFormData,
  DocumentType,
  ContractStatus
} from '@/types/domain/contract';
import { 
  SearchFilters, 
  PaginationOptions, 
  PaginatedResult, 
  OperationCallbacks,
  ApiResponse 
} from '@/types/domain/common';
import { ContractRepository } from './contract.repository';
import { NotificationService } from '@/services/notifications/notification.service';
import { ValidationService } from '@/services/validation/validation.service';
import { EventBus } from '@/services/events/event-bus';

export class ContractService extends BaseService<Contract, CreateContractData, UpdateContractData> implements IContractService {
  private repository: ContractRepository;
  private notificationService: NotificationService;
  private validationService: ValidationService;
  private eventBus: EventBus;

  constructor() {
    super(
      {
        name: 'ContractService',
        version: '1.0.0',
        enableMetrics: true,
        enableValidation: true,
        enableLogging: true
      },
      {
        metadata: { service: 'contracts' }
      }
    );

    this.repository = new ContractRepository();
    this.notificationService = new NotificationService();
    this.validationService = new ValidationService();
    this.eventBus = new EventBus();

    // Registrar event handlers
    this.setupEventHandlers();
  }

  // === Renewal Operations ===
  async renewContract(id: string, renewalData: ContractRenewalData, callbacks?: OperationCallbacks<Contract>): Promise<Contract> {
    return this.executeWithMetrics('renewContract', async () => {
      // Verificar se o contrato existe
      const contract = await this.findById(id);
      if (!contract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      // Verificar se pode renovar
      const canRenew = await this.canRenewContract(id);
      if (!canRenew.canRenew) {
        throw new Error(`Cannot renew contract: ${canRenew.reason}`);
      }

      // Validação de datas
      if (new Date(renewalData.newEndDate) <= new Date(contract.form_data.dataTerminoRescisao || contract.form_data.dataFirmamentoContrato || '')) {
        throw new Error('New end date must be after current end date');
      }

      // Executar renovação em transação
      return this.executeInTransaction(async () => {
        // Atualizar dados do contrato
        const updatedData: UpdateContractData = {
          form_data: {
            ...contract.form_data,
            dataTerminoRescisao: renewalData.newEndDate,
            dataInicioRescisao: renewalData.newStartDate || contract.form_data.dataInicioRescisao,
            ...renewalData.updatedTerms
          },
          updated_at: new Date().toISOString()
        };

        const renewedContract = await this.update(id, updatedData);
        
        // Atualizar status para renewed
        const finalContract = await this.updateContractStatus(
          id, 
          'renewed', 
          `Contract renewed: ${renewalData.renewalReason || 'No reason provided'}`
        );

        // Publicar evento
        await this.publishEvent({
          type: 'contract.renewed',
          contractId: id,
          renewalData,
          contract: finalContract,
          timestamp: new Date().toISOString()
        });

        // Notificações
        await this.notificationService.notifyContractRenewed(finalContract);

        callbacks?.onSuccess?.('renew', finalContract);
        return finalContract;
      });
    });
  }

  async canRenewContract(id: string): Promise<{ canRenew: boolean; reason?: string }> {
    const contract = await this.findById(id);
    if (!contract) {
      return { canRenew: false, reason: 'Contract not found' };
    }

    if (contract.status === 'cancelled') {
      return { canRenew: false, reason: 'Cancelled contracts cannot be renewed' };
    }

    if (contract.status === 'expired') {
      return { canRenew: false, reason: 'Expired contracts require a new contract' };
    }

    // Verificar se já foi renovado recentemente
    const recentContracts = await this.findRelatedContracts(id, 'documentType');
    if (recentContracts.some(c => c.status === 'renewed')) {
      return { canRenew: false, reason: 'Contract already renewed' };
    }

    return { canRenew: true };
  }

  // === Termination Operations ===
  async terminateContract(id: string, terminationData: ContractTerminationData, callbacks?: OperationCallbacks<Contract>): Promise<Contract> {
    return this.executeWithMetrics('terminateContract', async () => {
      const contract = await this.findById(id);
      if (!contract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      const canTerminate = await this.canTerminateContract(id);
      if (!canTerminate.canTerminate) {
        throw new Error(`Cannot terminate contract: ${canTerminate.reason}`);
      }

      return this.executeInTransaction(async () => {
        // Atualizar dados do contrato com informações de terminação
        const updatedData: UpdateContractData = {
          form_data: {
            ...contract.form_data,
            dataTerminoRescisao: terminationData.terminationDate,
            observacao: `${contract.form_data.observacao || ''}\nTermination: ${terminationData.reason}`.trim()
          },
          updated_at: new Date().toISOString()
        };

        const updatedContract = await this.update(id, updatedData);
        
        // Atualizar status para terminated/rescinded
        const status: ContractStatus = terminationData.terminationType === 'expiration' ? 'expired' : 'cancelled';
        const finalContract = await this.updateContractStatus(id, status, terminationData.reason);

        // Publicar evento
        await this.publishEvent({
          type: 'contract.terminated',
          contractId: id,
          terminationData,
          contract: finalContract,
          timestamp: new Date().toISOString()
        });

        // Notificações
        await this.notificationService.notifyContractTerminated(finalContract, terminationData);

        callbacks?.onSuccess?.('terminate', finalContract);
        return finalContract;
      });
    });
  }

  async canTerminateContract(id: string): Promise<{ canTerminate: boolean; reason?: string }> {
    const contract = await this.findById(id);
    if (!contract) {
      return { canTerminate: false, reason: 'Contract not found' };
    }

    if (contract.status === 'cancelled') {
      return { canTerminate: false, reason: 'Contract already terminated' };
    }

    if (contract.status === 'expired') {
      return { canTerminate: false, reason: 'Expired contracts cannot be terminated' };
    }

    return { canTerminate: true };
  }

  // === Property-based Operations ===
  async getContractsByProperty(propertyId: string, filters?: ContractFilters, options?: PaginationOptions): Promise<PaginatedResult<Contract>> {
    return this.executeWithMetrics('getContractsByProperty', async () => {
      const enhancedFilters: ContractFilters = {
        ...filters,
        metadata: { ...filters?.metadata, propertyId }
      };

      return this.findManyPaginated(enhancedFilters, options);
    });
  }

  async hasActiveContractsForProperty(propertyId: string): Promise<boolean> {
    const result = await this.getContractsByProperty(propertyId, { status: 'active' });
    return result.data.length > 0;
  }

  // === Metrics and Analytics ===
  async calculateContractMetrics(contractId: string): Promise<ContractMetrics> {
    return this.executeWithMetrics('calculateContractMetrics', async () => {
      const contract = await this.findById(contractId);
      if (!contract) {
        throw new Error(`Contract with id ${contractId} not found`);
      }

      const startDate = new Date(contract.form_data.dataFirmamentoContrato || contract.created_at);
      const endDate = new Date(contract.form_data.dataTerminoRescisao || new Date());
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        total: 1,
        byStatus: { [contract.status]: 1 },
        byDocumentType: { [contract.document_type as DocumentType]: 1 },
        averageDuration: duration,
        completionRate: contract.status === 'completed' ? 100 : 0,
        recentActivity: {
          created: 1,
          updated: 0,
          terminated: contract.status === 'cancelled' ? 1 : 0
        }
      };
    });
  }

  async calculateGlobalMetrics(filters?: ContractFilters): Promise<ContractCalculationResult> {
    return this.executeWithMetrics('calculateGlobalMetrics', async () => {
      const contracts = await this.findMany(filters);
      const total = contracts.length;

      // Calcular métricas por status
      const byStatus = contracts.reduce((acc, contract) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {} as Record<ContractStatus, number>);

      // Calcular métricas por tipo de documento
      const byDocumentType = contracts.reduce((acc, contract) => {
        const docType = contract.document_type as DocumentType;
        acc[docType] = (acc[docType] || 0) + 1;
        return acc;
      }, {} as Record<DocumentType, number>);

      // Calcular taxa de conclusão
      const completed = contracts.filter(c => c.status === 'completed').length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Atividade recente
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentActivity = {
        created: contracts.filter(c => new Date(c.created_at) > oneWeekAgo).length,
        updated: contracts.filter(c => new Date(c.updated_at) > oneWeekAgo && c.status !== 'created').length,
        terminated: contracts.filter(c => 
          (c.status === 'cancelled' || c.status === 'expired') && 
          new Date(c.updated_at) > oneWeekAgo
        ).length
      };

      // Gerar insights e recomendações
      const insights: string[] = [];
      const recommendations: string[] = [];
      const alerts: Array<{ type: 'warning' | 'critical' | 'info'; message: string; contractId?: string }> = [];

      if (completionRate < 50) {
        insights.push('Baixa taxa de conclusão de contratos');
        recommendations.push('Revisar processos de acompanhamento de contratos');
      }

      if (byStatus.pending > total * 0.3) {
        alerts.push({
          type: 'warning',
          message: 'Alto número de contratos pendentes',
        });
      }

      // Verificar contratos próximos ao vencimento
      const expiringSoon = contracts.filter(c => {
        const endDate = new Date(c.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      if (expiringSoon.length > 0) {
        alerts.push({
          type: 'info',
          message: `${expiringSoon.length} contrato(s) próximo(s) ao vencimento`,
        });
      }

      return {
        metrics: {
          total,
          byStatus,
          byDocumentType,
          completionRate,
          recentActivity
        },
        insights,
        recommendations,
        alerts
      };
    });
  }

  async generateReport(reportType: 'summary' | 'detailed' | 'analytics', filters?: ContractFilters): Promise<unknown> {
    return this.executeWithMetrics('generateReport', async () => {
      switch (reportType) {
        case 'summary':
          const metrics = await this.calculateGlobalMetrics(filters);
          return {
            type: 'summary',
            generatedAt: new Date().toISOString(),
            filters,
            metrics: metrics.metrics
          };

        case 'analytics':
          const detailedMetrics = await this.calculateGlobalMetrics(filters);
          return {
            type: 'analytics',
            generatedAt: new Date().toISOString(),
            filters,
            ...detailedMetrics
          };

        case 'detailed':
          const contracts = await this.findMany(filters);
          return {
            type: 'detailed',
            generatedAt: new Date().toISOString(),
            filters,
            contracts,
            count: contracts.length
          };

        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
    });
  }

  // === Template and Generation ===
  async generateContractContent(contractId: string, templateType: DocumentType): Promise<string> {
    return this.executeWithMetrics('generateContractContent', async () => {
      const contract = await this.findById(contractId);
      if (!contract) {
        throw new Error(`Contract with id ${contractId} not found`);
      }

      // Implementar lógica de geração de conteúdo baseada em template
      // Esta é uma implementação simplificada
      const templateEngine = await this.getTemplateEngine();
      return templateEngine.generate(templateType, contract.form_data);
    });
  }

  async updateContractFormData(contractId: string, formData: Partial<ContractFormData>, callbacks?: OperationCallbacks<Contract>): Promise<Contract> {
    return this.executeWithMetrics('updateContractFormData', async () => {
      const contract = await this.findById(contractId);
      if (!contract) {
        throw new Error(`Contract with id ${contractId} not found`);
      }

      // Validar dados do formulário
      const validation = await this.validateContractFormData({
        ...contract.form_data,
        ...formData
      });

      if (!validation.isValid) {
        throw new Error(`Form data validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const updatedData: UpdateContractData = {
        form_data: {
          ...contract.form_data,
          ...formData
        },
        updated_at: new Date().toISOString()
      };

      const updatedContract = await this.update(contractId, updatedData);

      await this.publishEvent({
        type: 'contract.formDataUpdated',
        contractId,
        changes: formData,
        timestamp: new Date().toISOString()
      });

      callbacks?.onSuccess?.('update', updatedContract);
      return updatedContract;
    });
  }

  // === Search and Filtering ===
  async searchContracts(
    searchQuery: string, 
    filters?: ContractFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<Contract>> {
    return this.executeWithMetrics('searchContracts', async () => {
      const searchFilters: ContractFilters = {
        ...filters,
        query: searchQuery
      };

      return this.findManyPaginated(searchFilters, options);
    });
  }

  async findRelatedContracts(contractId: string, relationshipType: 'client' | 'property' | 'documentType'): Promise<Contract[]> {
    return this.executeWithMetrics('findRelatedContracts', async () => {
      const contract = await this.findById(contractId);
      if (!contract) {
        throw new Error(`Contract with id ${contractId} not found`);
      }

      const filters: ContractFilters = {};
      
      switch (relationshipType) {
        case 'client':
          filters.clientName = contract.form_data.nomeLocatario;
          break;
        case 'property':
          filters.propertyAddress = contract.form_data.enderecoImovel;
          break;
        case 'documentType':
          filters.documentType = contract.document_type as DocumentType;
          break;
      }

      const relatedContracts = await this.findMany(filters);
      return relatedContracts.filter(c => c.id !== contractId); // Excluir o contrato atual
    });
  }

  // === Status Management ===
  async updateContractStatus(
    id: string, 
    status: ContractStatus, 
    reason?: string, 
    callbacks?: OperationCallbacks<Contract>
  ): Promise<Contract> {
    return this.executeWithMetrics('updateContractStatus', async () => {
      const contract = await this.findById(id);
      if (!contract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      const updatedData: UpdateContractData = {
        ...contract,
        status,
        updated_at: new Date().toISOString()
      };

      const updatedContract = await this.update(id, updatedData);

      await this.publishEvent({
        type: 'contract.statusChanged',
        contractId: id,
        oldStatus: contract.status,
        newStatus: status,
        reason,
        timestamp: new Date().toISOString()
      });

      callbacks?.onSuccess?.('update', updatedContract);
      return updatedContract;
    });
  }

  async getContractsNeedingAttention(): Promise<Array<{
    contract: Contract;
    attentionType: 'expiring' | 'overdue' | 'missing_documents' | 'pending_renewal';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>> {
    return this.executeWithMetrics('getContractsNeedingAttention', async () => {
      const contracts = await this.findMany({ status: 'active' });
      const attentionItems: Array<{
        contract: Contract;
        attentionType: 'expiring' | 'overdue' | 'missing_documents' | 'pending_renewal';
        priority: 'low' | 'medium' | 'high' | 'critical';
      }> = [];

      for (const contract of contracts) {
        const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
        const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          attentionItems.push({
            contract,
            attentionType: 'overdue',
            priority: 'critical'
          });
        } else if (daysUntilExpiry <= 30) {
          attentionItems.push({
            contract,
            attentionType: 'expiring',
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
          });
        }

        // Verificar se precisa de renovação
        const canRenew = await this.canRenewContract(contract.id);
        if (canRenew.canRenew && daysUntilExpiry <= 60) {
          attentionItems.push({
            contract,
            attentionType: 'pending_renewal',
            priority: 'medium'
          });
        }
      }

      return attentionItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });
  }

  // === Favorites and Tags ===
  async addToFavorites(contractId: string): Promise<void> {
    return this.executeWithMetrics('addToFavorites', async () => {
      await this.repository.addToFavorites(contractId);
      await this.publishEvent({
        type: 'contract.addedToFavorites',
        contractId,
        timestamp: new Date().toISOString()
      });
    });
  }

  async removeFromFavorites(contractId: string): Promise<void> {
    return this.executeWithMetrics('removeFromFavorites', async () => {
      await this.repository.removeFromFavorites(contractId);
      await this.publishEvent({
        type: 'contract.removedFromFavorites',
        contractId,
        timestamp: new Date().toISOString()
      });
    });
  }

  async addTag(contractId: string, tagName: string, color: string): Promise<void> {
    return this.executeWithMetrics('addTag', async () => {
      await this.repository.addTag(contractId, tagName, color);
      await this.publishEvent({
        type: 'contract.tagAdded',
        contractId,
        tagName,
        color,
        timestamp: new Date().toISOString()
      });
    });
  }

  async removeTag(contractId: string, tagName: string): Promise<void> {
    return this.executeWithMetrics('removeTag', async () => {
      await this.repository.removeTag(contractId, tagName);
      await this.publishEvent({
        type: 'contract.tagRemoved',
        contractId,
        tagName,
        timestamp: new Date().toISOString()
      });
    });
  }

  async getContractTags(contractId: string): Promise<Array<{ name: string; color: string; isAutomatic: boolean }>> {
    return this.executeWithMetrics('getContractTags', async () => {
      return await this.repository.getContractTags(contractId);
    });
  }

  // === Bulk Operations ===
  async bulkOperation(
    operation: 'update_status' | 'add_tags' | 'remove_tags' | 'archive',
    contractIds: string[],
    data?: unknown
  ): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> {
    return this.executeWithMetrics('bulkOperation', async () => {
      let success = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const contractId of contractIds) {
        try {
          switch (operation) {
            case 'update_status':
              await this.updateContractStatus(contractId, data as ContractStatus);
              break;
            case 'add_tags':
              const { tagName, color } = data as { tagName: string; color: string };
              await this.addTag(contractId, tagName, color);
              break;
            case 'remove_tags':
              const { tagName: removeTagName } = data as { tagName: string };
              await this.removeTag(contractId, removeTagName);
              break;
            case 'archive':
              await this.updateContractStatus(contractId, 'cancelled', 'Archived in bulk operation');
              break;
          }
          success++;
        } catch (error) {
          failed++;
          errors.push({
            id: contractId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      await this.publishEvent({
        type: 'contract.bulkOperation',
        operation,
        contractIds,
        success,
        failed,
        errors,
        timestamp: new Date().toISOString()
      });

      return { success, failed, errors };
    });
  }

  // === Validation ===
  async validateContractFormData(formData: ContractFormData): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
    suggestions: string[];
  }> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const suggestions: string[] = [];

    // Validações básicas
    if (!formData.nomeLocatario?.trim()) {
      errors.push({ field: 'nomeLocatario', message: 'Nome do locatário é obrigatório', severity: 'error' });
    }

    if (!formData.enderecoImovel?.trim()) {
      errors.push({ field: 'enderecoImovel', message: 'Endereço do imóvel é obrigatório', severity: 'error' });
    }

    // Validar datas
    if (formData.dataFirmamentoContrato && formData.dataTerminoRescisao) {
      const startDate = new Date(formData.dataFirmamentoContrato);
      const endDate = new Date(formData.dataTerminoRescisao);
      
      if (endDate <= startDate) {
        errors.push({ 
          field: 'dataTerminoRescisao', 
          message: 'Data de término deve ser posterior à data de início', 
          severity: 'error' 
        });
      }
    }

    // Sugestões
    if (formData.nomeLocatario && !formData.primeiroNomeLocatario) {
      suggestions.push('Considere preencher o primeiro nome do locatário para melhor personalização');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  async isContractNumberUnique(contractNumber: string, excludeId?: string): Promise<boolean> {
    return this.executeWithMetrics('isContractNumberUnique', async () => {
      const filters: SearchFilters = {
        metadata: { contractNumber }
      };

      const existingContracts = await this.findMany(filters);
      
      if (excludeId) {
        return existingContracts.every(c => c.id !== excludeId);
      }

      return existingContracts.length === 0;
    });
  }

  // === Protected Methods (BaseService Implementation) ===
  protected doCreate(data: CreateContractData): Promise<Contract> {
    return this.repository.create(data);
  }

  protected doUpdate(id: string, data: UpdateContractData): Promise<Contract> {
    return this.repository.update(id, data);
  }

  protected doDelete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  protected doFindById(id: string): Promise<Contract | null> {
    return this.repository.findById(id);
  }

  protected doFindMany(filters?: SearchFilters, options?: PaginationOptions): Promise<Contract[]> {
    return this.repository.findMany(filters, options);
  }

  protected doFindManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<Contract>> {
    return this.repository.findManyPaginated(filters, options);
  }

  protected doExists(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }

  protected doCount(filters?: SearchFilters): Promise<number> {
    return this.repository.count(filters);
  }

  // === Private Methods ===
  private async getTemplateEngine(): Promise<{ generate: (templateType: DocumentType, data: ContractFormData) => string }> {
    // Implementação simplificada do template engine
    return {
      generate: (templateType, data) => {
        // Esta é uma implementação simplificada
        // Na prática, seria um sistema mais robusto de templates
        return `Template: ${templateType}\nData: ${JSON.stringify(data, null, 2)}`;
      }
    };
  }

  private setupEventHandlers(): void {
    // Registrar handlers para eventos do sistema
    this.eventBus.on('contract.*', (event) => {
      console.log('Contract event received:', event);
    });
  }
}