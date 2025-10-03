/**
 * API service para operações de contratos
 * Centraliza todas as chamadas de API relacionadas a contratos
 */

import { supabase } from '@/shared/services/supabase';
import { Contract, ContractFormData } from '../types/contract';

export class ContractsApi {
  /**
   * Buscar todos os contratos
   */
  static async getContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('saved_terms')
      .select('*')
      .eq('document_type', 'contrato')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.transformContract);
  }

  /**
   * Buscar contrato por ID
   */
  static async getContractById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('saved_terms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.transformContract(data);
  }

  /**
   * Criar novo contrato
   */
  static async createContract(contractData: ContractFormData): Promise<Contract> {
    const { data, error } = await supabase
      .from('saved_terms')
      .insert({
        title: `Contrato ${contractData.numeroContrato}`,
        content: '', // Será preenchido posteriormente
        form_data: contractData,
        document_type: 'contrato',
      })
      .select()
      .single();

    if (error) throw error;

    return this.transformContract(data);
  }

  /**
   * Atualizar contrato existente
   */
  static async updateContract(id: string, updates: Partial<ContractFormData>): Promise<Contract> {
    const { data, error } = await supabase
      .from('saved_terms')
      .update({
        form_data: updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.transformContract(data);
  }

  /**
   * Deletar contrato
   */
  static async deleteContract(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_terms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Buscar contratos com filtros
   */
  static async searchContracts(query: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Contract[]> {
    let queryBuilder = supabase
      .from('saved_terms')
      .select('*')
      .eq('document_type', 'contrato');

    // Aplicar filtros de busca por texto
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`
        form_data->>numeroContrato.ilike.%${query}%,
        form_data->>nomeLocatario.ilike.%${query}%,
        form_data->>enderecoImovel.ilike.%${query}%,
        form_data->>nomeProprietario.ilike.%${query}%
      `);
    }

    // Aplicar filtros de data
    if (filters?.dateFrom) {
      queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.transformContract);
  }

  /**
   * Transformar dados do Supabase para o formato Contract
   */
  private static transformContract(data: any): Contract {
    return {
      ...data,
      form_data: typeof data.form_data === 'string' 
        ? JSON.parse(data.form_data) 
        : data.form_data || {},
    };
  }
}

// ✅ Export da instância para uso direto
export const contractsApi = ContractsApi;
