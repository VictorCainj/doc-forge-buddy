import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VistoriaAnalise, ApontamentoVistoria } from '@/types/vistoria';

interface ApontamentoData {
  id: string;
  ambiente: string;
  tipoVistoria: string;
  observacoes: string;
  fotos: string[];
}

export interface LegacyVistoriaData {
  apontamentos: ApontamentoData[];
  selectedContractId?: string;
  dadosVistoria: {
    locatario: string;
    endereco: string;
    dataVistoria: string;
  };
  showDadosVistoria?: boolean;
}

interface User {
  id: string;
  email: string;
}

interface Toast {
  success: (message: string) => void;
  error: (message: string) => void;
}

interface FotoData {
  url: string;
  file_name?: string;
  base64?: string;
}

export class VistoriaDataMigrator {
  private user: User;
  private toast: Toast;

  constructor(user: User, toast: Toast) {
    this.user = user;
    this.toast = toast;
  }

  /**
   * Verifica se existem dados antigos no localStorage
   */
  hasLegacyData(): boolean {
    const savedState = localStorage.getItem('analise-vistoria-state');
    return savedState !== null;
  }

  /**
   * Carrega dados antigos do localStorage
   */
  loadLegacyData(): LegacyVistoriaData | null {
    try {
      const savedState = localStorage.getItem('analise-vistoria-state');
      if (!savedState) return null;

      const parsedState = JSON.parse(savedState);

      // Verificar se tem dados válidos
      if (
        !parsedState.apontamentos ||
        !Array.isArray(parsedState.apontamentos)
      ) {
        return null;
      }

      return parsedState as LegacyVistoriaData;
    } catch {
      // console.error('Erro ao carregar dados legados');
      return null;
    }
  }

  /**
   * Converte dados antigos para o novo formato
   */
  convertLegacyData(legacyData: LegacyVistoriaData): VistoriaAnalise | null {
    try {
      if (!legacyData.apontamentos || legacyData.apontamentos.length === 0) {
        return null;
      }

      // Converter apontamentos para o novo formato
      const apontamentos: ApontamentoVistoria[] = legacyData.apontamentos.map(
        (apontamento: ApontamentoData) => ({
          id: apontamento.id || Date.now().toString() + Math.random(),
          ambiente: apontamento.ambiente || '',
          subtitulo: apontamento.subtitulo || '',
          descricao: apontamento.descricao || '',
          vistoriaInicial: {
            fotos: [], // As fotos serão processadas separadamente
            descritivoLaudo: apontamento.vistoriaInicial?.descritivoLaudo || '',
          },
          vistoriaFinal: {
            fotos: [], // As fotos serão processadas separadamente
          },
          observacao: apontamento.observacao || '',
        })
      );

      // Criar título baseado nos dados
      const title = `Análise Migrada - ${legacyData.dadosVistoria.locatario} - ${new Date().toLocaleDateString('pt-BR')}`;

      return {
        title,
        contract_id: legacyData.selectedContractId || null,
        dados_vistoria: legacyData.dadosVistoria,
        apontamentos,
      };
    } catch {
      // console.error('Erro ao converter dados legados');
      return null;
    }
  }

  /**
   * Migra uma única análise para o Supabase
   */
  async migrateAnalysis(analysisData: VistoriaAnalise): Promise<string | null> {
    if (!this.user) {
      throw new Error('Usuário não autenticado');
    }

    // Salvar análise principal
    const { data: analiseData, error: analiseError } = await supabase
      .from('vistoria_analises')
      .insert({
        title: analysisData.title,
        contract_id: analysisData.contract_id,
        dados_vistoria: analysisData.dados_vistoria,
        apontamentos: analysisData.apontamentos,
        user_id: this.user.id,
      })
      .select()
      .single();

    if (analiseError) throw analiseError;

    return analiseData.id;
  }

  /**
   * Processa e migra imagens de uma análise
   */
  async migrateImages(
    analiseId: string,
    legacyApontamentos: ApontamentoData[]
  ): Promise<void> {
    if (!this.user) return;

    for (const apontamento of legacyApontamentos) {
      // Processar fotos da vistoria inicial
      if (apontamento.vistoriaInicial?.fotos) {
        await this.processAndUploadImages(
          apontamento.vistoriaInicial.fotos,
          analiseId,
          apontamento.id,
          'inicial'
        );
      }

      // Processar fotos da vistoria final
      if (apontamento.vistoriaFinal?.fotos) {
        await this.processAndUploadImages(
          apontamento.vistoriaFinal.fotos,
          analiseId,
          apontamento.id,
          'final'
        );
      }
    }
  }

  /**
   * Processa e faz upload de imagens base64 para o Supabase Storage
   */
  private async processAndUploadImages(
    fotos: FotoData[],
    analiseId: string,
    apontamentoId: string,
    tipoVistoria: 'inicial' | 'final'
  ): Promise<void> {
    if (!this.user) return;

    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];

      // try {
      // Verificar se tem base64
      if (!foto.base64) continue;

      // Converter base64 para blob
      const response = await fetch(foto.base64);
      const blob = await response.blob();

      // Gerar nome único para o arquivo
      const fileExt = foto.name.split('.').pop() || 'jpg';
      const fileName = `${analiseId}/${apontamentoId}/${tipoVistoria}/migrated_${Date.now()}_${i}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('vistoria-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('vistoria-images').getPublicUrl(fileName);

      // Salvar referência no banco
      const { error: dbError } = await supabase.from('vistoria_images').insert({
        vistoria_id: analiseId,
        apontamento_id: apontamentoId,
        tipo_vistoria: tipoVistoria,
        image_url: publicUrl,
        file_name: foto.name,
        file_size: foto.size || blob.size,
        file_type: foto.type || blob.type,
        user_id: this.user.id,
      });

      if (dbError) throw dbError;
      // } catch {
      //   // console.error(`Erro ao processar foto ${i}`);
      //   // Continuar com as outras fotos mesmo se uma falhar
      // }
    }
  }

  /**
   * Executa a migração completa
   */
  async executeMigration(): Promise<boolean> {
    if (!this.user) {
      this.toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para executar a migração.',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se existem dados legados
    if (!this.hasLegacyData()) {
      this.toast({
        title: 'Nenhum dado encontrado',
        description: 'Não foram encontrados dados antigos para migrar.',
      });
      return false;
    }

    // Carregar dados legados
    const legacyData = this.loadLegacyData();
    if (!legacyData) {
      this.toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados antigos.',
        variant: 'destructive',
      });
      return false;
    }

    // Converter dados
    const analysisData = this.convertLegacyData(legacyData);
    if (!analysisData) {
      this.toast({
        title: 'Erro na conversão',
        description: 'Não foi possível converter os dados para o novo formato.',
        variant: 'destructive',
      });
      return false;
    }

    // Migrar análise
    const analiseId = await this.migrateAnalysis(analysisData);
    if (!analiseId) {
      this.toast({
        title: 'Erro na migração',
        description: 'Não foi possível salvar a análise no banco de dados.',
        variant: 'destructive',
      });
      return false;
    }

    // Migrar imagens
    await this.migrateImages(analiseId, legacyData.apontamentos);

    // Limpar dados antigos após migração bem-sucedida
    localStorage.removeItem('analise-vistoria-state');

    this.toast({
      title: 'Migração concluída',
      description: 'Os dados foram migrados com sucesso para o Supabase.',
    });

    return true;
    // } catch (error) {
    //   // console.error('Erro durante a migração:', error);
    //   this.toast({
    //     title: 'Erro na migração',
    //     description: `Ocorreu um erro durante a migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    //     variant: 'destructive',
    //   });
    //   return false;
    // }
  }

  /**
   * Verifica se a migração é necessária
   */
  async needsMigration(): Promise<boolean> {
    // Se não tem dados legados, não precisa migrar
    if (!this.hasLegacyData()) {
      return false;
    }

    // Se não tem usuário autenticado, não pode verificar
    if (!this.user) {
      return false;
    }

    try {
      // Verificar se já existem análises no Supabase para este usuário
      const { data: existingAnalyses, error } = await supabase
        .from('vistoria_analises')
        .select('id')
        .eq('user_id', this.user.id)
        .limit(1);

      if (error) {
        // console.error('Erro ao verificar análises existentes:', error);
        return true; // Em caso de erro, assume que precisa migrar
      }

      // Se já existem análises no Supabase, não precisa migrar
      return existingAnalyses && existingAnalyses.length === 0;
    } catch {
      // console.error('Erro ao verificar migração necessária');
      return true; // Em caso de erro, assume que precisa migrar
    }
  }
}

/**
 * Hook para usar o migrador
 */
export const useVistoriaMigrator = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const migrator = new VistoriaDataMigrator(user, toast);

  return {
    needsMigration: () => migrator.needsMigration(),
    executeMigration: () => migrator.executeMigration(),
    hasLegacyData: () => migrator.hasLegacyData(),
  };
};
