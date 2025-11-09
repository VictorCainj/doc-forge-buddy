import React from 'react';
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
  Save,
  X,
  FileText,
  Home,
  Settings,
  AlertCircle,
  Wand2,
  ClipboardList,
  Package,
  Wrench,
} from '@/utils/iconMapper';
import { ImageUploadSection } from './ImageUploadSection';
import { BudgetItemType } from '@/types/orcamento';

interface ApontamentoFormProps {
  currentApontamento: Partial<{
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
    ambiente: string;
    subtitulo: string;
    descricao: string;
    descricaoServico: string;
    vistoriaInicial: {
      fotos: (File | {
        name: string;
        size: number;
        type: string;
        lastModified?: number;
        base64?: string;
        isFromDatabase?: boolean;
        isExternal?: boolean;
        url?: string;
        image_serial?: string;
      })[];
      descritivoLaudo: string;
    };
    vistoriaFinal: {
      fotos: (File | {
        name: string;
        size: number;
        type: string;
        lastModified?: number;
        base64?: string;
        isFromDatabase?: boolean;
        isExternal?: boolean;
        url?: string;
        image_serial?: string;
      })[];
    };
    observacao: string;
    classificacao?: 'responsabilidade' | 'revisao';
  }>;
  setCurrentApontamento: (apontamento: any) => void;
  documentMode: 'analise' | 'orcamento';
  editingApontamento: string | null;
  onSave: () => void;
  onCancel: () => void;
  isAILoading: boolean;
  onCorrectText: () => Promise<void>;
  onAIAnalysis: () => Promise<void>;
  showExtractionPanel: boolean;
  setShowExtractionPanel: (show: boolean) => void;
  extractionText: string;
  setExtractionText: (text: string) => void;
  onExtractApontamentos: () => Promise<void>;
  showExternalUrlInput: boolean;
  setShowExternalUrlInput: (show: boolean) => void;
  externalImageUrl: string;
  setExternalImageUrl: (url: string) => void;
}

export const ApontamentoForm: React.FC<ApontamentoFormProps> = ({
  currentApontamento,
  setCurrentApontamento,
  documentMode,
  editingApontamento,
  onSave,
  onCancel,
  isAILoading,
  onCorrectText,
  onAIAnalysis,
  showExtractionPanel,
  setShowExtractionPanel,
  extractionText,
  setExtractionText,
  onExtractApontamentos,
  showExternalUrlInput,
  setShowExternalUrlInput,
  externalImageUrl,
  setExternalImageUrl,
}) => {
  return (
    <Card className="xl:col-span-1 bg-white border-neutral-100 shadow-sm h-fit self-start">
      <CardHeader className="pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-neutral-900">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-medium">Novo Apontamento</span>
          </CardTitle>
          <Select
            value={documentMode}
            onValueChange={(value: 'analise' | 'orcamento') =>
              setCurrentApontamento((prev: any) => ({
                ...prev,
                documentMode: value,
              }))
            }
          >
            <SelectTrigger className="w-32 bg-white border-neutral-300 text-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analise">Análise</SelectItem>
              <SelectItem value="orcamento">Orçamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Painel de Extração Automática com IA */}
        <div className="space-y-3">
          <button
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 text-sm font-medium"
            onClick={() => setShowExtractionPanel(!showExtractionPanel)}
          >
            <Wand2 className="h-4 w-4" />
            {showExtractionPanel
              ? 'Ocultar'
              : 'Criar Apontamentos com IA'}
          </button>

          {showExtractionPanel && (
            <div className="space-y-3 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Wand2 className="h-5 w-5 text-neutral-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-1">
                    Extração Automática de Apontamentos
                  </h4>
                  <p className="text-xs text-neutral-600 mb-3">
                    Cole o texto completo da vistoria abaixo. A IA
                    processará <strong>TODO o texto integralmente</strong>{' '}
                    e identificará automaticamente cada ambiente,
                    subtítulo e descrição - sem omitir nenhuma informação.
                  </p>
                  <Textarea
                    placeholder={`Exemplo de formato (cole quantos apontamentos precisar):

SALA
Pintar as paredes
estão excessivamente sujas
---------
Reparar e remover manchas do sofá
os encostos não estão travando
---------
COZINHA
Limpar a Air fryer
está suja
---------

✓ Pode colar textos longos
✓ Todos os apontamentos serão processados`}
                    value={extractionText}
                    onChange={(e) => setExtractionText(e.target.value)}
                    rows={10}
                    className="text-sm bg-white border-neutral-300 focus:border-neutral-500 mb-3 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onExtractApontamentos}
                      disabled={!extractionText.trim() || isAILoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAILoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Extrair Apontamentos
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setExtractionText('');
                        setShowExtractionPanel(false);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 text-sm font-medium"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-neutral-200" />

        {/* Ambiente e Subtítulo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="ambiente"
              className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
            >
              <Home className="h-4 w-4 text-neutral-600" />
              <span>Ambiente *</span>
            </Label>
            <Input
              id="ambiente"
              placeholder="Ex: SALA"
              value={currentApontamento.ambiente || ''}
              onChange={(e) =>
                setCurrentApontamento((prev: any) => ({
                  ...prev,
                  ambiente: e.target.value,
                }))
              }
              className="h-9 bg-white border-neutral-300"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="subtitulo"
              className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
            >
              <Settings className="h-4 w-4 text-neutral-600" />
              <span>Subtítulo</span>
            </Label>
            <Input
              id="subtitulo"
              placeholder="Ex: Armário"
              value={currentApontamento.subtitulo || ''}
              onChange={(e) =>
                setCurrentApontamento((prev: any) => ({
                  ...prev,
                  subtitulo: e.target.value,
                }))
              }
              className="h-9 bg-white border-neutral-300"
            />
          </div>
        </div>

        {/* Descrição do Apontamento */}
        <div className="space-y-2">
          <Label
            htmlFor="descricao"
            className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
          >
            <FileText className="h-4 w-4 text-neutral-600" />
            <span>
              {documentMode === 'orcamento'
                ? 'Descrição do Vistoriador *'
                : 'Descrição *'}
            </span>
          </Label>
          <Textarea
            id="descricao"
            placeholder={
              documentMode === 'orcamento'
                ? 'Apontamento realizado pelo vistoriador...'
                : 'Ex: Está com lascado nas portas'
            }
            value={currentApontamento.descricao || ''}
            onChange={(e) =>
              setCurrentApontamento((prev: any) => ({
                ...prev,
                descricao: e.target.value,
              }))
            }
            rows={2}
            className="text-sm bg-white border-neutral-300"
          />
        </div>

        {/* Descrição do Serviço - Apenas no modo orçamento */}
        {documentMode === 'orcamento' && (
          <div className="space-y-2">
            <Label
              htmlFor="descricaoServico"
              className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
            >
              <FileText className="h-4 w-4 text-neutral-600" />
              <span>Descrição do Serviço *</span>
            </Label>
            <Textarea
              id="descricaoServico"
              placeholder="Descrição detalhada do serviço a ser executado..."
              value={currentApontamento.descricaoServico || ''}
              onChange={(e) =>
                setCurrentApontamento((prev: any) => ({
                  ...prev,
                  descricaoServico: e.target.value,
                }))
              }
              rows={2}
              className="text-sm bg-white border-neutral-300"
            />
          </div>
        )}

        {/* Campos de Orçamento - Apenas no modo orçamento */}
        {documentMode === 'orcamento' && (
          <>
            <Separator className="bg-neutral-200" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-neutral-900">
                  Tipo
                </Label>
                <Select
                  value={currentApontamento.tipo || 'material'}
                  onValueChange={(value: BudgetItemType) =>
                    setCurrentApontamento((prev: any) => ({
                      ...prev,
                      tipo: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 bg-white border-neutral-300 text-neutral-900">
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
                <Label className="text-xs font-medium text-neutral-900">
                  Valor Unit.
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentApontamento.valor || ''}
                  onChange={(e) =>
                    setCurrentApontamento((prev: any) => ({
                      ...prev,
                      valor: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-8 text-sm bg-white border-neutral-300"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-neutral-900">
                  Quantidade
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentApontamento.quantidade || ''}
                  onChange={(e) =>
                    setCurrentApontamento((prev: any) => ({
                      ...prev,
                      quantidade: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-8 text-sm bg-white border-neutral-300"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-neutral-900">
                  Subtotal
                </Label>
                <div className="flex items-center space-x-1 h-8 px-2 bg-white rounded border border-neutral-300 text-sm font-medium text-neutral-900">
                  <span>
                    {(
                      (currentApontamento.valor || 0) *
                      (currentApontamento.quantidade || 0)
                    ).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="bg-neutral-200" />

        {/* Seção de Upload de Imagens */}
        <ImageUploadSection
          currentApontamento={currentApontamento}
          setCurrentApontamento={setCurrentApontamento}
          documentMode={documentMode}
          showExternalUrlInput={showExternalUrlInput}
          setShowExternalUrlInput={setShowExternalUrlInput}
          externalImageUrl={externalImageUrl}
          setExternalImageUrl={setExternalImageUrl}
        />

        <Separator className="bg-neutral-200" />

        {/* Observação */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="observacao"
              className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
            >
              <AlertCircle className="h-4 w-4 text-neutral-600" />
              <span>Análise Técnica</span>
            </Label>
            <div className="flex items-center gap-2">
              <button
                onClick={onCorrectText}
                disabled={
                  isAILoading || !currentApontamento.observacao?.trim()
                }
                className="inline-flex items-center gap-1 px-3 h-6 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Corrigir ortografia com IA"
              >
                {isAILoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Corrigindo...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    <span>Corrigir</span>
                  </>
                )}
              </button>
              <button
                onClick={onAIAnalysis}
                disabled={false}
                className="inline-flex items-center gap-1 px-3 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium"
                title="Clique para analisar com IA"
              >
                <Wand2 className="h-3 w-3" />
                {isAILoading ? 'Analisando...' : 'Analisar'}
              </button>
            </div>
          </div>
          <Textarea
            id="observacao"
            placeholder="Sua análise sobre a contestação do locatário..."
            value={currentApontamento.observacao || ''}
            onChange={(e) =>
              setCurrentApontamento((prev: any) => ({
                ...prev,
                observacao: e.target.value,
              }))
            }
            rows={3}
            className="text-sm bg-white border-neutral-300"
          />
        </div>

        {/* Classificação de Responsabilidade (apenas modo análise) */}
        {documentMode === 'analise' && (
          <div className="space-y-2">
            <Label
              htmlFor="classificacao"
              className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
            >
              <ClipboardList className="h-4 w-4 text-neutral-600" />
              <span>Classificação do Item *</span>
            </Label>
            <Select
              value={currentApontamento.classificacao}
              onValueChange={(value: 'responsabilidade' | 'revisao') =>
                setCurrentApontamento((prev: any) => ({
                  ...prev,
                  classificacao: value,
                }))
              }
            >
              <SelectTrigger className="bg-white border-neutral-300 text-neutral-900">
                <SelectValue placeholder="Selecione a classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsabilidade">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-700">■</span>
                    <span>Responsabilidade do Locatário</span>
                  </div>
                </SelectItem>
                <SelectItem value="revisao">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-600">■</span>
                    <span>Passível de Revisão</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 italic">
              {currentApontamento.classificacao === 'responsabilidade'
                ? 'Este item será marcado como responsabilidade do locatário no documento'
                : currentApontamento.classificacao === 'revisao'
                  ? 'Este item será marcado como passível de revisão no documento'
                  : 'Escolha se este item é responsabilidade do locatário ou se necessita revisão'}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={onSave}
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
              onClick={onCancel}
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
  );
};