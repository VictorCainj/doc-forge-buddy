import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Download,
  Eye,
  Search,
  FileText,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBrazilian } from '@/utils/dateFormatter';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { useNavigate } from 'react-router-dom';

interface Apontamento {
  id: string;
  ambiente: string;
  subtitulo: string;
  descricao: string;
  vistoriaInicial: {
    fotos: File[];
    descritivoLaudo?: string;
  };
  vistoriaFinal: {
    fotos: File[];
  };
  observacao: string;
}

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

const AnaliseVistoria = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [currentApontamento, setCurrentApontamento] = useState<
    Partial<Apontamento>
  >({
    ambiente: '',
    subtitulo: '',
    descricao: '',
    vistoriaInicial: { fotos: [], descritivoLaudo: '' },
    vistoriaFinal: { fotos: [] },
    observacao: '',
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [dadosVistoria, setDadosVistoria] = useState({
    locatario: '',
    endereco: '',
    dataVistoria: '',
  });
  const [loading, setLoading] = useState(true);
  const [editingApontamento, setEditingApontamento] = useState<string | null>(
    null
  );

  // Carregar contratos do Supabase
  useEffect(() => {
    fetchContracts();
  }, []);

  // Carregar estado salvo do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('analise-vistoria-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.apontamentos) {
          setApontamentos(parsedState.apontamentos);
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
      } catch (error) {
        console.error('Erro ao carregar estado salvo:', error);
      }
    }
  }, [contracts]);

  // Salvar estado no localStorage sempre que houver mudanças
  useEffect(() => {
    // Criar uma versão serializável dos apontamentos (sem objetos File)
    const apontamentosSerializaveis = apontamentos.map((apontamento) => ({
      ...apontamento,
      vistoriaInicial: {
        ...apontamento.vistoriaInicial,
        fotos:
          apontamento.vistoriaInicial?.fotos?.map((foto) => ({
            name: foto.name,
            size: foto.size,
            type: foto.type,
            lastModified: foto.lastModified,
          })) || [],
      },
      vistoriaFinal: {
        ...apontamento.vistoriaFinal,
        fotos:
          apontamento.vistoriaFinal?.fotos?.map((foto) => ({
            name: foto.name,
            size: foto.size,
            type: foto.type,
            lastModified: foto.lastModified,
          })) || [],
      },
    }));

    const stateToSave = {
      apontamentos: apontamentosSerializaveis,
      selectedContractId: selectedContract?.id,
      dadosVistoria,
    };
    localStorage.setItem('analise-vistoria-state', JSON.stringify(stateToSave));
  }, [apontamentos, selectedContract, dadosVistoria]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar contratos',
        description: 'Não foi possível carregar a lista de contratos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  }, [selectedContract]);

  const handleAddApontamento = () => {
    if (!currentApontamento.ambiente || !currentApontamento.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o ambiente e a descrição do apontamento.',
        variant: 'destructive',
      });
      return;
    }

    const newApontamento: Apontamento = {
      id: Date.now().toString(),
      ambiente: currentApontamento.ambiente || '',
      subtitulo: currentApontamento.subtitulo || '',
      descricao: currentApontamento.descricao || '',
      vistoriaInicial: {
        fotos: currentApontamento.vistoriaInicial?.fotos || [],
      },
      vistoriaFinal: { fotos: currentApontamento.vistoriaFinal?.fotos || [] },
      observacao: currentApontamento.observacao || '',
    };

    setApontamentos([...apontamentos, newApontamento]);
    setCurrentApontamento({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      vistoriaInicial: { fotos: [], descritivoLaudo: '' },
      vistoriaFinal: { fotos: [] },
      observacao: '',
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

  const handleFileUpload = (
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
        // Verificar se as fotos são objetos File válidos
        const fotosInicialValidas =
          apontamento.vistoriaInicial?.fotos?.filter(
            (foto) => foto instanceof File && foto.size > 0
          ) || [];

        const fotosFinalValidas =
          apontamento.vistoriaFinal?.fotos?.filter(
            (foto) => foto instanceof File && foto.size > 0
          ) || [];

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

      console.log('Gerando documento com apontamentos:', apontamentosComFotos);

      // Gerar template do documento
      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: dadosVistoria.locatario,
        endereco: dadosVistoria.endereco,
        dataVistoria: dadosVistoria.dataVistoria,
        apontamentos: apontamentosComFotos,
      });

      // Navegar para a página de geração de documento
      navigate('/gerar-documento', {
        state: {
          title: `Análise Comparativa de Vistoria - ${dadosVistoria.locatario}`,
          template: template,
          formData: selectedContract.form_data,
          documentType: 'Análise de Vistoria',
        },
      });
    } catch (error) {
      console.error('Erro detalhado ao gerar documento:', error);
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
    localStorage.removeItem('analise-vistoria-state');
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram limpos e o estado foi resetado.',
    });
  };

  const handleEditApontamento = (apontamento: Apontamento) => {
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
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Análise de Vistoria
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistema de análise comparativa de vistoria de saída
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {apontamentos.length} apontamento
              {apontamentos.length !== 1 ? 's' : ''}
            </Badge>
            {apontamentos.length > 0 && (
              <Button
                onClick={clearAllData}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            )}
            <Button
              onClick={generateDocument}
              disabled={apontamentos.length === 0 || !selectedContract}
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar Documento
            </Button>
          </div>
        </div>

        {/* Dados da Vistoria */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados da Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contrato">Selecionar Contrato *</Label>
                <Select
                  value={selectedContract?.id || ''}
                  onValueChange={(value) => {
                    const contract = contracts.find((c) => c.id === value);
                    setSelectedContract(contract || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {contract.form_data.numeroContrato || 'Sem número'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {contract.form_data.nomeLocatario || 'Sem nome'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContract && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Locatário</Label>
                    <p className="text-sm">{dadosVistoria.locatario}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Endereço</Label>
                    <p className="text-sm">{dadosVistoria.endereco}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      Data da Vistoria
                    </Label>
                    <p className="text-sm">{dadosVistoria.dataVistoria}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Formulário de Novo Apontamento */}
          <Card className="xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Plus className="h-4 w-4" />
                <span>Novo Apontamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ambiente e Subtítulo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ambiente" className="text-sm">
                    Ambiente *
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
                <div className="space-y-1">
                  <Label htmlFor="subtitulo" className="text-sm">
                    Subtítulo
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
              <div className="space-y-1">
                <Label htmlFor="descricao" className="text-sm">
                  Descrição *
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

              <Separator />

              {/* Vistoria Inicial */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center space-x-2 text-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Vistoria Inicial</span>
                </h3>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  onPaste={(e) => handlePaste(e.nativeEvent, 'inicial')}
                  tabIndex={0}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Upload className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Cole imagens com Ctrl+V
                      </p>
                    </div>
                  </div>
                  {currentApontamento.vistoriaInicial?.fotos &&
                    currentApontamento.vistoriaInicial.fotos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {currentApontamento.vistoriaInicial.fotos.map(
                          (foto, index) => (
                            <div key={index} className="relative group">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-primary text-primary-foreground border-primary pr-6"
                              >
                                <FileImage className="h-3 w-3 mr-1" />
                                {foto.name}
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
                <div className="space-y-1">
                  <Label htmlFor="descritivoLaudo" className="text-sm">
                    Descritivo do Laudo de Entrada (Opcional)
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
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center space-x-2 text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Vistoria Final</span>
                </h3>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  onPaste={(e) => handlePaste(e.nativeEvent, 'final')}
                  tabIndex={0}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Upload className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Cole imagens com Ctrl+V
                      </p>
                    </div>
                  </div>
                  {currentApontamento.vistoriaFinal?.fotos &&
                    currentApontamento.vistoriaFinal.fotos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {currentApontamento.vistoriaFinal.fotos.map(
                          (foto, index) => (
                            <div key={index} className="relative group">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-primary text-primary-foreground border-primary pr-6"
                              >
                                <FileImage className="h-3 w-3 mr-1" />
                                {foto.name}
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
              <div className="space-y-1">
                <Label
                  htmlFor="observacao"
                  className="text-sm font-medium text-gray-700"
                >
                  Análise Técnica
                </Label>
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
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Esta análise será destacada no documento final
                </p>
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
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
                {editingApontamento && (
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="h-9 text-sm"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Apontamentos */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Eye className="h-4 w-4" />
                <span>Apontamentos ({apontamentos.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apontamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum apontamento adicionado ainda</p>
                  <p className="text-sm">
                    Adicione o primeiro apontamento usando o formulário ao lado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apontamentos.map((apontamento, index) => (
                    <div
                      key={apontamento.id}
                      className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      {/* Header do Apontamento */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">
                              {apontamento.ambiente}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {apontamento.descricao}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditApontamento(apontamento)}
                            className="text-muted-foreground hover:text-blue-600 h-6 w-6 p-0"
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnaliseVistoria;
