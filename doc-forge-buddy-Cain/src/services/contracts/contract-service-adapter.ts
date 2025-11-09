/**
 * Adaptador para o novo ContractService
 * Mantém compatibilidade com os hooks React Query existentes
 * Substitui gradualmente o contractsService.ts antigo
 */

import { ContractService } from './contract.service';
import { Contract } from '@/types/domain/contract';
import { 
  ContractFilters, 
  ContractRenewalData, 
  ContractTerminationData,
  ContractMetrics,
  ContractCalculationResult 
} from './contract-service.interface';

// === TIPOS COMPATÍVEIS COM O HOOK ANTIGO ===

export interface LegacyContract {
  id: string;
  contractNumber: string;
  clientName: string;
  property: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalValue: number;
  paidValue: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyContractFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LegacyContractsListResponse {
  contracts: LegacyContract[];
  total: number;
  page: number;
  hasMore: boolean;
}

// === ADAPTADOR PRINCIPAL ===

class ContractServiceAdapter {
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
  }

  // === MÉTODOS COMPATÍVEIS COM HOOK ANTIGO ===

  /**
   * Buscar lista de contratos (compatível com hooks antigos)
   */
  async getContracts(filters: LegacyContractFilters = {}): Promise<LegacyContractsListResponse> {
    try {
      // Converter filtros legados para novos filtros
      const newFilters: ContractFilters = this.convertLegacyFilters(filters);
      
      // Buscar contratos usando o novo service
      const result = await this.contractService.findMany(newFilters);
      
      // Converter resultado para formato legacy
      return {
        contracts: result.map(contract => this.convertToLegacyContract(contract)),
        total: result.length,
        page: filters.page || 1,
        hasMore: result.length === (filters.limit || 50)
      };
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      throw new Error(`Erro ao buscar contratos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Buscar contrato por ID (compatível com hooks antigos)
   */
  async getContract(id: string): Promise<LegacyContract> {
    try {
      const contract = await this.contractService.findById(id);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }
      return this.convertToLegacyContract(contract);
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      throw new Error(`Erro ao buscar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Criar novo contrato (compatível com hooks antigos)
   */
  async createContract(contract: Omit<LegacyContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegacyContract> {
    try {
      // Converter dados legados para novo formato
      const createData = this.convertFromLegacyContract(contract);
      
      // Criar usando o novo service
      const newContract = await this.contractService.create(createData);
      
      return this.convertToLegacyContract(newContract);
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      throw new Error(`Erro ao criar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualizar contrato (compatível com hooks antigos)
   */
  async updateContract(id: string, updates: Partial<LegacyContract>): Promise<LegacyContract> {
    try {
      // Converter dados legados para novo formato
      const updateData = this.convertFromLegacyContract(updates);
      
      // Atualizar usando o novo service
      const updatedContract = await this.contractService.update(id, updateData);
      
      return this.convertToLegacyContract(updatedContract);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw new Error(`Erro ao atualizar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Deletar contrato (compatível com hooks antigos)
   */
  async deleteContract(id: string): Promise<void> {
    try {
      await this.contractService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      throw new Error(`Erro ao deletar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // === MÉTODOS NOVOS DO CONTRACT SERVICE ===

  /**
   * Renovar contrato (novo método)
   */
  async renewContract(id: string, renewalData: ContractRenewalData): Promise<Contract> {
    try {
      return await this.contractService.renewContract(id, renewalData);
    } catch (error) {
      console.error('Erro ao renovar contrato:', error);
      throw new Error(`Erro ao renovar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Terminar contrato (novo método)
   */
  async terminateContract(id: string, terminationData: ContractTerminationData): Promise<Contract> {
    try {
      return await this.contractService.terminateContract(id, terminationData);
    } catch (error) {
      console.error('Erro ao terminar contrato:', error);
      throw new Error(`Erro ao terminar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter contratos por propriedade (novo método)
   */
  async getContractsByProperty(propertyId: string): Promise<Contract[]> {
    try {
      return await this.contractService.getContractsByProperty(propertyId);
    } catch (error) {
      console.error('Erro ao buscar contratos por propriedade:', error);
      throw new Error(`Erro ao buscar contratos por propriedade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Calcular métricas de contrato (novo método)
   */
  async calculateContractMetrics(contractId: string): Promise<ContractCalculationResult> {
    try {
      return await this.contractService.calculateContractMetrics(contractId);
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      throw new Error(`Erro ao calcular métricas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter métricas gerais (novo método)
   */
  async getContractMetrics(): Promise<ContractMetrics> {
    try {
      return await this.contractService.getMetrics();
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      throw new Error(`Erro ao obter métricas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // === MÉTODOS DE CONVERSÃO ===

  /**
   * Converter filtros legados para novos filtros
   */
  private convertLegacyFilters(legacyFilters: LegacyContractFilters): ContractFilters {
    const newFilters: ContractFilters = {};
    
    if (legacyFilters.status) {
      newFilters.status = legacyFilters.status as any;
    }
    
    if (legacyFilters.search) {
      newFilters.search = legacyFilters.search;
    }
    
    if (legacyFilters.startDate && legacyFilters.endDate) {
      newFilters.dateRange = {
        start: legacyFilters.startDate,
        end: legacyFilters.endDate
      };
    }
    
    if (legacyFilters.page) {
      newFilters.page = legacyFilters.page;
    }
    
    if (legacyFilters.limit) {
      newFilters.limit = legacyFilters.limit;
    }
    
    return newFilters;
  }

  /**
   * Converter contrato novo para formato legacy
   */
  private convertToLegacyContract(contract: Contract): LegacyContract {
    return {
      id: contract.id,
      contractNumber: contract.form_data?.numeroContrato || 'N/A',
      clientName: contract.form_data?.nomeLocatario || 'N/A',
      property: contract.form_data?.enderecoImovel || 'N/A',
      status: this.convertStatus(contract.status),
      startDate: contract.form_data?.dataFirmamentoContrato || '',
      endDate: contract.form_data?.dataFimContrato || '',
      totalValue: contract.form_data?.valorTotal || 0,
      paidValue: 0, // Calcular se necessário
      dueDate: contract.form_data?.dataVencimento || '',
      createdAt: contract.created_at,
      updatedAt: contract.updated_at
    };
  }

  /**
   * Converter dados legacy para criar/atualizar contrato
   */
  private convertFromLegacyContract(legacyData: Partial<LegacyContract>): any {
    if ('contractNumber' in legacyData || 'clientName' in legacyData) {
      // Dados de criação
      return {
        form_data: {
          numeroContrato: legacyData.contractNumber,
          nomeLocatario: legacyData.clientName,
          enderecoImovel: legacyData.property,
          dataFirmamentoContrato: legacyData.startDate,
          dataFimContrato: legacyData.endDate,
          valorTotal: legacyData.totalValue,
          dataVencimento: legacyData.dueDate
        },
        document_type: 'contract',
        status: this.convertLegacyStatus(legacyData.status || 'pending')
      };
    } else {
      // Dados de atualização
      return {
        form_data: {
          ...(legacyData.contractNumber && { numeroContrato: legacyData.contractNumber }),
          ...(legacyData.clientName && { nomeLocatario: legacyData.clientName }),
          ...(legacyData.property && { enderecoImovel: legacyData.property }),
          ...(legacyData.startDate && { dataFirmamentoContrato: legacyData.startDate }),
          ...(legacyData.endDate && { dataFimContrato: legacyData.endDate }),
          ...(legacyData.totalValue && { valorTotal: legacyData.totalValue }),
          ...(legacyData.dueDate && { dataVencimento: legacyData.dueDate })
        },
        ...(legacyData.status && { status: this.convertLegacyStatus(legacyData.status) })
      };
    }
  }

  /**
   * Converter status novo para legacy
   */
  private convertStatus(newStatus: string): 'active' | 'pending' | 'completed' | 'cancelled' {
    switch (newStatus) {
      case 'active':
      case 'renewed':
        return 'active';
      case 'pending':
        return 'pending';
      case 'cancelled':
      case 'rescinded':
        return 'cancelled';
      case 'expired':
        return 'completed';
      default:
        return 'pending';
    }
  }

  /**
   * Converter status legacy para novo
   */
  private convertLegacyStatus(legacyStatus: string): string {
    switch (legacyStatus) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'completed':
        return 'expired';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Obter instância do ContractService para acesso direto aos métodos avançados
   */
  getContractService(): ContractService {
    return this.contractService;
  }
}

// === INSTÂNCIA SINGLETON ===
const contractServiceAdapter = new ContractServiceAdapter();

export { contractServiceAdapter };
export default contractServiceAdapter;