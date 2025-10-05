import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { log } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Upload,
  FileImage,
  CheckCircle,
  AlertTriangle,
  Eye,
  Search,
  FileText,
  Edit,
  User,
  MapPin,
  Calendar,
  ClipboardList,
  Camera,
  Settings,
  Save,
  X,
  Home,
  Archive,
  AlertCircle,
  CheckCircle2,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBrazilian } from '@/utils/dateFormatter';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import {
  ApontamentoVistoria,
  DadosVistoria,
  VistoriaAnaliseWithImages,
} from '@/types/vistoria';
import { BudgetItemType, DadosPrestador } from '@/types/orcamento';
import { Package, Wrench } from 'lucide-react';

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

const AnaliseVistoria = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { correctText, isLoading: isAILoading } = useOpenAI();
  const { saveAnalise, updateAnalise } = useVistoriaAnalises();
  const { fileToBase64, base64ToFile } = useVistoriaImages();

  const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);
  const [currentApontamento, setCurrentApontamento] = useState<
    Partial<ApontamentoVistoria & { tipo?: BudgetItemType; valor?: number; quantidade?: number }>
  >({
    ambiente: '',
    subtitulo: '',
    descricao: '',
    vistoriaInicial: { fotos: [], descritivoLaudo: '' },
    vistoriaFinal: { fotos: [] },
    observacao: '',
    tipo: 'material',
    valor: 0,
    quantidade: 0,
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [dadosVistoria, setDadosVistoria] = useState<DadosVistoria>({
    locatario: '',
    endereco: '',
    dataVistoria: '',
  });
  const [_loading, setLoading] = useState(true);
  const [editingApontamento, setEditingApontamento] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [showDadosVistoria, setShowDadosVistoria] = useState(true);
  const [savedAnaliseId, setSavedAnaliseId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnaliseId, setEditingAnaliseId] = useState<string | null>(null);
  const [existingAnaliseId, setExistingAnaliseId] = useState<string | null>(
    null
  );
  const [hasExistingAnalise, setHasExistingAnalise] = useState(false);
  const [loadingExistingAnalise, setLoadingExistingAnalise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentMode, setDocumentMode] = useState<'analise' | 'orcamento'>('analise');
  const [dadosPrestador, setDadosPrestador] = useState<DadosPrestador>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
  });
  const [showDadosPrestador, setShowDadosPrestador] = useState(false);

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

        // Carregar dados da vistoria
        if (analiseData.dados_vistoria) {
          const dados = analiseData.dados_vistoria as Record<string, unknown>;
          setDadosVistoria({
            locatario: dados.locatario || '',
            endereco: dados.endereco || '',
            dataVistoria: dados.dataVistoria || '',
          });
          
          // Carregar o modo do documento se existir
          if (dados.documentMode) {
            setDocumentMode(dados.documentMode as 'analise' | 'orcamento');
          }
          
          // Carregar dados do prestador se existirem
          if (dados.prestador) {
            const prestador = dados.prestador as Record<string, unknown>;
            setDadosPrestador({
              nome: (prestador.nome as string) || '',
              cnpj: (prestador.cnpj as string) || '',
              telefone: (prestador.telefone as string) || '',
              email: (prestador.email as string) || '',
            });
            setShowDadosPrestador(true);
          }
        }

        // Carregar apontamentos com imagens
        if (analiseData.apontamentos) {
          const apontamentosData = analiseData.apontamentos as Record<
            string,
            unknown
          >[];
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
                const apontamentoImages = analiseData.images.filter(
                  (img: Record<string, unknown>) =>
                    img.apontamento_id === apontamento.id
                );
                const fotosInicial = apontamentoImages
                  .filter(
                    (img: Record<string, unknown>) =>
                      img.tipo_vistoria === 'inicial'
                  )
                  .map((img: Record<string, unknown>) => {
                    return {
                      name: img.file_name,
                      size: img.file_size,
                      type: img.file_type,
                      url: img.image_url,
                      isFromDatabase: true,
                    };
                  });
                const fotosFinal = apontamentoImages
                  .filter(
                    (img: Record<string, unknown>) =>
                      img.tipo_vistoria === 'final'
                  )
                  .map((img: Record<string, unknown>) => {
                    return {
                      name: img.file_name,
                      size: img.file_size,
                      type: img.file_type,
                      url: img.image_url,
                      isFromDatabase: true,
                    };
                  });
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
          setApontamentos(apontamentosWithImages);
        }
        // Encontrar e selecionar o contrato correspondente
        if (analiseData.contract_id && contracts.length > 0) {
          const contract = contracts.find(
            (c) => c.id === analiseData.contract_id
          );
          if (contract) {
            setSelectedContract(contract);
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

  // Carregar contratos do Supabase
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('document_type', 'contrato')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContracts((data as Contract[]) || []);
      } catch {
        toast({
          title: 'Erro ao carregar contratos',
          description: 'Não foi possível carregar a lista de contratos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [toast]);

  // Detectar modo de edição e carregar dados da análise
  useEffect(() => {
    const state = location.state as {
      editMode?: boolean;
      analiseData?: VistoriaAnaliseWithImages;
      preserveAnalysisState?: {
        apontamentos: ApontamentoVistoria[];
        dadosVistoria: DadosVistoria;
        selectedContract: Contract | null;
        savedAnaliseId: string | null;
        isEditMode: boolean;
        editingAnaliseId: string | null;
        existingAnaliseId: string | null;
        hasExistingAnalise: boolean;
      };
    };

    if (state?.editMode && state?.analiseData && contracts.length > 0) {
      setIsEditMode(true);
      setEditingAnaliseId(state.analiseData.id);
      setSavedAnaliseId(state.analiseData.id);
      // Carregar dados da análise (exibir toast)
      loadAnalysisData(state.analiseData, true);
    } else if (state?.preserveAnalysisState && contracts.length > 0) {
      // Restaurar estado preservado ao retornar da geração de documento
      const preservedState = state.preserveAnalysisState;

      setApontamentos(preservedState.apontamentos);
      setDadosVistoria(preservedState.dadosVistoria);
      setSelectedContract(preservedState.selectedContract);
      setSavedAnaliseId(preservedState.savedAnaliseId);
      setIsEditMode(preservedState.isEditMode);
      setEditingAnaliseId(preservedState.editingAnaliseId);
      setExistingAnaliseId(preservedState.existingAnaliseId);
      setHasExistingAnalise(preservedState.hasExistingAnalise);

      toast({
        title: 'Estado restaurado',
        description:
          'O estado da análise foi restaurado após a geração do documento.',
      });
    }
  }, [location.state, contracts, loadAnalysisData, toast]);

  // Carregar estado salvo do localStorage (para compatibilidade com dados antigos)
  useEffect(() => {
    const loadLegacyState = async () => {
      const savedState = localStorage.getItem('analise-vistoria-state');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);

          // Recriar apontamentos com objetos File a partir do base64
          if (parsedState.apontamentos) {
            const apontamentosComFotos = await Promise.all(
              parsedState.apontamentos.map(
                async (apontamento: Record<string, unknown>) => ({
                  ...apontamento,
                  vistoriaInicial: {
                    ...apontamento.vistoriaInicial,
                    fotos: await Promise.all(
                      (apontamento.vistoriaInicial?.fotos || []).map(
                        async (foto: Record<string, unknown>) => {
                          if (foto.base64) {
                            return base64ToFile(
                              foto.base64,
                              foto.name,
                              foto.type
                            );
                          }
                          // Fallback para fotos antigas sem base64
                          return new File([], foto.name, { type: foto.type });
                        }
                      )
                    ),
                  },
                  vistoriaFinal: {
                    ...apontamento.vistoriaFinal,
                    fotos: await Promise.all(
                      (apontamento.vistoriaFinal?.fotos || []).map(
                        async (foto: Record<string, unknown>) => {
                          if (foto.base64) {
                            return base64ToFile(
                              foto.base64,
                              foto.name,
                              foto.type
                            );
                          }
                          // Fallback para fotos antigas sem base64
                          return new File([], foto.name, { type: foto.type });
                        }
                      )
                    ),
                  },
                })
              )
            );
            setApontamentos(apontamentosComFotos);
          }

          if (parsedState.selectedContractId) {
            // Encontrar o contrato selecionado
            const contract = contracts.find(
              (c) => c.id === parsedState.selectedContractId
            );
            if (contract) {
              setSelectedContract(contract);
            }
          }
          if (parsedState.dadosVistoria) {
            setDadosVistoria(parsedState.dadosVistoria);
          }
          if (parsedState.showDadosVistoria !== undefined) {
            setShowDadosVistoria(parsedState.showDadosVistoria);
          }
        } catch (error) {
          log.error('Erro ao carregar estado salvo:', error);
          // Erro ao carregar estado salvo - continuar normalmente
        }
      }
    };

    loadLegacyState();
  }, [contracts, base64ToFile]);

  // Salvar estado no localStorage como backup (para compatibilidade)
  useEffect(() => {
    const saveLegacyState = async () => {
      try {
        // Criar uma versão serializável dos apontamentos com base64
        const apontamentosSerializaveis = await Promise.all(
          apontamentos.map(async (apontamento) => ({
            ...apontamento,
            vistoriaInicial: {
              ...apontamento.vistoriaInicial,
              fotos: await Promise.all(
                (apontamento.vistoriaInicial?.fotos || []).map(async (foto) => {
                  // Se é uma foto do banco de dados, não converter para base64
                  if (foto.isFromDatabase) {
                    return {
                      name: foto.name,
                      size: foto.size,
                      type: foto.type,
                      lastModified: foto.lastModified,
                      base64: foto.url, // Usar a URL diretamente
                      isFromDatabase: true,
                      url: foto.url,
                    };
                  }

                  // Se é um File, converter para base64
                  return {
                    name: foto.name,
                    size: foto.size,
                    type: foto.type,
                    lastModified: foto.lastModified,
                    base64: await fileToBase64(foto),
                  };
                })
              ),
            },
            vistoriaFinal: {
              ...apontamento.vistoriaFinal,
              fotos: await Promise.all(
                (apontamento.vistoriaFinal?.fotos || []).map(async (foto) => {
                  // Se é uma foto do banco de dados, não converter para base64
                  if (foto.isFromDatabase) {
                    return {
                      name: foto.name,
                      size: foto.size,
                      type: foto.type,
                      lastModified: foto.lastModified,
                      base64: foto.url, // Usar a URL diretamente
                      isFromDatabase: true,
                      url: foto.url,
                    };
                  }

                  // Se é um File, converter para base64
                  return {
                    name: foto.name,
                    size: foto.size,
                    type: foto.type,
                    lastModified: foto.lastModified,
                    base64: await fileToBase64(foto),
                  };
                })
              ),
            },
          }))
        );

        const stateToSave = {
          apontamentos: apontamentosSerializaveis,
          selectedContractId: selectedContract?.id,
          dadosVistoria,
          showDadosVistoria,
          savedAnaliseId,
        };
        localStorage.setItem(
          'analise-vistoria-state',
          JSON.stringify(stateToSave)
        );
      } catch (error) {
        log.error('Erro ao salvar estado de backup:', error);
      }
    };

    saveLegacyState();
  }, [
    apontamentos,
    selectedContract,
    dadosVistoria,
    showDadosVistoria,
    savedAnaliseId,
    fileToBase64,
  ]);

  // Atualizar pré-visualização do documento em tempo real
  useEffect(() => {
    const updateDocumentPreview = async () => {
      if (apontamentos.length === 0) {
        setDocumentPreview('');
        return;
      }

      try {
        // Validar se todos os apontamentos têm dados válidos
        const apontamentosValidos = apontamentos.filter((apontamento) => {
          return apontamento.ambiente && apontamento.descricao;
        });

        if (apontamentosValidos.length === 0) {
          setDocumentPreview('');
          return;
        }

        // Debug: Verificar apontamentos antes da validação
        // console.log('=== DEBUG: APONTAMENTOS ANTES DA VALIDAÇÃO ===');
        // console.log(
        //   'Total de apontamentos válidos:',
        //   apontamentosValidos.length
        // );
        apontamentosValidos.forEach((_apontamento, _index) => {
          // console.log(
          //   `\n--- Apontamento ${index + 1}: ${apontamento.ambiente} ---`
          // );
          // console.log('Fotos Inicial:', apontamento.vistoriaInicial?.fotos);
          // console.log('Fotos Final:', apontamento.vistoriaFinal?.fotos);
          // console.log(
          //   'Tipo das fotos Inicial:',
          //   typeof apontamento.vistoriaInicial?.fotos
          // );
          // console.log(
          //   'Tipo das fotos Final:',
          //   typeof apontamento.vistoriaFinal?.fotos
          // );
        });

        // Verificar se há fotos válidas nos apontamentos
        // console.log('\n=== INICIANDO VALIDAÇÃO DE FOTOS ===');
        // console.log('Apontamentos válidos:', apontamentosValidos.length);

        const apontamentosComFotos = apontamentosValidos.map((apontamento) => {
          // console.log(`\n=== VALIDANDO APONTAMENTO: ${apontamento.ambiente} ===`);
          // console.log('Fotos Inicial originais:', apontamento.vistoriaInicial?.fotos);
          // console.log('Fotos Final originais:', apontamento.vistoriaFinal?.fotos);

          // Verificar se as fotos são objetos File válidos ou imagens do banco
          const fotosInicialValidas =
            apontamento.vistoriaInicial?.fotos?.filter((foto) => {
              // console.log('Validando foto inicial:', foto);
              // console.log('- isFromDatabase:', foto?.isFromDatabase);
              // console.log('- URL:', foto?.url);
              // console.log('- É File?:', foto instanceof File);

              // Se é do banco de dados, verificar se tem URL
              if (foto?.isFromDatabase) {
                const hasValidUrl = foto.url && foto.url.length > 0;
                // console.log('- Foto do banco - URL válida:', hasValidUrl);
                return hasValidUrl;
              }
              // Se é File, verificar se é válido
              const isValidFile = foto instanceof File && foto.size > 0;
              // console.log('- Foto File - é válida:', isValidFile);
              return isValidFile;
            }) || [];

          const fotosFinalValidas =
            apontamento.vistoriaFinal?.fotos?.filter((foto) => {
              // console.log('Validando foto final:', foto);
              // console.log('- isFromDatabase:', foto?.isFromDatabase);
              // console.log('- URL:', foto?.url);
              // console.log('- É File?:', foto instanceof File);

              // Se é do banco de dados, verificar se tem URL
              if (foto?.isFromDatabase) {
                const hasValidUrl = foto.url && foto.url.length > 0;
                // console.log('- Foto do banco - URL válida:', hasValidUrl);
                return hasValidUrl;
              }
              // Se é File, verificar se é válido
              const isValidFile = foto instanceof File && foto.size > 0;
              // console.log('- Foto File - é válida:', isValidFile);
              return isValidFile;
            }) || [];

          // console.log(`RESULTADO ${apontamento.ambiente}:`);
          // console.log('- Fotos Inicial válidas:', fotosInicialValidas.length);
          // console.log('- Fotos Final válidas:', fotosFinalValidas.length);

          return {
            ...apontamento,
            vistoriaInicial: {
              ...apontamento.vistoriaInicial,
              fotos: fotosInicialValidas,
            },
            vistoriaFinal: {
              ...apontamento.vistoriaFinal,
              fotos: fotosFinalValidas,
            },
          };
        });

        // Gerar template do documento
        const template = await ANALISE_VISTORIA_TEMPLATE({
          locatario: dadosVistoria.locatario,
          endereco: dadosVistoria.endereco,
          dataVistoria: dadosVistoria.dataVistoria,
          documentMode,
          apontamentos: apontamentosComFotos,
        });

        setDocumentPreview(template);
      } catch {
        setDocumentPreview('');
      }
    };

    updateDocumentPreview();
  }, [apontamentos, dadosVistoria, documentMode]);

  // Filtrar contratos baseado no termo de busca
  const filteredContracts = contracts.filter((contract) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const numeroContrato =
      contract.form_data.numeroContrato?.toLowerCase() || '';
    const nomeLocatario = contract.form_data.nomeLocatario?.toLowerCase() || '';
    const enderecoImovel =
      contract.form_data.enderecoImovel?.toLowerCase() || '';

    return (
      numeroContrato.includes(searchLower) ||
      nomeLocatario.includes(searchLower) ||
      enderecoImovel.includes(searchLower)
    );
  });

  // Função para verificar e carregar análise existente para o contrato selecionado
  // Função para forçar recarregamento das imagens
  const forceReloadImages = async () => {
    if (!selectedContract || !existingAnaliseId) {
      toast({
        title: 'Erro',
        description: 'Nenhuma análise selecionada para recarregar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoadingExistingAnalise(true);

      toast({
        title: 'Recarregando imagens...',
        description: 'Carregando imagens da análise existente.',
      });

      // Buscar análise com dados completos
      const { data: analiseData, error: analiseError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('contract_id', selectedContract.id)
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
          // console.error('Erro ao carregar imagens:', imagesError);
          toast({
            title: 'Erro ao carregar imagens',
            description: 'Não foi possível carregar as imagens da análise.',
            variant: 'destructive',
          });
          return;
        }

        // Criar objeto completo da análise
        const completeAnalise: VistoriaAnaliseWithImages = {
          ...analiseData,
          images: imagesData || [],
        };

        // console.log('=== FORÇANDO RECARREGAMENTO DE IMAGENS ===');
        // console.log('Análise encontrada:', analiseData.id);
        // console.log('Imagens encontradas:', imagesData?.length || 0);
        // console.log('Dados das imagens:', imagesData);

        // Carregar automaticamente a análise completa (NÃO exibir toast)
        await loadAnalysisData(completeAnalise, false);

        toast({
          title: 'Imagens recarregadas',
          description: `${imagesData?.length || 0} imagens foram carregadas com sucesso.`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar a análise.',
          variant: 'destructive',
        });
      }
    } catch {
      // console.error('Erro ao recarregar imagens:', error);
      toast({
        title: 'Erro ao recarregar',
        description: 'Não foi possível recarregar as imagens.',
        variant: 'destructive',
      });
    } finally {
      setLoadingExistingAnalise(false);
    }
  };

  const checkExistingAnalise = useCallback(
    async (contractId: string) => {
      if (!contractId) {
        setHasExistingAnalise(false);
        setExistingAnaliseId(null);
        return;
      }

      try {
        setLoadingExistingAnalise(true);

        // Buscar análise com dados completos
        const { data: analiseData, error: analiseError } = await supabase
          .from('vistoria_analises')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analiseData && !analiseError) {
          setHasExistingAnalise(true);
          setExistingAnaliseId(analiseData.id);

          // Carregar imagens da análise
          const { data: imagesData, error: imagesError } = await supabase
            .from('vistoria_images')
            .select('*')
            .eq('vistoria_id', analiseData.id)
            .order('created_at', { ascending: true });

          if (imagesError) {
            // console.error('Erro ao carregar imagens:', imagesError);
          }

          // Criar objeto completo da análise
          const completeAnalise: VistoriaAnaliseWithImages = {
            ...analiseData,
            images: imagesData || [],
          };

          // Carregar automaticamente a análise completa (NÃO exibir toast)
          await loadAnalysisData(completeAnalise, false);

          toast({
            title: 'Análise carregada',
            description:
              'A análise existente para este contrato foi carregada automaticamente.',
          });
        } else {
          setHasExistingAnalise(false);
          setExistingAnaliseId(null);
        }
      } catch {
        // console.error('Erro ao verificar análise existente:', error);
        setHasExistingAnalise(false);
        setExistingAnaliseId(null);
      } finally {
        setLoadingExistingAnalise(false);
      }
    },
    [loadAnalysisData, toast]
  );

  // Atualizar dados da vistoria quando contrato for selecionado
  useEffect(() => {
    if (selectedContract) {
      setDadosVistoria({
        locatario: selectedContract.form_data.numeroContrato || '',
        endereco: selectedContract.form_data.enderecoImovel || '',
        dataVistoria: formatDateBrazilian(
          new Date().toISOString().split('T')[0]
        ),
      });

      // Verificar se já existe análise para este contrato
      checkExistingAnalise(selectedContract.id);
    } else {
      setHasExistingAnalise(false);
      setExistingAnaliseId(null);
    }
  }, [selectedContract, checkExistingAnalise]);

  // Ocultar automaticamente os dados da vistoria quando preenchidos
  useEffect(() => {
    if (
      dadosVistoria.locatario &&
      dadosVistoria.endereco &&
      dadosVistoria.dataVistoria
    ) {
      // Aguardar um pequeno delay para dar tempo do usuário ver os dados sendo preenchidos
      const timer = setTimeout(() => {
        setShowDadosVistoria(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [dadosVistoria]);

  const handleAddApontamento = () => {
    if (!currentApontamento.ambiente || !currentApontamento.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o ambiente e a descrição do apontamento.',
        variant: 'destructive',
      });
      return;
    }

    const newApontamento: ApontamentoVistoria = {
      id: Date.now().toString(),
      ambiente: currentApontamento.ambiente || '',
      subtitulo: currentApontamento.subtitulo || '',
      descricao: currentApontamento.descricao || '',
      vistoriaInicial: {
        fotos: currentApontamento.vistoriaInicial?.fotos || [],
      },
      vistoriaFinal: { fotos: currentApontamento.vistoriaFinal?.fotos || [] },
      observacao: currentApontamento.observacao || '',
      // Salvar valores de orçamento se estiver no modo orçamento
      ...(documentMode === 'orcamento' && {
        tipo: currentApontamento.tipo || 'material',
        valor: currentApontamento.valor || 0,
        quantidade: currentApontamento.quantidade || 0,
      }),
    };

    setApontamentos([...apontamentos, newApontamento]);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });

    toast({
      title: 'Apontamento adicionado',
      description: 'O apontamento foi adicionado com sucesso.',
    });
  };

  const handleRemoveApontamento = (id: string) => {
    setApontamentos(apontamentos.filter((ap) => ap.id !== id));
    toast({
      title: 'Apontamento removido',
      description: 'O apontamento foi removido com sucesso.',
    });
  };

  const _handleFileUpload = (
    files: FileList | null,
    tipo: 'inicial' | 'final'
  ) => {
    if (!files) return;

    const fileArray = Array.from(files);
    setCurrentApontamento((prev) => ({
      ...prev,
      [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
        fotos: [
          ...(prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]
            ?.fotos || []),
          ...fileArray,
        ],
      },
    }));
  };

  // Função para remover uma foto específica da vistoria inicial
  const handleRemoveFotoInicial = (index: number) => {
    setCurrentApontamento((prev) => ({
      ...prev,
      vistoriaInicial: {
        ...prev.vistoriaInicial,
        fotos: prev.vistoriaInicial?.fotos?.filter((_, i) => i !== index) || [],
      },
    }));
    toast({
      title: 'Foto removida',
      description: 'A foto foi removida da vistoria inicial.',
    });
  };

  // Função para remover uma foto específica da vistoria final
  const handleRemoveFotoFinal = (index: number) => {
    setCurrentApontamento((prev) => ({
      ...prev,
      vistoriaFinal: {
        ...prev.vistoriaFinal,
        fotos: prev.vistoriaFinal?.fotos?.filter((_, i) => i !== index) || [],
      },
    }));
    toast({
      title: 'Foto removida',
      description: 'A foto foi removida da vistoria final.',
    });
  };

  // Função para lidar com Ctrl+V (colar imagens)
  const handlePaste = (event: ClipboardEvent, tipo: 'inicial' | 'final') => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      setCurrentApontamento((prev) => ({
        ...prev,
        [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
          fotos: [
            ...(prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]
              ?.fotos || []),
            ...files,
          ],
        },
      }));

      toast({
        title: 'Imagens coladas',
        description: `${files.length} imagem(ns) adicionada(s) via Ctrl+V.`,
      });
    }
  };

  // Salvar análise no Supabase
  const saveAnalysis = async () => {
    if (apontamentos.length === 0) {
      toast({
        title: 'Nenhum apontamento',
        description: 'Adicione pelo menos um apontamento antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedContract) {
      toast({
        title: 'Contrato não selecionado',
        description: 'Selecione um contrato antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const title = `Análise de Vistoria - ${dadosVistoria.locatario} - ${new Date().toLocaleDateString('pt-BR')}`;

      let analiseId: string | null = null;

      if (isEditMode && editingAnaliseId) {
        // Modo de edição - atualizar análise existente
        const success = await updateAnalise(editingAnaliseId, {
          title,
          contract_id: selectedContract.id,
          dados_vistoria: {
            ...dadosVistoria,
            documentMode, // Salvar o modo do documento
            prestador: documentMode === 'orcamento' ? dadosPrestador : undefined, // Salvar dados do prestador
          },
          apontamentos: apontamentos,
        });

        if (success) {
          analiseId = editingAnaliseId;
          toast({
            title: 'Análise atualizada',
            description: 'A análise foi atualizada com sucesso.',
          });
        }
      } else {
        // Modo de criação - salvar nova análise
        analiseId = await saveAnalise({
          title,
          contract_id: selectedContract.id,
          dados_vistoria: {
            ...dadosVistoria,
            documentMode, // Salvar o modo do documento
            prestador: documentMode === 'orcamento' ? dadosPrestador : undefined, // Salvar dados do prestador
          },
          apontamentos: apontamentos,
        });

        if (analiseId) {
          toast({
            title: 'Análise salva',
            description: 'A análise foi salva no banco de dados com sucesso.',
          });
        }
      }

      if (analiseId) {
        setSavedAnaliseId(analiseId);
      }
    } catch {
      // console.error('Erro ao salvar análise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a análise.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const generateDocument = async () => {
    if (apontamentos.length === 0) {
      toast({
        title: 'Nenhum apontamento',
        description:
          'Adicione pelo menos um apontamento antes de gerar o documento.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedContract) {
      toast({
        title: 'Contrato não selecionado',
        description: 'Selecione um contrato antes de gerar o documento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validar se todos os apontamentos têm dados válidos
      const apontamentosValidos = apontamentos.filter((apontamento) => {
        return apontamento.ambiente && apontamento.descricao;
      });

      if (apontamentosValidos.length === 0) {
        toast({
          title: 'Apontamentos inválidos',
          description:
            'Todos os apontamentos devem ter ambiente e descrição preenchidos.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se há fotos válidas nos apontamentos
      const apontamentosComFotos = apontamentosValidos.map((apontamento) => {
        // Verificar se as fotos são válidas (File ou do banco de dados)
        const fotosInicialValidas =
          apontamento.vistoriaInicial?.fotos?.filter((foto) => {
            // Se é do banco de dados, verificar se tem URL
            if (foto?.isFromDatabase) {
              return foto.url && foto.url.length > 0;
            }
            // Se é File, verificar se é válido
            return foto instanceof File && foto.size > 0;
          }) || [];

        const fotosFinalValidas =
          apontamento.vistoriaFinal?.fotos?.filter((foto) => {
            // Se é do banco de dados, verificar se tem URL
            if (foto?.isFromDatabase) {
              return foto.url && foto.url.length > 0;
            }
            // Se é File, verificar se é válido
            return foto instanceof File && foto.size > 0;
          }) || [];

        return {
          ...apontamento,
          vistoriaInicial: {
            ...apontamento.vistoriaInicial,
            fotos: fotosInicialValidas,
          },
          vistoriaFinal: {
            ...apontamento.vistoriaFinal,
            fotos: fotosFinalValidas,
          },
        };
      });

      // Gerando documento com apontamentos

      // Gerar template do documento
      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: dadosVistoria.locatario,
        endereco: dadosVistoria.endereco,
        dataVistoria: dadosVistoria.dataVistoria,
        documentMode,
        prestador: documentMode === 'orcamento' ? dadosPrestador : undefined,
        apontamentos: apontamentosComFotos,
      });

      // Navegar para a página de geração de documento
      navigate('/gerar-documento', {
        state: {
          title: `${documentMode === 'orcamento' ? 'Orçamento de Reparos' : 'Análise Comparativa de Vistoria'} - ${dadosVistoria.locatario}`,
          template: template,
          formData: selectedContract.form_data,
          documentType: documentMode === 'orcamento' ? 'Orçamento de Reparos' : 'Análise de Vistoria',
          // Preservar estado da análise para retorno
          preserveAnalysisState: {
            apontamentos,
            dadosVistoria,
            selectedContract,
            savedAnaliseId,
            isEditMode,
            editingAnaliseId,
            existingAnaliseId,
            hasExistingAnalise,
          },
        },
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar documento',
        description: `Ocorreu um erro ao gerar o documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    }
  };

  const clearAllData = () => {
    setApontamentos([]);
    setSelectedContract(null);
    setDadosVistoria({
      locatario: '',
      endereco: '',
      dataVistoria: '',
    });
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
    });
    setEditingApontamento(null);
    setShowDadosVistoria(true);
    setSavedAnaliseId(null);
    localStorage.removeItem('analise-vistoria-state');
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram limpos e o estado foi resetado.',
    });
  };

  const handleEditApontamento = (apontamento: ApontamentoVistoria) => {
    setEditingApontamento(apontamento.id);
    setCurrentApontamento({
      ambiente: apontamento.ambiente,
      subtitulo: apontamento.subtitulo,
      descricao: apontamento.descricao,
      vistoriaInicial: {
        fotos: apontamento.vistoriaInicial.fotos,
        descritivoLaudo: apontamento.vistoriaInicial.descritivoLaudo || '',
      },
      vistoriaFinal: { fotos: apontamento.vistoriaFinal.fotos },
      observacao: apontamento.observacao,
      // Carregar valores de orçamento se existirem
      tipo: apontamento.tipo || 'material',
      valor: apontamento.valor || 0,
      quantidade: apontamento.quantidade || 0,
    });
    toast({
      title: 'Editando apontamento',
      description: 'Modifique os dados e clique em "Salvar Alterações".',
    });
  };

  const handleSaveEdit = () => {
    if (!editingApontamento) return;

    const updatedApontamentos = apontamentos.map((apontamento) =>
      apontamento.id === editingApontamento
        ? {
            ...apontamento,
            ambiente: currentApontamento.ambiente || '',
            subtitulo: currentApontamento.subtitulo || '',
            descricao: currentApontamento.descricao || '',
            vistoriaInicial: {
              fotos: currentApontamento.vistoriaInicial?.fotos || [],
              descritivoLaudo:
                currentApontamento.vistoriaInicial?.descritivoLaudo || '',
            },
            vistoriaFinal: {
              fotos: currentApontamento.vistoriaFinal?.fotos || [],
            },
            observacao: currentApontamento.observacao || '',
            // Preservar valores de orçamento se estiver no modo orçamento
            ...(documentMode === 'orcamento' && {
              tipo: currentApontamento.tipo || 'material',
              valor: currentApontamento.valor || 0,
              quantidade: currentApontamento.quantidade || 0,
            }),
          }
        : apontamento
    );

    setApontamentos(updatedApontamentos);
    setEditingApontamento(null);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });

    toast({
      title: 'Apontamento atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  const handleCancelEdit = () => {
    setEditingApontamento(null);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
      tipo: 'material',
      valor: 0,
      quantidade: 0,
    });
  };

  const handleCorrectText = async () => {
    const currentText = currentApontamento.observacao || '';
    if (!currentText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Não há texto para corrigir na análise técnica.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const correctedText = await correctText(currentText);
      setCurrentApontamento((prev) => ({
        ...prev,
        observacao: correctedText,
      }));
      toast({
        title: 'Texto corrigido',
        description: 'A análise técnica foi corrigida ortograficamente.',
      });
    } catch {
      toast({
        title: 'Erro na correção',
        description: 'Não foi possível corrigir o texto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
      </div>
      
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {isEditMode
                  ? 'Editar Análise de Vistoria'
                  : 'Análise de Vistoria'}
              </h1>
              <p className="text-blue-200 mt-2 flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Sistema de análise comparativa de vistoria de saída</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-lg">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-sm">
                {apontamentos.length} apontamento
                {apontamentos.length !== 1 ? 's' : ''}
              </Badge>
              {savedAnaliseId && (
                <Badge
                  variant="default"
                  className="text-sm bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Salva
                </Badge>
              )}
            </div>
            {apontamentos.length > 0 && (
              <Button
                onClick={clearAllData}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
            <Button
              onClick={saveAnalysis}
              disabled={
                apontamentos.length === 0 || !selectedContract || saving
              }
              variant="outline"
              className="mr-2"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving
                ? 'Salvando...'
                : isEditMode
                  ? 'Atualizar Análise'
                  : hasExistingAnalise
                    ? 'Atualizar Análise Existente'
                    : 'Salvar Análise'}
            </Button>
            <Button
              onClick={generateDocument}
              disabled={apontamentos.length === 0 || !selectedContract}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar Documento
            </Button>
          </div>
        </div>

        {/* Botão para exibir dados da vistoria quando oculto */}
        {!showDadosVistoria && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => setShowDadosVistoria(true)}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground border-dashed"
            >
              <Settings className="h-3 w-3 mr-1" />
              Exibir Dados da Vistoria
            </Button>
          </div>
        )}

        {/* Dados da Vistoria */}
        {showDadosVistoria && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Dados da Vistoria</span>
                </CardTitle>
                <Button
                  onClick={() => setShowDadosVistoria(false)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                  title="Ocultar dados da vistoria"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Busca de Contrato */}
                <div className="space-y-3">
                  <Label
                    htmlFor="buscar-contrato"
                    className="text-sm font-medium flex items-center space-x-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>Buscar Contrato</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="buscar-contrato"
                      placeholder="Digite número do contrato, nome do locatário ou endereço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Seleção de Contrato */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="contrato"
                      className="text-sm font-medium flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Selecionar Contrato *</span>
                    </Label>
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        {filteredContracts.length} de {contracts.length}{' '}
                        contratos
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={selectedContract?.id || ''}
                    onValueChange={(value) => {
                      const contract = contracts.find((c) => c.id === value);
                      setSelectedContract(contract || null);
                      // Limpar busca após seleção
                      setSearchTerm('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredContracts.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>
                            {searchTerm
                              ? 'Nenhum contrato encontrado'
                              : 'Nenhum contrato disponível'}
                          </p>
                        </div>
                      ) : (
                        filteredContracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {contract.form_data.numeroContrato ||
                                  'Sem número'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {contract.form_data.nomeLocatario || 'Sem nome'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Informações do Contrato Selecionado */}
                {selectedContract && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-400/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-400" />
                        <h3 className="font-semibold text-primary">
                          Contrato Selecionado
                        </h3>
                      </div>
                      {loadingExistingAnalise && (
                        <Badge
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <div className="h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Carregando...
                        </Badge>
                      )}
                      {hasExistingAnalise && !loadingExistingAnalise && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="default"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Análise Existente
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={forceReloadImages}
                            disabled={loadingExistingAnalise}
                            className="text-xs"
                          >
                            {loadingExistingAnalise ? (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1" />
                                Carregando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recarregar Imagens
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">
                            Locatário
                          </Label>
                        </div>
                        <p className="text-sm bg-background/50 p-2 rounded border">
                          {dadosVistoria.locatario}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">
                            Endereço
                          </Label>
                        </div>
                        <p className="text-sm bg-background/50 p-2 rounded border">
                          {dadosVistoria.endereco}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">
                            Data da Vistoria
                          </Label>
                        </div>
                        <p className="text-sm bg-background/50 p-2 rounded border">
                          {dadosVistoria.dataVistoria}
                        </p>
                      </div>
                    </div>

                    {/* Aviso sobre análise existente */}
                    {hasExistingAnalise && (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>Atenção:</strong> Já existe uma análise de
                            vistoria para este contrato. Ao salvar, a análise
                            existente será atualizada em vez de criar uma nova.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados do Prestador - Apenas no modo orçamento */}
        {documentMode === 'orcamento' && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  <span>Dados do Prestador</span>
                </CardTitle>
                <Button
                  onClick={() => setShowDadosPrestador(!showDadosPrestador)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                  title={showDadosPrestador ? "Ocultar dados do prestador" : "Exibir dados do prestador"}
                >
                  {showDadosPrestador ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showDadosPrestador && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prestador-nome" className="text-sm font-medium">
                      Nome/Razão Social *
                    </Label>
                    <Input
                      id="prestador-nome"
                      placeholder="Nome do prestador"
                      value={dadosPrestador.nome}
                      onChange={(e) => setDadosPrestador(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prestador-cnpj" className="text-sm font-medium">
                      CNPJ/CPF
                    </Label>
                    <Input
                      id="prestador-cnpj"
                      placeholder="00.000.000/0000-00"
                      value={dadosPrestador.cnpj}
                      onChange={(e) => setDadosPrestador(prev => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prestador-telefone" className="text-sm font-medium">
                      Telefone
                    </Label>
                    <Input
                      id="prestador-telefone"
                      placeholder="(00) 00000-0000"
                      value={dadosPrestador.telefone}
                      onChange={(e) => setDadosPrestador(prev => ({ ...prev, telefone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prestador-email" className="text-sm font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="prestador-email"
                      type="email"
                      placeholder="contato@prestador.com"
                      value={dadosPrestador.email}
                      onChange={(e) => setDadosPrestador(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Formulário de Novo Apontamento */}
          <Card className="xl:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-primary" />
                  <span>Novo Apontamento</span>
                </div>
                <Select value={documentMode} onValueChange={(value: 'analise' | 'orcamento') => setDocumentMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analise">Análise</SelectItem>
                    <SelectItem value="orcamento">Orçamento</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Ambiente e Subtítulo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="ambiente"
                    className="text-sm font-medium flex items-center space-x-2"
                  >
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>Ambiente *</span>
                  </Label>
                  <Input
                    id="ambiente"
                    placeholder="Ex: SALA"
                    value={currentApontamento.ambiente || ''}
                    onChange={(e) =>
                      setCurrentApontamento((prev) => ({
                        ...prev,
                        ambiente: e.target.value,
                      }))
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="subtitulo"
                    className="text-sm font-medium flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Subtítulo</span>
                  </Label>
                  <Input
                    id="subtitulo"
                    placeholder="Ex: Armário"
                    value={currentApontamento.subtitulo || ''}
                    onChange={(e) =>
                      setCurrentApontamento((prev) => ({
                        ...prev,
                        subtitulo: e.target.value,
                      }))
                    }
                    className="h-9"
                  />
                </div>
              </div>

              {/* Descrição do Apontamento */}
              <div className="space-y-2">
                <Label
                  htmlFor="descricao"
                  className="text-sm font-medium flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Descrição *</span>
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Está com lascado nas portas"
                  value={currentApontamento.descricao || ''}
                  onChange={(e) =>
                    setCurrentApontamento((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Campos de Orçamento - Apenas no modo orçamento */}
              {documentMode === 'orcamento' && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Tipo</Label>
                      <Select
                        value={currentApontamento.tipo || 'material'}
                        onValueChange={(value: BudgetItemType) =>
                          setCurrentApontamento(prev => ({ ...prev, tipo: value }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4" />
                              <span>Material</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mao_de_obra">
                            <div className="flex items-center space-x-2">
                              <Wrench className="h-4 w-4" />
                              <span>Mão de Obra</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ambos">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4" />
                              <Wrench className="h-4 w-4 ml-1" />
                              <span className="ml-1">Ambos</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Valor Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentApontamento.valor || ''}
                        onChange={(e) =>
                          setCurrentApontamento(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))
                        }
                        className="h-8 text-sm"
                        placeholder="0,00"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Quantidade</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentApontamento.quantidade || ''}
                        onChange={(e) =>
                          setCurrentApontamento(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))
                        }
                        className="h-8 text-sm"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Subtotal</Label>
                      <div className="flex items-center space-x-1 h-8 px-2 bg-muted/50 rounded border text-sm font-medium">
                        <span>
                          {((currentApontamento.valor || 0) * (currentApontamento.quantidade || 0))
                            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Vistoria Inicial */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center space-x-2 text-foreground bg-card p-2 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Vistoria Inicial</span>
                </h3>
                <div
                  className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                  onPaste={(e) => handlePaste(e.nativeEvent, 'inicial')}
                  tabIndex={0}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Cole imagens com Ctrl+V
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estado inicial do ambiente
                      </p>
                    </div>
                  </div>
                  {currentApontamento.vistoriaInicial?.fotos &&
                    currentApontamento.vistoriaInicial.fotos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {currentApontamento.vistoriaInicial.fotos.map(
                          (foto, index) => (
                            <div key={index} className="relative group">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 pr-6"
                              >
                                <FileImage className="h-3 w-3 mr-1" />
                                {foto.name}
                                {foto.isFromDatabase && (
                                  <span className="ml-1 text-xs opacity-70">
                                    (DB)
                                  </span>
                                )}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFotoInicial(index)}
                                className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover foto"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>

                {/* Descritivo do Laudo de Entrada */}
                <div className="space-y-2">
                  <Label
                    htmlFor="descritivoLaudo"
                    className="text-sm font-medium flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Descritivo do Laudo de Entrada (Opcional)</span>
                  </Label>
                  <Textarea
                    id="descritivoLaudo"
                    placeholder="Ex: Laudo técnico indicando estado inicial do ambiente..."
                    value={
                      currentApontamento.vistoriaInicial?.descritivoLaudo || ''
                    }
                    onChange={(e) =>
                      setCurrentApontamento((prev) => ({
                        ...prev,
                        vistoriaInicial: {
                          ...prev.vistoriaInicial,
                          fotos: prev.vistoriaInicial?.fotos || [],
                          descritivoLaudo: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>

              <Separator />

              {/* Vistoria Final */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center space-x-2 text-foreground bg-card p-2 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>Vistoria Final</span>
                </h3>
                <div
                  className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                  onPaste={(e) => handlePaste(e.nativeEvent, 'final')}
                  tabIndex={0}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                      <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Cole imagens com Ctrl+V
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estado atual do ambiente
                      </p>
                    </div>
                  </div>
                  {currentApontamento.vistoriaFinal?.fotos &&
                    currentApontamento.vistoriaFinal.fotos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {currentApontamento.vistoriaFinal.fotos.map(
                          (foto, index) => (
                            <div key={index} className="relative group">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 pr-6"
                              >
                                <FileImage className="h-3 w-3 mr-1" />
                                {foto.name}
                                {foto.isFromDatabase && (
                                  <span className="ml-1 text-xs opacity-70">
                                    (DB)
                                  </span>
                                )}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFotoFinal(index)}
                                className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover foto"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>

              <Separator />

              {/* Observação */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="observacao"
                    className="text-sm font-medium flex items-center space-x-2"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Análise Técnica</span>
                  </Label>
                  <Button
                    onClick={handleCorrectText}
                    disabled={
                      isAILoading || !currentApontamento.observacao?.trim()
                    }
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
                    title="Corrigir ortografia com IA"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {isAILoading ? 'Corrigindo...' : 'IA'}
                  </Button>
                </div>
                <Textarea
                  id="observacao"
                  placeholder="Sua análise sobre a contestação do locatário..."
                  value={currentApontamento.observacao || ''}
                  onChange={(e) =>
                    setCurrentApontamento((prev) => ({
                      ...prev,
                      observacao: e.target.value,
                    }))
                  }
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={
                    editingApontamento ? handleSaveEdit : handleAddApontamento
                  }
                  className="flex-1 h-9 text-sm"
                  disabled={
                    !currentApontamento.ambiente ||
                    !currentApontamento.descricao
                  }
                >
                  {editingApontamento ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Apontamento
                    </>
                  )}
                </Button>
                {editingApontamento && (
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="h-9 text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visualização do Documento em Tempo Real */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                <span>Pré-visualização do Documento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apontamentos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">
                    Nenhum apontamento
                  </h3>
                  <p className="text-sm">
                    Adicione apontamentos para ver a pré-visualização do
                    documento
                  </p>
                </div>
              ) : documentPreview ? (
                <div className="space-y-4">
                  {/* Controles da Pré-visualização */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Documento Atualizado
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {apontamentos.length} apontamento
                        {apontamentos.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Pré-visualização do Documento Real */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 border-b border-border">
                      <h4 className="text-sm font-medium text-foreground">
                        Pré-visualização do Documento Final
                      </h4>
                    </div>
                    <div
                      className="max-h-96 overflow-y-auto bg-white"
                      dangerouslySetInnerHTML={{ __html: documentPreview }}
                    />
                  </div>

                  {/* Lista de Apontamentos */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                      <Eye className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium text-foreground">
                        Gerenciar Apontamentos ({apontamentos.length})
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {apontamentos.map((apontamento, index) => (
                        <div
                          key={apontamento.id}
                          className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {apontamento.ambiente}
                                  {apontamento.subtitulo && (
                                    <span className="text-muted-foreground ml-2">
                                      - {apontamento.subtitulo}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {apontamento.descricao}
                                </p>
                                {/* Exibir valores de orçamento se existirem */}
                                {documentMode === 'orcamento' && apontamento.valor !== undefined && apontamento.quantidade !== undefined && (
                                  <div className="mt-2 flex items-center gap-2 text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      {apontamento.tipo === 'material' ? 'Material' : 
                                       apontamento.tipo === 'mao_de_obra' ? 'Mão de Obra' : 
                                       'Material + M.O.'}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {apontamento.quantidade}x R$ {(apontamento.valor || 0).toFixed(2)}
                                    </span>
                                    <span className="font-semibold text-green-600">
                                      = {((apontamento.valor || 0) * (apontamento.quantidade || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditApontamento(apontamento)
                                }
                                className="text-muted-foreground hover:text-primary h-6 w-6 p-0"
                                title="Editar apontamento"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveApontamento(apontamento.id)
                                }
                                className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                                title="Remover apontamento"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 opacity-50" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">
                    Processando documento...
                  </h3>
                  <p className="text-sm">
                    Aguarde enquanto o documento é gerado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnaliseVistoria;
