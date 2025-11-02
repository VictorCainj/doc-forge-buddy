// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from '@/utils/iconMapper';
import { DocumentPreviewContent } from './DocumentPreviewContent';
import { ApontamentoVistoria } from '@/types/vistoria';

interface DocumentPreviewCardProps {
  apontamentos: ApontamentoVistoria[];
  documentPreview: string;
  documentMode: 'analise' | 'orcamento';
  onEdit?: (apontamento: ApontamentoVistoria) => void;
  onRemove?: (id: string) => void;
}

export const DocumentPreviewCard = ({
  apontamentos,
  documentPreview,
  documentMode,
  onEdit,
  onRemove,
}: DocumentPreviewCardProps) => {
  return (
    <Card className="xl:col-span-2 bg-white border-neutral-100 shadow-sm">
      <CardHeader className="pb-4 border-b border-neutral-100">
        <CardTitle className="flex items-center space-x-3 text-xl font-medium text-neutral-900">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <span>Pré-visualização do Documento</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {apontamentos.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <div className="w-20 h-20 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2 text-lg">
              Nenhum apontamento
            </h3>
            <p className="text-sm text-neutral-600">
              Adicione apontamentos para ver a pré-visualização do documento
            </p>
          </div>
        ) : documentPreview ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Controles da Pré-visualização */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-900">
                  Documento Atualizado
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="text-xs border-green-200 bg-white text-green-900"
                >
                  {apontamentos.length} apontamento
                  {apontamentos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {/* Pré-visualização do Documento Real */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-neutral-50 p-4 border-b border-neutral-200">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Pré-visualização do Documento Final
                </h4>
              </div>
              <DocumentPreviewContent html={documentPreview} />
            </div>

            {/* CSS para zoom nas imagens da pré-visualização */}
            <style>{`
              .document-preview-container img {
                cursor: zoom-in;
                transition: opacity 0.2s ease;
              }
              .document-preview-container img:hover {
                opacity: 0.8;
              }
            `}</style>

            {/* Lista de Apontamentos */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-neutral-700" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-900">
                  Gerenciar Apontamentos ({apontamentos.length})
                </h4>
              </div>

              <div className="space-y-3">
                {apontamentos.map((apontamento, index) => (
                  <div
                    key={apontamento.id}
                    className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-neutral-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-700">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-neutral-900 mb-1">
                            {apontamento.ambiente}
                            {apontamento.subtitulo && (
                              <span className="text-neutral-600 ml-2 font-normal">
                                - {apontamento.subtitulo}
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {apontamento.descricao}
                          </p>
                          {/* Exibir valores de orçamento se existirem */}
                          {documentMode === 'orcamento' &&
                            apontamento.valor !== undefined &&
                            apontamento.quantidade !== undefined && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-blue-200 bg-blue-50 text-blue-700"
                                >
                                  {apontamento.tipo === 'material'
                                    ? 'Material'
                                    : apontamento.tipo === 'mao_de_obra'
                                      ? 'Mão de Obra'
                                      : 'Material + M.O.'}
                                </Badge>
                                <span className="text-neutral-600">
                                  {apontamento.quantidade}x R${' '}
                                  {(apontamento.valor || 0).toFixed(2)}
                                </span>
                                <span className="font-semibold text-green-700">
                                  ={' '}
                                  {(
                                    (apontamento.valor || 0) *
                                    (apontamento.quantidade || 0)
                                  ).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(apontamento)}
                            className="text-neutral-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                            title="Editar apontamento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(apontamento.id)}
                            className="text-neutral-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            title="Remover apontamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertCircle className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2 text-lg">
              Processando documento...
            </h3>
            <p className="text-sm text-neutral-600">
              Aguarde enquanto o documento é gerado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
