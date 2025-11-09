/**
 * Repository para operações de dados de contratos
 * Implementa a interface IRepository específica para contratos
 */

import { IRepository } from '@/services/core/interfaces';
import { 
  Contract, 
  CreateContractData, 
  UpdateContractData,
  ContractFormData,
  DocumentType
} from '@/types/domain/contract';
import { SearchFilters, PaginationOptions, PaginatedResult, ApiResponse } from '@/types/domain/common';

export class ContractRepository implements IRepository<Contract, CreateContractData, UpdateContractData> {
  private baseUrl = '/api/contracts';

  async create(data: CreateContractData): Promise<Contract> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar contrato: ${response.statusText}`);
    }
    
    return response.json();
  }

  async update(id: string, data: UpdateContractData): Promise<Contract> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar contrato: ${response.statusText}`);
    }
    
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao deletar contrato: ${response.statusText}`);
    }
  }

  async findById(id: string): Promise<Contract | null> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contrato: ${response.statusText}`);
    }
    
    return response.json();
  }

  async findMany(filters?: SearchFilters, options?: PaginationOptions): Promise<Contract[]> {
    const params = new URLSearchParams();
    
    // Adicionar filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    // Adicionar opções de paginação
    if (options) {
      if (options.limit !== undefined) params.append('limit', String(options.limit));
      if (options.offset !== undefined) params.append('offset', String(options.offset));
      if (options.page !== undefined) params.append('page', String(options.page));
      if (options.orderBy) params.append('orderBy', options.orderBy);
      if (options.ascending !== undefined) params.append('ascending', String(options.ascending));
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || result.contracts || result;
  }

  async findManyPaginated(
    filters?: SearchFilters, 
    options?: PaginationOptions
  ): Promise<PaginatedResult<Contract>> {
    const params = new URLSearchParams();
    
    // Adicionar filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    // Adicionar opções de paginação
    if (options) {
      if (options.limit !== undefined) params.append('limit', String(options.limit));
      if (options.offset !== undefined) params.append('offset', String(options.offset));
      if (options.page !== undefined) params.append('page', String(options.page));
      if (options.orderBy) params.append('orderBy', options.orderBy);
      if (options.ascending !== undefined) params.append('ascending', String(options.ascending));
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      data: result.data || result.contracts || [],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 10,
      hasMore: result.hasMore || false
    };
  }

  async exists(id: string): Promise<boolean> {
    const contract = await this.findById(id);
    return contract !== null;
  }

  async count(filters?: SearchFilters): Promise<number> {
    const params = new URLSearchParams();
    params.append('count', 'true');
    
    // Adicionar filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao contar contratos: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.total || 0;
  }

  // === Métodos específicos do ContractRepository ===

  /**
   * Busca contratos por status específico
   */
  async findByStatus(status: string): Promise<Contract[]> {
    return this.findMany({ status });
  }

  /**
   * Busca contratos por tipo de documento
   */
  async findByDocumentType(documentType: DocumentType): Promise<Contract[]> {
    return this.findMany({ metadata: { documentType } });
  }

  /**
   * Busca contratos por cliente
   */
  async findByClient(clientName: string): Promise<Contract[]> {
    return this.findMany({ metadata: { clientName } });
  }

  /**
   * Busca contratos por endereço do imóvel
   */
  async findByPropertyAddress(propertyAddress: string): Promise<Contract[]> {
    return this.findMany({ metadata: { propertyAddress } });
  }

  /**
   * Busca contratos em um intervalo de datas
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Contract[]> {
    return this.findMany({
      dateFrom: startDate,
      dateTo: endDate
    });
  }

  /**
   * Busca contratos com tags específicas
   */
  async findByTags(tags: string[]): Promise<Contract[]> {
    return this.findMany({ tags });
  }

  /**
   * Busca contratos favoritos do usuário
   */
  async findFavorites(): Promise<Contract[]> {
    const response = await fetch(`${this.baseUrl}/favorites`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos favoritos: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Verifica se um contrato é favorito
   */
  async isFavorite(contractId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${contractId}/favorite`);
    
    if (!response.ok) {
      throw new Error(`Erro ao verificar se contrato é favorito: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.isFavorite;
  }

  /**
   * Adiciona contrato aos favoritos
   */
  async addToFavorites(contractId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${contractId}/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao adicionar contrato aos favoritos: ${response.statusText}`);
    }
  }

  /**
   * Remove contrato dos favoritos
   */
  async removeFromFavorites(contractId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${contractId}/favorite`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao remover contrato dos favoritos: ${response.statusText}`);
    }
  }

  /**
   * Adiciona tag ao contrato
   */
  async addTag(contractId: string, tagName: string, color: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${contractId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tagName, color }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao adicionar tag: ${response.statusText}`);
    }
  }

  /**
   * Remove tag do contrato
   */
  async removeTag(contractId: string, tagName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${contractId}/tags/${encodeURIComponent(tagName)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao remover tag: ${response.statusText}`);
    }
  }

  /**
   * Lista tags de um contrato
   */
  async getContractTags(contractId: string): Promise<Array<{ name: string; color: string; isAutomatic: boolean }>> {
    const response = await fetch(`${this.baseUrl}/${contractId}/tags`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar tags do contrato: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Busca contratos que precisam de atenção
   */
  async findContractsNeedingAttention(): Promise<Contract[]> {
    const response = await fetch(`${this.baseUrl}/attention-needed`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos que precisam de atenção: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Busca contratos próximos ao vencimento
   */
  async findExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    const response = await fetch(`${this.baseUrl}/expiring?days=${daysAhead}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos próximos ao vencimento: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Calcula métricas de contratos
   */
  async calculateMetrics(filters?: SearchFilters): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDocumentType: Record<string, number>;
    completionRate: number;
    averageDuration?: number;
  }> {
    const params = new URLSearchParams();
    params.append('metrics', 'true');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao calcular métricas: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Exporta contratos para relatório
   */
  async exportContracts(format: 'csv' | 'excel' | 'pdf', filters?: SearchFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('export', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao exportar contratos: ${response.statusText}`);
    }
    
    return response.blob();
  }

  /**
   * Busca estatísticas de contratos para dashboard
   */
  async getDashboardStats(): Promise<{
    totalContracts: number;
    activeContracts: number;
    expiringThisMonth: number;
    completionRate: number;
    recentActivity: {
      created: number;
      updated: number;
      terminated: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/dashboard-stats`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas do dashboard: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Busca contratos com busca textual avançada
   */
  async searchContracts(query: string, filters?: SearchFilters): Promise<Contract[]> {
    const params = new URLSearchParams();
    params.append('search', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar contratos: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data || result.contracts || result;
  }
}