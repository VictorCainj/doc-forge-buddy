import React, { useEffect, useCallback } from 'react';
import { useVistoriaState } from './hooks/useVistoriaState';
import { useVistoriaHandlers } from './hooks/useVistoriaHandlers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from '@/utils/iconMapper';
import { useToast } from '@/components/ui/use-toast';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { useNavigate } from 'react-router-dom';

// Import dos subcomponentes
import { ApontamentoForm } from './components/ApontamentoForm';
import { VistoriaResults } from './components/VistoriaResults';
import { PrestadorSelector } from './components/PrestadorSelector';
import { VistoriaActions } from './components/VistoriaActions';

// Import dos tipos
import { 
  VistoriaAnaliseWithImages, 
  Contract,
  ApontamentoVistoria 
} from './types/vistoria';
import { deduplicateImagesBySerial } from '@/utils/imageSerialGenerator';

const AnaliseVistoria: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { saveAnalise, updateAnalise } = useVistoriaAnalises();
  const { fileToBase64, base64ToFile } = useVistoriaImages();
  
  // Hooks customizados para gerenciar estado e handlers
  const {
    // States
    apontamentos,
    setApontamentos,
    currentApontamento,
    setCurrentApontamento,
    contracts,
    selectedContract,
    setSelectedContract,
    dadosVistoria,
    setDadosVistoria,
    loading,
    editingApontamento,
    setEditingApontamento,
    savedAnaliseId,
    setSavedAnaliseId,
    isEditMode,
    setIsEditMode,
    editingAnaliseId,
    setEditingAnaliseId,
    existingAnaliseId,
    setExistingAnaliseId,
    hasExistingAnalise,
    setHasExistingAnalise,
    loadingExistingAnalise,
    setLoadingExistingAnalise,
    saving,
    setSaving,
    documentMode,
    setDocumentMode,
    componentError,
    setComponentError,
    selectedPrestadorId,
    setSelectedPrestadorId,
    extractionText,
    setExtractionText,
    showExtractionPanel,
    setShowExtractionPanel,
    publicDocumentId,
    setPublicDocumentId,
    isAILoading,
    prestadores,
  } = useVistoriaState();

  // Handlers customizados
  const {
    handleAddApontamento,
    handleRemoveApontamento,
    handleEditApontamento,
    handleSaveEdit,
    handleCancelEdit,
    handleCorrectText,
    handleExtractApontamentos,
    handleAIAnalysisForCurrentApontamento,
  } = useVistoriaHandlers({
    apontamentos,
    setApontamentos,
    currentApontamento,
    setCurrentApontamento,
    editingApontamento,
    setEditingApontamento,
    documentMode,
    fileToBase64,
    toast,
  });

  // Estados adicionais específicos do componente
  const [externalImageUrl, setExternalImageUrl] = React.useState('');
  const [showExternalUrlInput, setShowExternalUrlInput] = React.useState(false);

  // Função para carregar dados da análise em modo de edição
  const loadAnalysisData = useCallback(
    async (
      analiseData: VistoriaAnaliseWithImages,
      showToast: boolean = true
    ) => {
      try {
        log.debug('=== CARREGANDO DADOS DA ANÁLISE ===');
        log.debug('Análise ID:', analiseData.id);
        log.debug('Imagens disponíveis:', analiseData.images?.length || 0);
        log.debug('Dados das imagens:', analiseData.images);
        log.debug('Dados completos da análise:', analiseData);

        // Carregar public_document_id se existir
        if (analiseData.public_document_id) {
          setPublicDocumentId(analiseData.public_document_id);
        }

        // Carregar dados da vistoria
        if (analiseData.dados_vistoria) {
          const dados = analiseData.dados_vistoria as any;

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
            setDadosVistoria(dadosCarregados);
          }

          // Carregar o modo do documento se existir
          if (dados.documentMode) {
            setDocumentMode(dados.documentMode as 'analise' | 'orcamento');
          }

          // Carregar ID do prestador se existir
          if (dados.prestador) {
            const prestador = dados.prestador as any;
            if (prestador.id) {
              setSelectedPrestadorId(prestador.id as string);
            }
          }
        }

        // Carregar apontamentos com imagens
        if (analiseData.apontamentos) {
          const apontamentosData = analiseData.apontamentos as any[];
          // Se há imagens do banco de dados, usar elas
          const hasDatabaseImages =
            analiseData.images && analiseData.images.length > 0;
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
                  (img: any) =>
                    img.apontamento_id === apontamento.id
                );

                // ✅ DEDUPLICAÇÃO DUPLA: Por serial E por URL
                const uniqueImages =
                  deduplicateImagesBySerial(apontamentoImages);
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
                    (img: any) =>
                      img.tipo_vistoria === 'inicial'
                  )
                  .map((img: any) => {
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
                    (img: any) =>
                      img.tipo_vistoria === 'final'
                  )
                  .map((img: any) => {
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
                      async (foto: any) => {
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
                      async (foto: any) => {
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
          setApontamentos(apontamentosWithImages);
        }
        
        // Encontrar e selecionar o contrato correspondente
        if (analiseData.contract_id && contracts.length > 0) {
          const contract = contracts.find(
            (c) => c.id === analiseData.contract_id
          );
          if (contract) {
            setSelectedContract(contract);

            // Se os dados da vistoria estiverem vazios, preencher com dados do contrato
            const dados = analiseData.dados_vistoria as any;
            if (!dados?.locatario || !dados?.endereco) {
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
                  const match = contract.title.match(
                    /[-–]\s*(.+?)(?:\s*[-–]|$)/
                  );
                  if (match) locatarioFinal = match[1].trim();
                }

                // Preencher com dados do contrato
                setDadosVistoria((prev) => ({
                  locatario:
                    locatarioFinal || prev.locatario || 'Não informado',
                  endereco: enderecoFinal || prev.endereco || 'Não informado',
                  dataVistoria:
                    prev.dataVistoria || new Date().toLocaleDateString('pt-BR'),
                }));

                log.info('Dados do contrato preenchidos ao carregar análise:', {
                  locatario: locatarioFinal,
                  endereco: enderecoFinal,
                });
              } catch (error) {
                log.error('Erro ao processar dados do contrato:', error);
              }
            }
          }
        }
        if (showToast) {
          toast({
            title: 'Análise carregada',
            description: 'Os dados da análise foram carregados para edição.',
          });
        }
      } catch (error) {
        log.error('Erro ao carregar dados da análise:', error);
        toast({
          title: 'Erro ao carregar análise',
          description: 'Não foi possível carregar os dados da análise.',
          variant: 'destructive',
        });
      }
    },
    [contracts, toast, base64ToFile]
  );

  // Função para limpar todos os dados
  const clearAllData = useCallback(() => {
    setApontamentos([]);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      descricaoServico: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      classificacao: undefined,
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });
    setEditingApontamento(null);
    setSavedAnaliseId(null);
    setIsEditMode(false);
    setEditingAnaliseId(null);
    setExistingAnaliseId(null);
    setHasExistingAnalise(false);
    setPublicDocumentId(null);
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram removidos com sucesso.',
    });
  }, [toast, setApontamentos, setCurrentApontamento]);

  // Função para salvar análise
  const saveAnalysis = useCallback(async () => {
    if (!selectedContract) {
      toast({
        title: 'Erro',
        description: 'Selecione um contrato antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    if (apontamentos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um apontamento antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const dadosAnalise = {
        contract_id: selectedContract.id,
        dados_vistoria: {
          ...dadosVistoria,
          documentMode,
          ...(documentMode === 'orcamento' && selectedPrestadorId && {
            prestador: { id: selectedPrestadorId },
          }),
        },
        apontamentos,
        public_document_id: publicDocumentId,
      };

      let result;
      if (isEditMode && editingAnaliseId) {
        result = await updateAnalise(editingAnaliseId, dadosAnalise);
      } else {
        result = await saveAnalise(dadosAnalise);
      }

      if (result) {
        setSavedAnaliseId(result.id);
        if (!isEditMode) {
          setIsEditMode(true);
          setEditingAnaliseId(result.id);
        }
        toast({
          title: 'Análise salva',
          description: isEditMode 
            ? 'As alterações foram salvas com sucesso.' 
            : 'A análise foi salva com sucesso.',
        });
      }
    } catch (error) {
      log.error('Erro ao salvar análise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a análise.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [
    selectedContract,
    dadosVistoria,
    documentMode,
    apontamentos,
    publicDocumentId,
    isEditMode,
    editingAnaliseId,
    selectedPrestadorId,
    saveAnalise,
    updateAnalise,
    toast,
  ]);

  // Função para gerar documento
  const generateDocument = useCallback(async () => {
    if (apontamentos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um apontamento antes de gerar o documento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validar apontamentos
      const apontamentosValidos = apontamentos.filter((apontamento) => {
        return apontamento.ambiente && apontamento.descricao;
      });

      if (apontamentosValidos.length === 0) {
        toast({
          title: 'Erro',
          description: 'Todos os apontamentos devem ter ambiente e descrição.',
          variant: 'destructive',
        });
        return;
      }

      // Preparar dados do documento
      const dadosDocumento = {
        locatario: selectedContract?.form_data.numeroContrato || dadosVistoria.locatario || '',
        endereco: selectedContract?.form_data.enderecoImovel || dadosVistoria.endereco || '',
        dataVistoria: dadosVistoria.dataVistoria || formatDateBrazilian(new Date().toISOString().split('T')[0]),
        documentMode,
        apontamentos: apontamentosValidos,
      };

      // Gerar template
      const template = await ANALISE_VISTORIA_TEMPLATE(dadosDocumento);

      // Preservar estado antes de navegar
      const preserveState = {
        apontamentos,
        dadosVistoria,
        selectedContract,
        savedAnaliseId,
        isEditMode,
        editingAnaliseId,
        existingAnaliseId,
        hasExistingAnalise,
        contractId: selectedContract?.id,
      };

      // Navegar para página de documento
      navigate('/documento-vistoria', {
        state: {
          template,
          documentMode,
          prestadorId: documentMode === 'orcamento' ? selectedPrestadorId : null,
          preserveAnalysisState: preserveState,
        },
      });
    } catch (error) {
      log.error('Erro ao gerar documento:', error);
      toast({
        title: 'Erro ao gerar documento',
        description: 'Não foi possível gerar o documento.',
        variant: 'destructive',
      });
    }
  }, [
    apontamentos,
    dadosVistoria,
    documentMode,
    selectedContract,
    selectedPrestadorId,
    savedAnaliseId,
    isEditMode,
    editingAnaliseId,
    existingAnaliseId,
    hasExistingAnalise,
    navigate,
    toast,
  ]);

  // Exibir tela de erro se houver algum problema
  if (componentError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Erro no Componente
            </h2>
            <p className="text-neutral-600 mb-4">{componentError}</p>
            <Button
              onClick={() => {
                setComponentError(null);
                window.location.reload();
              }}
              className="w-full"
            >
              Recarregar Página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header com Ações Principais */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <VistoriaActions
            isEditMode={isEditMode}
            apontamentosCount={apontamentos.length}
            savedAnaliseId={savedAnaliseId}
            saving={saving}
            hasExistingAnalise={hasExistingAnalise}
            selectedContract={selectedContract}
            onClearAll={clearAllData}
            onSave={saveAnalysis}
            onGenerateDocument={generateDocument}
          />
        </div>
      </div>

      {/* Container Principal com Espaçamento Lateral */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Validação de Contrato Carregado */}
        {!selectedContract && !loading && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <p className="text-amber-800">
                  <strong>Atenção:</strong> Selecione um contrato para iniciar a análise de vistoria.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Formulário de Novo Apontamento */}
          <ApontamentoForm
            currentApontamento={currentApontamento}
            setCurrentApontamento={setCurrentApontamento}
            documentMode={documentMode}
            editingApontamento={editingApontamento}
            onSave={editingApontamento ? handleSaveEdit : handleAddApontamento}
            onCancel={handleCancelEdit}
            isAILoading={isAILoading}
            onCorrectText={handleCorrectText}
            onAIAnalysis={handleAIAnalysisForCurrentApontamento}
            showExtractionPanel={showExtractionPanel}
            setShowExtractionPanel={setShowExtractionPanel}
            extractionText={extractionText}
            setExtractionText={setExtractionText}
            onExtractApontamentos={handleExtractApontamentos}
            showExternalUrlInput={showExternalUrlInput}
            setShowExternalUrlInput={setShowExternalUrlInput}
            externalImageUrl={externalImageUrl}
            setExternalImageUrl={setExternalImageUrl}
          />

          {/* Resultados e Lista de Apontamentos */}
          <VistoriaResults
            apontamentos={apontamentos}
            documentMode={documentMode}
            selectedContract={selectedContract}
            dadosVistoria={dadosVistoria}
            onEdit={handleEditApontamento}
            onRemove={handleRemoveApontamento}
          />
        </div>

        {/* Seleção de Prestador - Apenas no modo orçamento */}
        {documentMode === 'orcamento' && selectedContract && prestadores && (
          <div className="mt-6">
            <PrestadorSelector
              selectedPrestadorId={selectedPrestadorId}
              prestadores={prestadores}
              onSelectPrestador={setSelectedPrestadorId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliseVistoria;