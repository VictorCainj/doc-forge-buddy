/**
 * Repository específico para Contratos
 * Implementa operações especializadas para a entidade Contract
 */

import type { Contract, ContractFormData, CreateContractData, UpdateContractData } from '@/types/domain/contract';
import { BaseRepository } from './BaseRepository';
import { repositoryLogger } from './logging/RepositoryLogger';
import type { Tables } from '@/integrations/supabase/types';

export class ContractRepository extends BaseRepository<Contract, string> {
  constructor(userId?: string | null) {
    super('contracts', 'Contract', userId);
  }

  /**
   * Busca contratos por status
   */
  async findByStatus(status: 'active' | 'expired' | 'pending' | 'cancelled'): Promise<Contract[]> {
    return this.findMany({ document_type: status } as any);
  }

  /**
   * Busca contratos por tipo de documento
   */
  async findByDocumentType(documentType: string): Promise<Contract[]> {
    return this.findMany({ document_type: documentType } as any);
  }

  /**
   * Busca contratos por locatário
   */
  async findByLocatario(nomeLocatario: string): Promise<Contract[]> {
    const { data, error } = await repositoryLogger
      .getLogs()
      .find(log => 
        log.entity === 'Contract' && 
        log.operation === 'findByLocatario'
      );

    // Implementação customizada com busca por JSON
    // Como ContractFormData está em JSON, precisamos fazer busca manual
    return this.findWithConditions([
      {
        column: 'form_data',
        operator: 'ilike',
        value: `%${nomeLocatario}%`
      }
    ]);
  }

  /**
   * Busca contratos por endereço do imóvel
   */
  async findByEndereco(endereco: string): Promise<Contract[]> {
    return this.findWithConditions([
      {
        column: 'form_data',
        operator: 'ilike',
        value: `%${endereco}%`
      }
    ]);
  }

  /**
   * Busca contratos com vencimento próximo
   */
  async findWithVencimentoProximo(diasLimite = 30): Promise<Contract[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasLimite);
    
    return this.findWithConditions([
      {
        column: 'form_data->dataTerminoRescisao',
        operator: 'lte',
        value: dataLimite.toISOString().split('T')[0]
      }
    ]);
  }

  /**
   * Busca contratos por período de criação
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Contract[]> {
    return this.findWithConditions([
      {
        column: 'created_at',
        operator: 'gte',
        value: startDate
      },
      {
        column: 'created_at',
        operator: 'lte', 
        value: endDate
      }
    ], { column: 'created_at', ascending: false });
  }

  /**
   * Busca contratos por múltiplos filtros
   */
  async findWithFilters(filters: {
    status?: string;
    documentType?: string;
    locatario?: string;
    endereco?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: Array<{
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in';
      value: any;
    }> = [];

    // Aplica filtros como condições
    if (filters.status) {
      conditions.push({
        column: 'document_type',
        operator: 'eq',
        value: filters.status
      });
    }

    if (filters.documentType) {
      conditions.push({
        column: 'document_type',
        operator: 'eq',
        value: filters.documentType
      });
    }

    if (filters.startDate && filters.endDate) {
      conditions.push({
        column: 'created_at',
        operator: 'gte',
        value: filters.startDate
      });
      conditions.push({
        column: 'created_at',
        operator: 'lte',
        value: filters.endDate
      });
    }

    // Para filtros de texto em JSON, vamos usar busca manual
    let result;
    if (filters.locatario || filters.endereco) {
      // Busca todos e filtra em memória (para casos específicos)
      const allContracts = await this.findMany();
      result = allContracts.filter(contract => {
        const formData = contract.form_data;
        
        if (filters.locatario) {
          const nomeLocatario = formData.nomeLocatario || '';
          if (!nomeLocatario.toLowerCase().includes(filters.locatario.toLowerCase())) {
            return false;
          }
        }

        if (filters.endereco) {
          const endereco = formData.enderecoImovel || '';
          if (!endereco.toLowerCase().includes(filters.endereco.toLowerCase())) {
            return false;
          }
        }

        return true;
      });
    } else {
      // Usa query do banco para melhor performance
      result = await this.findWithConditions(conditions, { column: 'created_at', ascending: false });
    }

    // Aplica paginação se especificada
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      result = result.slice(start, end);
    }

    return result;
  }

  /**
   * Cria contrato com validações específicas
   */
  async create(data: CreateContractData): Promise<Contract> {
    // Validações específicas do contrato
    this.validateContractData(data);

    // Cria o contrato
    return super.create(data);
  }

  /**
   * Atualiza contrato com validações específicas
   */
  async update(id: string, data: UpdateContractData): Promise<Contract> {
    // Validações específicas
    if (data.form_data) {
      this.validateContractFormData(data.form_data);
    }

    return super.update(id, data);
  }

  /**
   * Busca contratos populares (com mais análises)
   */
  async findPopularContracts(limit = 10): Promise<Contract[]> {
    // Esta funcionalidade dependeria de uma tabela de métricas
    // Por enquanto, retorna os contratos mais recentes
    return this.findManyPaginated({}, 1, limit).then(result => result.data);
  }

  /**
   * Obtém estatísticas dos contratos
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
  }> {
    const allContracts = await this.findMany();
    
    const stats = {
      total: allContracts.length,
      byStatus: {} as Record<string, number>,
      byMonth: {} as Record<string, number>
    };

    allContracts.forEach(contract => {
      // Contagem por status
      const status = contract.document_type;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Contagem por mês
      const month = contract.created_at.substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    return stats;
  }

  /**
   * Valida dados do contrato na criação
   */
  private validateContractData(data: CreateContractData): void {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Título do contrato é obrigatório');
    }

    if (!data.document_type) {
      throw new Error('Tipo de documento é obrigatório');
    }

    if (!data.form_data) {
      throw new Error('Dados do formulário são obrigatórios');
    }

    this.validateContractFormData(data.form_data);
  }

  /**
   * Valida dados do formulário do contrato
   */
  private validateContractFormData(formData: ContractFormData): void {
    // Validações específicas de campos obrigatórios
    if (!formData.numeroContrato || formData.numeroContrato.trim() === '') {
      throw new Error('Número do contrato é obrigatório');
    }

    // Validações de formato
    if (formData.celularLocatario && !this.isValidPhone(formData.celularLocatario)) {
      throw new Error('Celular do locatário deve ter formato válido');
    }

    if (formData.emailLocatario && !this.isValidEmail(formData.emailLocatario)) {
      throw new Error('Email do locatário deve ter formato válido');
    }

    // Validações de data
    if (formData.dataFirmamentoContrato) {
      this.validateDate(formData.dataFirmamentoContrato, 'Data de firmamento');
    }
  }

  /**
   * Valida formato de telefone
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\(\)\s\-\+\d]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de data
   */
  private validateDate(dateString: string, fieldName: string): void {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`${fieldName} deve ter formato de data válido (YYYY-MM-DD)`);
    }
  }

  /**
   * Busca contratos por ID do usuário
   */
  async findByUserId(userId: string): Promise<Contract[]> {
    return this.findMany({ user_id: userId } as any);
  }

  /**
   * Duplica um contrato
   */
  async duplicate(id: string, newTitle: string): Promise<Contract> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Contrato original não encontrado');
    }

    const duplicatedData: CreateContractData = {
      title: newTitle,
      form_data: { ...original.form_data },
      document_type: original.document_type,
      content: original.content
    };

    return this.create(duplicatedData);
  }

  /**
   * Exporta contratos para análise
   */
  async exportContracts(filters?: any): Promise<Contract[]> {
    return this.findMany(filters);
  }

  /**
   * Busca contratos com resultados vazios ou problemáticos
   */
  async findProblematicContracts(): Promise<Contract[]> {
    const allContracts = await this.findMany();
    
    return allContracts.filter(contract => {
      // Critérios para contratos problemáticos
      const formData = contract.form_data;
      
      return (
        !formData.nomeLocatario ||
        !formData.enderecoImovel ||
        !formData.numeroContrato ||
        contract.content.length < 100
      );
    });
  }
}