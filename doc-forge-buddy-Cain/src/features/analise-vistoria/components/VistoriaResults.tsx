import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit3,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
} from '@/utils/iconMapper';
import { ApontamentoVistoria } from '../types/vistoria';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { useToast } from '@/components/ui/use-toast';

interface VistoriaResultsProps {
  apontamentos: ApontamentoVistoria[];
  documentMode: 'analise' | 'orcamento';
  selectedContract: {
    form_data: Record<string, string>;
  } | null;
  dadosVistoria: {
    locatario: string;
    endereco: string;
    dataVistoria: string;
  };
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export const VistoriaResults: React.FC<VistoriaResultsProps> = ({
  apontamentos,
  documentMode,
  selectedContract,
  dadosVistoria,
  onEdit,
  onRemove,
}) => {
  const { toast } = useToast();
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Função para atualizar pré-visualização do documento
  const updateDocumentPreview = useCallback(async () => {
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

      // Verificar se há fotos válidas nos apontamentos
      const apontamentosComFotos = apontamentosValidos.map((apontamento) => {
        // Verificar se as fotos são objetos File válidos ou imagens do banco
        const fotosInicialValidas =
          apontamento.vistoriaInicial?.fotos?.filter((foto) => {
            // Se é do banco de dados, verificar se tem URL
            if (foto?.isFromDatabase) {
              const hasValidUrl = foto.url && foto.url.length > 0;
              return hasValidUrl;
            }
            // Se é File, verificar se é válido
            const isValidFile = foto instanceof File && foto.size > 0;
            return isValidFile;
          }) || [];

        const fotosFinalValidas =
          apontamento.vistoriaFinal?.fotos?.filter((foto) => {
            // Se é do banco de dados, verificar se tem URL
            if (foto?.isFromDatabase) {
              const hasValidUrl = foto.url && foto.url.length > 0;
              return hasValidUrl;
            }
            // Se é File, verificar se é válido
            const isValidFile = foto instanceof File && foto.size > 0;
            return isValidFile;
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

      // Gerar template do documento
      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: selectedContract?.form_data.numeroContrato || dadosVistoria.locatario || '',
        endereco: selectedContract?.form_data.enderecoImovel || dadosVistoria.endereco || '',
        dataVistoria: dadosVistoria.dataVistoria,
        documentMode,
        apontamentos: apontamentosComFotos,
      });

      setDocumentPreview(template);
    } catch (error) {
      console.error('Erro ao atualizar pré-visualização:', error);
      setDocumentPreview('');
    }
  }, [apontamentos, dadosVistoria, documentMode, selectedContract]);

  // Atualizar pré-visualização do documento em tempo real
  React.useEffect(() => {
    updateDocumentPreview();
  }, [updateDocumentPreview]);

  const getClassificacaoBadge = (classificacao?: 'responsabilidade' | 'revisao') => {
    switch (classificacao) {
      case 'responsabilidade':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Responsabilidade do Locatário
          </Badge>
        );
      case 'revisao':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Passível de Revisão
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTipoOrcamentoBadge = (tipo?: string) => {
    switch (tipo) {
      case 'material':
        return <Badge variant="secondary">Material</Badge>;
      case 'mao_de_obra':
        return <Badge variant="secondary">Mão de Obra</Badge>;
      case 'ambos':
        return <Badge variant="secondary">Ambos</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="xl:col-span-2 space-y-6">
      {/* Resumo dos Apontamentos */}
      {apontamentos.length > 0 && (
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Resumo dos Apontamentos
              </h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {apontamentos.length} {apontamentos.length === 1 ? 'apontamento' : 'apontamentos'}
                </Badge>
                {documentMode === 'analise' && (
                  <Badge variant="outline">
                    {apontamentos.filter(a => a.classificacao).length} classificados
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apontamentos.map((apontamento) => (
                <div
                  key={apontamento.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-neutral-900">
                        {apontamento.ambiente}
                      </h3>
                      {apontamento.subtitulo && (
                        <span className="text-sm text-neutral-600">
                          - {apontamento.subtitulo}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {apontamento.descricao}
                    </p>
                    {documentMode === 'orcamento' && apontamento.valor && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(apontamento.valor * (apontamento.quantidade || 0))}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-3">
                    {getClassificacaoBadge(apontamento.classificacao)}
                    {getTipoOrcamentoBadge(apontamento.tipo)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista Detalhada de Apontamentos */}
      {apontamentos.length > 0 && (
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Apontamentos Detalhados
            </h2>
            <div className="space-y-4">
              {apontamentos.map((apontamento, index) => (
                <div
                  key={apontamento.id}
                  className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">
                          {index + 1}. {apontamento.ambiente}
                        </h3>
                        {apontamento.subtitulo && (
                          <span className="text-sm text-neutral-600">
                            - {apontamento.subtitulo}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-700 mb-2">
                        <strong>Descrição:</strong> {apontamento.descricao}
                      </p>
                      {apontamento.descricaoServico && (
                        <p className="text-sm text-neutral-700 mb-2">
                          <strong>Serviço:</strong> {apontamento.descricaoServico}
                        </p>
                      )}
                      {apontamento.observacao && (
                        <p className="text-sm text-neutral-700 mb-2">
                          <strong>Análise:</strong> {apontamento.observacao}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {getClassificacaoBadge(apontamento.classificacao)}
                      {getTipoOrcamentoBadge(apontamento.tipo)}
                      {documentMode === 'orcamento' && apontamento.valor && (
                        <Badge variant="outline">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(apontamento.valor * (apontamento.quantidade || 0))}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Fotos */}
                  {(apontamento.vistoriaInicial?.fotos?.length > 0 ||
                    apontamento.vistoriaFinal?.fotos?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {apontamento.vistoriaInicial?.fotos?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-900 mb-2">
                            Vistoria Inicial ({apontamento.vistoriaInicial.fotos.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {apontamento.vistoriaInicial.fotos.map((foto, fotoIndex) => (
                              <Badge key={fotoIndex} variant="outline" className="text-xs">
                                {foto.name}
                              </Badge>
                            ))}
                          </div>
                          {apontamento.vistoriaInicial.descritivoLaudo && (
                            <p className="text-xs text-neutral-600 mt-1">
                              {apontamento.vistoriaInicial.descritivoLaudo}
                            </p>
                          )}
                        </div>
                      )}
                      {apontamento.vistoriaFinal?.fotos?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-900 mb-2">
                            Vistoria Final ({apontamento.vistoriaFinal.fotos.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {apontamento.vistoriaFinal.fotos.map((foto, fotoIndex) => (
                              <Badge key={fotoIndex} variant="outline" className="text-xs">
                                {foto.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(apontamento.id)}
                      className="text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(apontamento.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pré-visualização do Documento */}
      {documentPreview && (
        <Card className="bg-white border-neutral-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Pré-visualização do Documento
              </h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {documentMode === 'analise' ? 'Análise de Vistoria' : 'Orçamento'}
                </Badge>
                <span className="text-xs text-neutral-500">
                  {formatDateBrazilian(new Date().toISOString().split('T')[0])}
                </span>
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: documentPreview }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há apontamentos */}
      {apontamentos.length === 0 && (
        <Card className="bg-neutral-50 border-neutral-200">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              Nenhum apontamento adicionado
            </h3>
            <p className="text-neutral-600">
              Adicione apontamentos para ver a lista detalhada e a pré-visualização do documento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};