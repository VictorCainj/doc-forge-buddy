/**
 * Repository específico para Vistorias
 * Implementa operações especializadas para a entidade Vistoria
 */

import type { 
  VistoriaAnalise, 
  CreateVistoriaData, 
  UpdateVistoriaData,
  DadosVistoria,
  ApontamentoVistoria,
  VistoriaImage 
} from '@/types/shared/vistoria';
import { VistoriaType } from '@/types/shared/base';
import { BaseRepository } from './BaseRepository';
import { mapToSupabaseVistoriaInsert, mapToSupabaseVistoriaUpdate, toSupabaseJson } from '@/types/shared/vistoria';
import { supabase } from '@/integrations/supabase/client';

export class VistoriaRepository extends BaseRepository<VistoriaAnalise, string> {
  constructor(userId?: string | null) {
    super('vistoria_analises', 'Vistoria', userId);
  }

  /**
   * Busca vistorias por tipo
   */
  async findByType(tipo: VistoriaType): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->tipoVistoria',
        operator: 'eq',
        value: tipo
      }
    ]);
  }

  /**
   * Busca vistorias por contrato
   */
  async findByContract(contractId: string): Promise<VistoriaAnalise[]> {
    return this.findMany({ contract_id: contractId } as any);
  }

  /**
   * Busca vistorias por data
   */
  async findByDate(dataVistoria: string): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->dataVistoria',
        operator: 'eq',
        value: dataVistoria
      }
    ]);
  }

  /**
   * Busca vistorias por locatário
   */
  async findByLocatario(nomeLocatario: string): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->locatario',
        operator: 'ilike',
        value: `%${nomeLocatario}%`
      }
    ]);
  }

  /**
   * Busca vistorias por endereço
   */
  async findByEndereco(endereco: string): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->endereco',
        operator: 'ilike',
        value: `%${endereco}%`
      }
    ]);
  }

  /**
   * Busca vistorias com apontamentos
   */
  async findWithApontamentos(vistoriaId: string): Promise<{
    vistoria: VistoriaAnalise;
    apontamentos: ApontamentoVistoria[];
    imagens: VistoriaImage[];
  } | null> {
    const vistoria = await this.findById(vistoriaId);
    if (!vistoria) {
      return null;
    }

    // Busca apontamentos relacionados
    const { data: apontamentosData } = await supabase
      .from('vistoria_apontamentos')
      .select('*')
      .eq('vistoria_id', vistoriaId);

    // Busca imagens relacionadas
    const { data: imagensData } = await supabase
      .from('vistoria_images')
      .select('*')
      .eq('vistoria_id', vistoriaId);

    return {
      vistoria,
      apontamentos: (apontamentosData || []) as ApontamentoVistoria[],
      imagens: (imagensData || []) as VistoriaImage[]
    };
  }

  /**
   * Cria vistoria com validações
   */
  async create(data: CreateVistoriaData): Promise<VistoriaAnalise> {
    // Validações específicas
    this.validateVistoriaData(data);

    // Converte para formato do banco
    const vistoriaData = mapToSupabaseVistoriaInsert(data);

    return super.create(vistoriaData as any);
  }

  /**
   * Atualiza vistoria
   */
  async update(id: string, data: UpdateVistoriaData): Promise<VistoriaAnalise> {
    // Validações
    if (data.dados_vistoria) {
      this.validateDadosVistoria(data.dados_vistoria);
    }

    // Converte para formato do banco
    const updateData = mapToSupabaseVistoriaUpdate(data);

    return super.update(id, updateData as any);
  }

  /**
   * Adiciona apontamento à vistoria
   */
  async addApontamento(vistoriaId: string, apontamento: ApontamentoVistoria): Promise<void> {
    const vistoria = await this.findById(vistoriaId);
    if (!vistoria) {
      throw new Error('Vistoria não encontrada');
    }

    // Busca apontamentos atuais
    const vistoriaCompleta = await this.findWithApontamentos(vistoriaId);
    if (!vistoriaCompleta) {
      throw new Error('Vistoria não encontrada');
    }

    // Adiciona novo apontamento
    const novosApontamentos = [...vistoriaCompleta.apontamentos, apontamento];

    // Atualiza vistoria com novos apontamentos
    await this.update(vistoriaId, { 
      apontamentos: novosApontamentos 
    });
  }

  /**
   * Remove apontamento da vistoria
   */
  async removeApontamento(vistoriaId: string, apontamentoId: string): Promise<void> {
    const vistoriaCompleta = await this.findWithApontamentos(vistoriaId);
    if (!vistoriaCompleta) {
      throw new Error('Vistoria não encontrada');
    }

    // Remove apontamento
    const novosApontamentos = vistoriaCompleta.apontamentos.filter(
      a => a.id !== apontamentoId
    );

    // Atualiza vistoria sem o apontamento
    await this.update(vistoriaId, { 
      apontamentos: novosApontamentos 
    });
  }

  /**
   * Busca vistorias pendentes
   */
  async findPending(): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'status',
        operator: 'eq',
        value: 'pending'
      }
    ]);
  }

  /**
   * Busca vistorias concluídas
   */
  async findCompleted(): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'status',
        operator: 'eq',
        value: 'completed'
      }
    ]);
  }

  /**
   * Busca vistorias por período
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->dataVistoria',
        operator: 'gte',
        value: startDate
      },
      {
        column: 'dados_vistoria->dataVistoria',
        operator: 'lte',
        value: endDate
      }
    ]);
  }

  /**
   * Busca vistorias que precisam de revistoria
   */
  async findNeedingRevistoria(): Promise<VistoriaAnalise[]> {
    const allVistorias = await this.findMany();
    
    return allVistorias.filter(vistoria => {
      const apontamentos = vistoria.apontamentos || [];
      
      // Critério: vistoria com apontamentos de responsabilidade
      return apontamentos.some(apontamento => 
        apontamento.classificacao === 'responsabilidade'
      );
    });
  }

  /**
   * Obtém estatísticas das vistorias
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
    withIssues: number;
  }> {
    const allVistorias = await this.findMany();
    
    const stats = {
      total: allVistorias.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byMonth: {} as Record<string, number>,
      withIssues: 0
    };

    allVistorias.forEach(vistoria => {
      // Contagem por tipo
      const tipo = vistoria.dados_vistoria?.tipoVistoria || 'unknown';
      stats.byType[tipo] = (stats.byType[tipo] || 0) + 1;

      // Contagem por status
      const status = (vistoria as any).status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Contagem por mês
      const month = vistoria.created_at.substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Vistorias com problemas
      const apontamentos = vistoria.apontamentos || [];
      if (apontamentos.some(a => a.classificacao === 'responsabilidade')) {
        stats.withIssues++;
      }
    });

    return stats;
  }

  /**
   * Duplica vistoria
   */
  async duplicate(vistoriaId: string, newTitle: string): Promise<VistoriaAnalise> {
    const original = await this.findById(vistoriaId);
    if (!original) {
      throw new Error('Vistoria original não encontrada');
    }

    const duplicatedData: CreateVistoriaData = {
      title: newTitle,
      contract_id: original.contract_id,
      dados_vistoria: { ...original.dados_vistoria },
      apontamentos: [...(original.apontamentos || [])]
    };

    return this.create(duplicatedData);
  }

  /**
   * Exporta vistoria com todos os dados
   */
  async exportVistoria(vistoriaId: string): Promise<{
    vistoria: VistoriaAnalise;
    apontamentos: ApontamentoVistoria[];
    imagens: VistoriaImage[];
    contract?: any;
  } | null> {
    const vistoriaData = await this.findWithApontamentos(vistoriaId);
    if (!vistoriaData) {
      return null;
    }

    // Busca dados do contrato se existir
    let contract = null;
    if (vistoriaData.vistoria.contract_id) {
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', vistoriaData.vistoria.contract_id)
        .single();
      
      contract = contractData;
    }

    return {
      ...vistoriaData,
      contract
    };
  }

  /**
   * Valida dados da vistoria
   */
  private validateVistoriaData(data: CreateVistoriaData): void {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Título da vistoria é obrigatório');
    }

    if (!data.dados_vistoria) {
      throw new Error('Dados da vistoria são obrigatórios');
    }

    this.validateDadosVistoria(data.dados_vistoria);

    if (!data.apontamentos || !Array.isArray(data.apontamentos)) {
      throw new Error('Apontamentos são obrigatórios');
    }
  }

  /**
   * Valida dados específicos da vistoria
   */
  private validateDadosVistoria(dados: DadosVistoria): void {
    if (dados.dataVistoria) {
      this.validateDate(dados.dataVistoria, 'Data da vistoria');
    }

    if (dados.tipoVistoria && !Object.values(VistoriaType).includes(dados.tipoVistoria as VistoriaType)) {
      throw new Error('Tipo de vistoria inválido');
    }
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
   * Busca vistorias por responsável
   */
  async findByResponsavel(responsavel: string): Promise<VistoriaAnalise[]> {
    return this.findWithConditions([
      {
        column: 'dados_vistoria->responsavel',
        operator: 'ilike',
        value: `%${responsavel}%`
      }
    ]);
  }

  /**
   * Busca vistorias agendadas para hoje
   */
  async findScheduledForToday(): Promise<VistoriaAnalise[]> {
    const hoje = new Date().toISOString().split('T')[0];
    
    return this.findWithConditions([
      {
        column: 'dados_vistoria->dataVistoria',
        operator: 'eq',
        value: hoje
      }
    ]);
  }

  /**
   * Finaliza vistoria
   */
  async completeVistoria(vistoriaId: string): Promise<VistoriaAnalise> {
    return this.update(vistoriaId, {
      status: 'completed',
      updated_at: new Date().toISOString()
    } as any);
  }
}