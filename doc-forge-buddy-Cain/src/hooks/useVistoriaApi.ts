import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { log } from '@/utils/logger';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
'@/types/vistoria';
import { 
  deduplicateImagesBySerial, 
  getSimplifiedSerial 
} from '@/utils/imageSerialGenerator';

/**
 * Interface para contrato
 */
export interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

/**
 * Interface para resultado de carregamento de análise
 */
export interface LoadAnalysisResult {
  success: boolean;
  error?: string;
  data?: VistoriaAnaliseWithImages;
}

/**
 * Interface para resultado de salvamento
 */
export interface SaveAnalysisResult {
  success: boolean;
  analiseId?: string;
  error?: string;
}

/**
 * Hook para operações de API da vistoria
 */
export const useVistoriaApi = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { saveAnalise, updateAnalise } = useVistoriaAnalises();
  const { base64ToFile } = useVistoriaImages();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega contratos do Supabase
   */
  const fetchContracts = useCallback(async (): Promise<Contract[]> => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const contractsData = (data as Contract[]) || [];
      setContracts(contractsData);
      return contractsData;
    } catch (error) {
      log.error('Erro ao carregar contratos:', error);
      toast({
        title: 'Erro ao carregar contratos',
        description: 'Não foi possível carregar a lista de contratos.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Carrega contratos na inicialização
   */
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  /**
   * Carrega dados de uma análise para edição
   */
  const loadAnalysisData = useCallback(async (
    analiseData: VistoriaAnaliseWithImages,
    showToast: boolean = true
  ): Promise<LoadAnalysisResult> => {
    try {
      log.debug('=== CARREGANDO DADOS DA ANÁLISE ===');
      log.debug('Análise ID:', analiseData.id);
      log.debug('Imagens disponíveis:', analiseData.images?.length || 0);

      const result = {
        dadosVistoria: {} as DadosVistoria,
        apontamentos: [] as ApontamentoVistoria[],
        selectedContract: null as Contract | null,
        publicDocumentId: analiseData.public_document_id || null,
      };

      // Carregar public_document_id se existir
      // (já incluso no resultado)

      // Carregar dados da vistoria
      if (analiseData.dados_vistoria) {
        const dados = analiseData.dados_vistoria as DadosVistoria & Record<string, unknown>;

        const dadosCarregados = {
          locatario: (dados.locatario as string) || '',
          endereco: (dados.endereco as string) || '',
          dataVistoria: (dados.dataVistoria as string) || '',
        };

        // Se os dados estiverem vazios, NÃO definir ainda - deixar o useEffect do contrato preencher
        if (
          dadosCarregados.locatario ||
          dadosCarregados.endereco ||
          dadosCarregados.dataVistoria
        ) {
          result.dadosVistoria = dadosCarregados;
        }

        // Carregar o modo do documento se existir
        // (será tratado pelo hook useVistoriaState)

        // Carregar ID do prestador se existir
        // (será tratado pelo hook useVistoriaState)
      }

      // Carregar apontamentos com imagens
      if (analiseData.apontamentos) {
        const apontamentosData = analiseData.apontamentos as Record<string, unknown>[];
        // Se há imagens do banco de dados, usar elas
        const hasDatabaseImages = analiseData.images && analiseData.images.length > 0;
        
        log.debug('=== PROCESSANDO APONTAMENTOS ===');
        log.debug('Total de apontamentos:', apontamentosData.length);
        log.debug('Tem imagens do banco:', hasDatabaseImages);
        
        const apontamentosWithImages = await Promise.all(
          apontamentosData.map(async (apontamento) => {
            const apontamentoWithImages = { ...apontamento };
            if (hasDatabaseImages) {
              // Carregar imagens do banco de dados
              log.debug(
                `Processando apontamento: ${apontamento.ambiente} (ID: ${apontamento.id})`
              );

              const apontamentoImages = analiseData.images.filter(
                (img: Record<string, unknown>) =>
                  img.apontamento_id === apontamento.id
              );

              // ✅ DEDUPLICAÇÃO DUPLA: Por serial E por URL
              const uniqueImages = deduplicateImagesBySerial(apontamentoImages);
              const finalUniqueImages = uniqueImages.filter(
                (img, index, self) =>
                  index ===
                  self.findIndex((i) => i.image_url === img.image_url)
              );

              log.debug(
                `  - Imagens encontradas para este apontamento: ${apontamentoImages.length}`
              );
              log.debug(
                `  - Imagens únicas após deduplicação por serial: ${uniqueImages.length}`
              );
              log.debug(
                `  - Imagens únicas após deduplicação por URL: ${finalUniqueImages.length}`
              );

              const fotosInicial = finalUniqueImages
                .filter(
                  (img: Record<string, unknown>) =>
                    img.tipo_vistoria === 'inicial'
                )
                .map((img: Record<string, unknown>) => {
                  log.debug(
                    `    ✓ Foto Inicial: ${img.file_name} (${img.image_url})`
                  );
                  return {
                    name: img.file_name,
                    size: img.file_size,
                    type: img.file_type,
                    url: img.image_url,
                    isFromDatabase: true,
                  };
                });

              const fotosFinal = finalUniqueImages
                .filter(
                  (img: Record<string, unknown>) =>
                    img.tipo_vistoria === 'final'
                )
                .map((img: Record<string, unknown>) => {
                  log.debug(
                    `    ✓ Foto Final: ${img.file_name} (${img.image_url})`
                  );
                  return {
                    name: img.file_name,
                    size: img.file_size,
                    type: img.file_type,
                    url: img.image_url,
                    isFromDatabase: true,
                  };
                });

              log.debug(`  - Total fotos inicial: ${fotosInicial.length}`);
              log.debug(`  - Total fotos final: ${fotosFinal.length}`);

              apontamentoWithImages.vistoriaInicial = {
                ...apontamento.vistoriaInicial,
                fotos: fotosInicial,
              };
              apontamentoWithImages.vistoriaFinal = {
                ...apontamento.vistoriaFinal,
                fotos: fotosFinal,
              };
            } else {
              // Carregar imagens da análise original (base64)
              if (apontamento.vistoriaInicial?.fotos) {
                const fotosInicial = await Promise.all(
                  apontamento.vistoriaInicial.fotos.map(
                    async (foto: Record<string, unknown>) => {
                      if (foto.base64) {
                        return base64ToFile(
                          foto.base64,
                          foto.name,
                          foto.type
                        );
                      }
                      return foto;
                    }
                  )
                );
                apontamentoWithImages.vistoriaInicial = {
                  ...apontamento.vistoriaInicial,
                  fotos: fotosInicial,
                };
              }
              if (apontamento.vistoriaFinal?.fotos) {
                const fotosFinal = await Promise.all(
                  apontamento.vistoriaFinal.fotos.map(
                    async (foto: Record<string, unknown>) => {
                      if (foto.base64) {
                        return base64ToFile(
                          foto.base64,
                          foto.name,
                          foto.type
                        );
                      }
                      return foto;
                    }
                  )
                );
                apontamentoWithImages.vistoriaFinal = {
                  ...apontamento.vistoriaFinal,
                  fotos: fotosFinal,
                };
              }
            }
            return apontamentoWithImages;
          })
        );
        result.apontamentos = apontamentosWithImages as ApontamentoVistoria[];
      }

      if (showToast) {
        toast({
          title: 'Análise carregada',
          description: 'Os dados da análise foram carregados para edição.',
        });
      }

      return { success: true, data: { ...analiseData, ...result } };
    } catch (error) {
      log.error('Erro ao carregar dados da análise:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (showToast) {
        toast({
          title: 'Erro ao carregar análise',
          description: 'Não foi possível carregar os dados da análise.',
          variant: 'destructive',
        });
      }

      return { success: false, error: errorMessage };
    }
  }, [base64ToFile, toast]);

  /**
   * Verifica se existe análise para um contrato
   */
  const checkExistingAnalise = useCallback(async (
    contractId: string
  ): Promise<{ hasExisting: boolean; analiseId?: string; data?: VistoriaAnaliseWithImages }> => {
    if (!contractId) {
      return { hasExisting: false };
    }

    try {
      // Buscar análise com dados completos
      const { data: analiseData, error: analiseError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analiseData && !analiseError) {
        // Carregar imagens da análise
        const { data: imagesData, error: imagesError } = await supabase
          .from('vistoria_images')
          .select('*')
          .eq('vistoria_id', analiseData.id)
          .order('created_at', { ascending: true });

        if (imagesError) {
          log.error('Erro ao carregar imagens:', imagesError);
        }

        // Criar objeto completo da análise
        const completeAnalise: VistoriaAnaliseWithImages = {
          ...analiseData,
          images: imagesData || [],
        };

        return { 
          hasExisting: true, 
          analiseId: analiseData.id,
          data: completeAnalise
        };
      } else {
        return { hasExisting: false };
      }
    } catch (error) {
      log.error('Erro ao verificar análise existente:', error);
      return { hasExisting: false };
    }
  }, []);

  /**
   * Força recarregamento das imagens de uma análise
   */
  const forceReloadImages = useCallback(async (
    contractId: string
  ): Promise<LoadAnalysisResult> => {
    if (!contractId) {
      return { 
        success: false, 
        error: 'Nenhum contrato selecionado' 
      };
    }

    try {
      // Buscar análise com dados completos
      const { data: analiseData, error: analiseError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analiseData && !analiseError) {
        // Carregar imagens da análise
        const { data: imagesData, error: imagesError } = await supabase
          .from('vistoria_images')
          .select('*')
          .eq('vistoria_id', analiseData.id)
          .order('created_at', { ascending: true });

        if (imagesError) {
          log.error('Erro ao carregar imagens:', imagesError);
        }

        // Criar objeto completo da análise
        const completeAnalise: VistoriaAnaliseWithImages = {
          ...analiseData,
          images: imagesData || [],
        };

        log.debug('Forçando recarregamento de imagens', {
          analiseId: analiseData.id,
          imagensEncontradas: imagesData?.length || 0,
        });

        return { success: true, data: completeAnalise };
      } else {
        return { 
          success: false, 
          error: 'Não foi possível encontrar a análise' 
        };
      }
    } catch (error) {
      log.error('Erro ao recarregar imagens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, []);

  /**
   * Salva análise de vistoria
   */
  const saveAnalysis = useCallback(async (
    dadosVistoria: DadosVistoria,
    apontamentos: ApontamentoVistoria[],
    contractId: string,
    existingAnaliseId?: string,
    selectedPrestadorId?: string,
    documentMode?: 'analise' | 'orcamento',
    publicDocumentId?: string | null
  ): Promise<SaveAnalysisResult> => {
    if (!user) {
      return { 
        success: false, 
        error: 'Usuário não autenticado' 
      };
    }

    if (!contractId) {
      return { 
        success: false, 
        error: 'Contrato não selecionado' 
      };
    }

    try {
      const analysisData = {
        contract_id: contractId,
        dados_vistoria: {
          ...dadosVistoria,
          ...(selectedPrestadorId && { prestador: { id: selectedPrestadorId } }),
          ...(documentMode && { documentMode }),
        },
        apontamentos: apontamentos.map(apontamento => ({
          id: apontamento.id,
          ambiente: apontamento.ambiente,
          subtitulo: apontamento.subtitulo,
          descricao: apontamento.descricao,
          descricaoServico: apontamento.descricaoServico,
          vistoriaInicial: {
            descritivoLaudo: apontamento.vistoriaInicial?.descritivoLaudo || '',
          },
          observacao: apontamento.observacao,
          classificacao: apontamento.classificacao,
          tipo: apontamento.tipo,
          valor: apontamento.valor,
          quantidade: apontamento.quantidade,
        })),
        public_document_id: publicDocumentId,
        user_id: user.id,
      };

      let result;
      if (existingAnaliseId) {
        // Atualizar análise existente
        result = await updateAnalise(existingAnaliseId, analysisData);
      } else {
        // Criar nova análise
        result = await saveAnalise(analysisData);
      }

      if (result.success) {
        toast({
          title: existingAnaliseId ? 'Análise atualizada' : 'Análise salva',
          description: `A análise foi ${existingAnaliseId ? 'atualizada' : 'salva'} com sucesso.`,
        });
      }

      return {
        success: result.success,
        analiseId: result.id,
        error: result.error,
      };
    } catch (error) {
      log.error('Erro ao salvar análise:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar análise';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [user, saveAnalise, updateAnalise, toast]);

  /**
   * Preenche dados da vistoria a partir de um contrato
   */
  const populateVistoriaFromContract = useCallback((
    contract: Contract
  ): DadosVistoria => {
    try {
      const parsedTerms = (contract as any).terms
        ? JSON.parse((contract as any).terms)
        : {};

      // Buscar dados do locatário
      const locatario =
        parsedTerms.locatario ||
        parsedTerms.nome_locatario ||
        parsedTerms.nomeLocatario ||
        parsedTerms.inquilino ||
        parsedTerms.nome_inquilino ||
        parsedTerms.nome ||
        '';

      // Buscar dados do endereço
      const endereco =
        parsedTerms.endereco ||
        parsedTerms.endereco_imovel ||
        parsedTerms.enderecoImovel ||
        parsedTerms.endereco_completo ||
        parsedTerms.logradouro ||
        parsedTerms.rua ||
        '';

      // Se ainda não tiver dados e o título do contrato tiver informações
      let locatarioFinal = locatario;
      const enderecoFinal = endereco;

      if (!locatarioFinal && contract.title) {
        // Tentar extrair do título (ex: "Contrato - João Silva")
        const match = contract.title.match(/[-–]\s*(.+?)(?:\s*[-–]|$)/);
        if (match) locatarioFinal = match[1].trim();
      }

      // Preencher com dados do contrato
      const dadosVistoria: DadosVistoria = {
        locatario: locatarioFinal || 'Não informado',
        endereco: enderecoFinal || 'Não informado',
        dataVistoria: formatDateBrazilian(new Date().toISOString().split('T')[0]),
      };

      return dadosVistoria;
    } catch (error) {
      log.error('Erro ao processar dados do contrato:', error);
      return {
        locatario: 'Não informado',
        endereco: 'Não informado',
        dataVistoria: formatDateBrazilian(new Date().toISOString().split('T')[0]),
      };
    }
  }, []);

  return {
    // Estado
    contracts,
    loading,
    
    // Operações
    fetchContracts,
    loadAnalysisData,
    checkExistingAnalise,
    forceReloadImages,
    saveAnalysis,
    populateVistoriaFromContract,
  };
};

export default useVistoriaApi;