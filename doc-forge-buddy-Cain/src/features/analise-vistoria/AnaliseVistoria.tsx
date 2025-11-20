import React, { useEffect, useCallback } from 'react';
import { useVistoriaState } from './hooks/useVistoriaState';
import { useVistoriaHandlers } from './hooks/useVistoriaHandlers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, X } from '@/utils/iconMapper';
import { useToast } from '@/components/ui/use-toast';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { useNavigate, useParams } from 'react-router-dom';
import { generateEmailHTML } from '@/utils/emailHTMLGenerator';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { anonymizeName, anonymizeAddress } from '@/utils/privacyUtils';

// Import dos subcomponentes
import { ApontamentoForm } from './components/ApontamentoForm';
import { VistoriaResults } from './components/VistoriaResults';
import { PrestadorSelector } from './components/PrestadorSelector';
import { VistoriaActions } from './components/VistoriaActions';
import { DocumentPreviewProminent } from './components/DocumentPreviewProminent';
import { ApontamentosListMinimal } from './components/ApontamentosListMinimal';

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
  const params = useParams<{ contractId?: string }>();
  const { saveAnalise, updateAnalise } = useVistoriaAnalises();
  const { fileToBase64, base64ToFile } = useVistoriaImages();
  const { isPrivacyModeActive } = usePrivacyMode();
  
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
  const [documentPreview, setDocumentPreview] = React.useState<string>('');
  const [showForm, setShowForm] = React.useState(false);

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

  // Ref para evitar múltiplas chamadas simultâneas
  const loadingAnaliseRef = React.useRef<string | null>(null);

  // Função para verificar e carregar análise existente quando contrato é selecionado
  const checkAndLoadExistingAnalise = useCallback(
    async (contractId: string) => {
      if (!contractId || loadingAnaliseRef.current === contractId) {
        return;
      }

      try {
        loadingAnaliseRef.current = contractId;
        setLoadingExistingAnalise(true);
        log.debug('Verificando análise existente para contrato:', contractId);

        // Buscar análise com dados completos
        const { data: analiseData, error: analiseError } = await supabase
          .from('vistoria_analises')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analiseData && !analiseError) {
          log.debug('Análise encontrada:', analiseData.id);
          setHasExistingAnalise(true);
          setExistingAnaliseId(analiseData.id);
          setEditingAnaliseId(analiseData.id);
          setSavedAnaliseId(analiseData.id);
          setIsEditMode(true);

          // Carregar imagens da análise
          const { data: imagesData, error: imagesError } = await supabase
            .from('vistoria_images')
            .select('*')
            .eq('vistoria_id', analiseData.id)
            .order('created_at', { ascending: true });

          if (imagesError) {
            log.error('Erro ao carregar imagens:', imagesError);
          }

          // Log detalhado das imagens carregadas
          log.debug('Imagens carregadas do banco:', {
            total: imagesData?.length || 0,
            detalhes: imagesData?.map((img: any) => ({
              id: img.id,
              apontamento_id: img.apontamento_id,
              tipo_vistoria: img.tipo_vistoria,
              file_name: img.file_name,
              image_url: img.image_url,
            })) || [],
          });

          // Verificar se os apontamentos têm IDs
          const apontamentosData = analiseData.apontamentos as any[];
          if (apontamentosData) {
            log.debug('IDs dos apontamentos:', {
              total: apontamentosData.length,
              ids: apontamentosData.map((ap: any) => ({
                ambiente: ap.ambiente,
                id: ap.id,
                temId: !!ap.id,
              })),
            });
          }

          // Criar objeto completo da análise
          const completeAnalise: VistoriaAnaliseWithImages = {
            ...analiseData,
            images: imagesData || [],
          };

          log.debug('Carregando análise completa:', {
            analiseId: completeAnalise.id,
            apontamentos: completeAnalise.apontamentos?.length || 0,
            imagens: completeAnalise.images?.length || 0,
          });

          // Carregar automaticamente a análise completa
          await loadAnalysisData(completeAnalise, false);

          toast({
            title: 'Análise carregada',
            description:
              'A análise existente para este contrato foi carregada automaticamente.',
          });
        } else {
          log.debug('Nenhuma análise encontrada para o contrato');
          setHasExistingAnalise(false);
          setExistingAnaliseId(null);
          setIsEditMode(false);
          setEditingAnaliseId(null);
          setSavedAnaliseId(null);
        }
      } catch (error) {
        log.error('Erro ao verificar análise existente:', error);
        setHasExistingAnalise(false);
        setExistingAnaliseId(null);
      } finally {
        setLoadingExistingAnalise(false);
        loadingAnaliseRef.current = null;
      }
    },
    [loadAnalysisData, toast]
  );

  // Ref para rastrear o último contrato processado
  const lastProcessedContractRef = React.useRef<string | null>(null);

  // Carregar contrato automaticamente pela URL
  useEffect(() => {
    const contractId = params.contractId;

    if (contractId && contracts.length > 0 && !selectedContract) {
      log.debug('Carregando contrato da URL:', contractId);
      const contract = contracts.find((c) => c.id === contractId);

      if (contract) {
        setSelectedContract(contract);
        log.debug('Contrato encontrado e selecionado:', contract.title);
      } else {
        log.warn('Contrato não encontrado na lista:', contractId);
        toast({
          title: 'Contrato não encontrado',
          description:
            'O contrato especificado na URL não foi encontrado. Selecione um contrato manualmente.',
          variant: 'destructive',
        });
      }
    }
  }, [params.contractId, contracts, selectedContract, toast]);

  // Carregar análise existente quando contrato é selecionado
  useEffect(() => {
    const contractId = selectedContract?.id;
    
    if (contractId) {
      // Evitar processamento duplicado do mesmo contrato
      if (lastProcessedContractRef.current === contractId) {
        return;
      }

      log.debug('Contrato selecionado, verificando análise existente:', contractId);
      lastProcessedContractRef.current = contractId;
      
      // Limpar estado anterior
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

      // Preencher dados básicos da vistoria com dados do contrato
      setDadosVistoria({
        locatario: (selectedContract as any).form_data?.numeroContrato || '',
        endereco: (selectedContract as any).form_data?.enderecoImovel || '',
        dataVistoria: formatDateBrazilian(
          new Date().toISOString().split('T')[0]
        ),
      });

      // Verificar e carregar análise existente
      checkAndLoadExistingAnalise(contractId);
    } else {
      // Limpar quando contrato é desselecionado
      lastProcessedContractRef.current = null;
      setApontamentos([]);
      setHasExistingAnalise(false);
      setExistingAnaliseId(null);
      setIsEditMode(false);
      setEditingAnaliseId(null);
      setSavedAnaliseId(null);
    }
  }, [selectedContract?.id, checkAndLoadExistingAnalise]);

  // Função para atualizar preview do documento
  const updateDocumentPreview = useCallback(async () => {
    if (apontamentos.length === 0) {
      setDocumentPreview('');
      return;
    }

    try {
      const apontamentosValidos = apontamentos.filter((ap) => ap.ambiente && ap.descricao);
      if (apontamentosValidos.length === 0) {
        setDocumentPreview('');
        return;
      }

      // Aplicar anonimização se necessário
      const locatarioOriginal2 = selectedContract?.form_data?.numeroContrato || dadosVistoria.locatario || '';
      const enderecoOriginal2 = selectedContract?.form_data?.enderecoImovel || dadosVistoria.endereco || '';
      
      const locatarioProcessado2 = isPrivacyModeActive
        ? anonymizeName(locatarioOriginal2)
        : locatarioOriginal2;
      const enderecoProcessado2 = isPrivacyModeActive
        ? anonymizeAddress(enderecoOriginal2)
        : enderecoOriginal2;

      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: locatarioProcessado2,
        endereco: enderecoProcessado2,
        dataVistoria: dadosVistoria.dataVistoria || formatDateBrazilian(new Date().toISOString().split('T')[0]),
        documentMode,
        apontamentos: apontamentosValidos,
      });

      setDocumentPreview(template);
    } catch (error) {
      log.error('Erro ao atualizar preview:', error);
      setDocumentPreview('');
    }
  }, [apontamentos, dadosVistoria, documentMode, selectedContract]);

  // Atualizar preview quando apontamentos mudarem
  React.useEffect(() => {
    updateDocumentPreview();
  }, [updateDocumentPreview]);

  // Função para aprovar apontamento (classificar como responsabilidade)
  const handleApproveApontamento = useCallback(
    (id: string) => {
      setApontamentos((prev) =>
        prev.map((ap) =>
          ap.id === id ? { ...ap, classificacao: 'responsabilidade' as const } : ap
        )
      );
      toast({
        title: 'Apontamento aprovado',
        description: 'Classificado como responsabilidade do locatário.',
      });
    },
    [toast]
  );

  // Função para rejeitar/aprovar revisão (classificar como revisão)
  const handleRejectApontamento = useCallback(
    (id: string) => {
      setApontamentos((prev) =>
        prev.map((ap) =>
          ap.id === id ? { ...ap, classificacao: 'revisao' as const } : ap
        )
      );
      toast({
        title: 'Apontamento marcado para revisão',
        description: 'Classificado como passível de revisão.',
      });
    },
    [toast]
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
    setDocumentPreview('');
    setShowForm(false);
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

  // Função para copiar documento para e-mail
  const copyToEmail = useCallback(async () => {
    if (apontamentos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um apontamento antes de copiar.',
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

      toast({
        title: 'Gerando documento...',
        description: 'Processando imagens e formatando para e-mail.',
      });

      // Gerar HTML compatível com e-mail
      const emailHTML = await generateEmailHTML({
        locatario: selectedContract?.form_data?.numeroContrato || dadosVistoria.locatario || '',
        endereco: selectedContract?.form_data?.enderecoImovel || dadosVistoria.endereco || '',
        dataVistoria: dadosVistoria.dataVistoria || formatDateBrazilian(new Date().toISOString().split('T')[0]),
        documentMode,
        apontamentos: apontamentosValidos,
      });

      // Copiar para área de transferência usando Clipboard API moderna
      try {
        // Método 1: Tentar usar Clipboard API com ClipboardItem (suporta HTML)
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            const htmlBlob = new Blob([emailHTML], { type: 'text/html' });
            // Extrair texto puro para fallback
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = emailHTML;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            
            const clipboardItem = new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob,
            });
            
            await navigator.clipboard.write([clipboardItem]);
            
            toast({
              title: 'Documento copiado!',
              description: 'O conteúdo foi copiado para a área de transferência. Cole no corpo do e-mail.',
            });
            return;
          } catch (clipboardError) {
            log.warn('ClipboardItem não funcionou, tentando método alternativo:', clipboardError);
          }
        }

        // Método 2: Criar elemento temporário e usar execCommand
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.contentEditable = 'true';
        tempDiv.innerHTML = emailHTML;
        document.body.appendChild(tempDiv);

        // Selecionar todo o conteúdo
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Copiar usando execCommand
        const success = document.execCommand('copy');
        
        document.body.removeChild(tempDiv);
        selection?.removeAllRanges();

        if (success) {
          toast({
            title: 'Documento copiado!',
            description: 'O conteúdo foi copiado para a área de transferência. Cole no corpo do e-mail.',
          });
        } else {
          throw new Error('execCommand falhou');
        }
      } catch (err) {
        log.error('Erro ao copiar:', err);
        toast({
          title: 'Erro ao copiar',
          description: 'Não foi possível copiar automaticamente. Tente selecionar e copiar manualmente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Erro ao copiar documento:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [
    apontamentos,
    dadosVistoria,
    documentMode,
    selectedContract,
    toast,
  ]);

  // Função para imprimir documento
  const printDocument = useCallback(async () => {
    if (apontamentos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um apontamento antes de imprimir.',
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

      // Aplicar anonimização se necessário
      const locatarioOriginal = selectedContract?.form_data?.numeroContrato || dadosVistoria.locatario || '';
      const enderecoOriginal = selectedContract?.form_data?.enderecoImovel || dadosVistoria.endereco || '';
      
      const locatarioProcessado = isPrivacyModeActive
        ? anonymizeName(locatarioOriginal)
        : locatarioOriginal;
      const enderecoProcessado = isPrivacyModeActive
        ? anonymizeAddress(enderecoOriginal)
        : enderecoOriginal;

      // Gerar template
      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: locatarioProcessado,
        endereco: enderecoProcessado,
        dataVistoria: dadosVistoria.dataVistoria || formatDateBrazilian(new Date().toISOString().split('T')[0]),
        documentMode,
        apontamentos: apontamentosValidos,
      });

      // Criar janela de impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Erro',
          description: 'Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão bloqueados.',
          variant: 'destructive',
        });
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Imprimir - Análise de Vistoria</title>
          <style>
            @page {
              margin: 1cm;
              size: A4;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.6;
                color: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              img {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
              }
              .apontamento {
                page-break-inside: avoid;
                margin-bottom: 20px;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #000;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${template}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 250);
      };
    } catch (error) {
      log.error('Erro ao imprimir documento:', error);
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível imprimir o documento.',
        variant: 'destructive',
      });
    }
  }, [
    apontamentos,
    dadosVistoria,
    documentMode,
    selectedContract,
    toast,
  ]);

  // Função para gerar documento (navega para página de visualização)
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

      // Aplicar anonimização se necessário
      const locatarioOriginal3 = selectedContract?.form_data.numeroContrato || dadosVistoria.locatario || '';
      const enderecoOriginal3 = selectedContract?.form_data.enderecoImovel || dadosVistoria.endereco || '';
      
      const locatarioProcessado3 = isPrivacyModeActive
        ? anonymizeName(locatarioOriginal3)
        : locatarioOriginal3;
      const enderecoProcessado3 = isPrivacyModeActive
        ? anonymizeAddress(enderecoOriginal3)
        : enderecoOriginal3;

      // Preparar dados do documento
      const dadosDocumento = {
        locatario: locatarioProcessado3,
        endereco: enderecoProcessado3,
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
            onCopyToEmail={copyToEmail}
            onPrint={printDocument}
          />
        </div>
      </div>

      {/* Container Principal com Layout Otimizado */}
      <div className="max-w-[1600px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Validação de Contrato Carregado */}
        {!selectedContract && !loading && !params.contractId && !loadingExistingAnalise && (
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

        {selectedContract && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pré-Documento em Destaque (Ocupa 70% do espaço) */}
            <div className="lg:col-span-8">
              <Card className="h-[calc(100vh-200px)] flex flex-col bg-white border-neutral-200 shadow-sm">
                <CardContent className="flex-1 p-6 overflow-hidden">
                  <DocumentPreviewProminent
                    documentPreview={documentPreview}
                    apontamentosCount={apontamentos.length}
                    documentMode={documentMode}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Barra Lateral: Lista Minimalista + Formulário Colapsável (30% do espaço) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Botão para adicionar novo apontamento */}
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Apontamento
                </Button>
              )}

              {/* Formulário Colapsável */}
              {showForm && (
                <Card className="border-neutral-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-neutral-900">
                        {editingApontamento ? 'Editar Apontamento' : 'Novo Apontamento'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowForm(false);
                          handleCancelEdit();
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ApontamentoForm
                      currentApontamento={currentApontamento}
                      setCurrentApontamento={setCurrentApontamento}
                      documentMode={documentMode}
                      editingApontamento={editingApontamento}
                      onSave={() => {
                        editingApontamento ? handleSaveEdit() : handleAddApontamento();
                        setShowForm(false);
                      }}
                      onCancel={() => {
                        handleCancelEdit();
                        setShowForm(false);
                      }}
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
                  </CardContent>
                </Card>
              )}

              {/* Lista Minimalista de Apontamentos */}
              <Card className="border-neutral-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-neutral-900">
                      Apontamentos ({apontamentos.length})
                    </h3>
                  </div>
                  <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                    <ApontamentosListMinimal
                      apontamentos={apontamentos}
                      documentMode={documentMode}
                      onApprove={handleApproveApontamento}
                      onReject={handleRejectApontamento}
                      onEdit={(id) => {
                        handleEditApontamento(id);
                        setShowForm(true);
                      }}
                      onRemove={handleRemoveApontamento}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Prestador - Apenas no modo orçamento */}
              {documentMode === 'orcamento' && prestadores && (
                <Card className="border-neutral-200 shadow-sm">
                  <CardContent className="p-4">
                    <PrestadorSelector
                      selectedPrestadorId={selectedPrestadorId}
                      prestadores={prestadores}
                      onSelectPrestador={setSelectedPrestadorId}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliseVistoria;