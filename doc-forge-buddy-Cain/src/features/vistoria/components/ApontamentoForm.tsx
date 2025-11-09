import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
import { ApontamentoVistoria } from '@/types/vistoria';
import { BudgetItemType } from '@/types/orcamento';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, X, Upload, Trash2, Camera } from '@/utils/iconMapper';
'analise' | 'orcamento';
  onCurrentChange: (apontamento: Partial<ApontamentoVistoria>) => void;
  onAdd: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveFotoInicial: (index: number) => void;
  onRemoveFotoFinal: (index: number) => void;
  onPaste: (event: ClipboardEvent, tipo: 'inicial' | 'final') => void;
}

const ApontamentoForm = memo(
  ({
    currentApontamento,
    editingApontamento,
    documentMode,
    onCurrentChange,
    onAdd,
    onSaveEdit,
    onCancelEdit,
    onRemoveFotoInicial,
    onRemoveFotoFinal,
  }: ApontamentoFormProps) => {
    const handleFileUpload = (
      files: FileList | null,
      tipo: 'inicial' | 'final'
    ) => {
      if (!files) return;

      const fileArray = Array.from(files);
      onCurrentChange({
        ...currentApontamento,
        [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
          fotos: [
            ...(currentApontamento[
              `vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`
            ]?.fotos || []),
            ...fileArray,
          ],
        },
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>
              {editingApontamento ? 'Editar Apontamento' : 'Novo Apontamento'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ambiente */}
          <div>
            <Label htmlFor="ambiente">Ambiente *</Label>
            <Input
              id="ambiente"
              placeholder="Ex: Sala de Estar"
              value={currentApontamento.ambiente || ''}
              onChange={(e) =>
                onCurrentChange({
                  ...currentApontamento,
                  ambiente: e.target.value,
                })
              }
            />
          </div>

          {/* Subtítulo */}
          <div>
            <Label htmlFor="subtitulo">Subtítulo (opcional)</Label>
            <Input
              id="subtitulo"
              placeholder="Ex: Parede lateral"
              value={currentApontamento.subtitulo || ''}
              onChange={(e) =>
                onCurrentChange({
                  ...currentApontamento,
                  subtitulo: e.target.value,
                })
              }
            />
          </div>

          {/* Descrição do Vistoriador */}
          <div>
            <Label htmlFor="descricao">
              {documentMode === 'orcamento'
                ? 'Descrição do Vistoriador *'
                : 'Descrição *'}
            </Label>
            <Textarea
              id="descricao"
              placeholder="Apontamento realizado pelo vistoriador..."
              value={currentApontamento.descricao || ''}
              onChange={(e) =>
                onCurrentChange({
                  ...currentApontamento,
                  descricao: e.target.value,
                })
              }
              rows={3}
            />
          </div>

          {/* Descrição do Serviço (somente modo orçamento) */}
          {documentMode === 'orcamento' && (
            <div>
              <Label htmlFor="descricaoServico">Descrição do Serviço *</Label>
              <Textarea
                id="descricaoServico"
                placeholder="Descrição detalhada do serviço a ser executado..."
                value={currentApontamento.descricaoServico || ''}
                onChange={(e) =>
                  onCurrentChange({
                    ...currentApontamento,
                    descricaoServico: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          )}

          {/* Campos de Orçamento */}
          {documentMode === 'orcamento' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div>
                <Label htmlFor="tipo">Tipo de Item</Label>
                <Select
                  value={currentApontamento.tipo || 'material'}
                  onValueChange={(value: BudgetItemType) =>
                    onCurrentChange({ ...currentApontamento, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentApontamento.quantidade || 0}
                  onChange={(e) =>
                    onCurrentChange({
                      ...currentApontamento,
                      quantidade: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="valor">Valor Unitário (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentApontamento.valor || 0}
                  onChange={(e) =>
                    onCurrentChange({
                      ...currentApontamento,
                      valor: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Fotos Vistoria Inicial */}
          <div>
            <Label>Fotos - Vistoria Inicial</Label>
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'inicial')}
                className="hidden"
                id="upload-inicial"
              />
              <label htmlFor="upload-inicial">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Fotos (ou Ctrl+V)
                  </span>
                </Button>
              </label>
            </div>

            {currentApontamento.vistoriaInicial?.fotos &&
              currentApontamento.vistoriaInicial.fotos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currentApontamento.vistoriaInicial.fotos.map(
                    (foto, index) => {
                      const isFile = foto instanceof File;
                      const url = isFile
                        ? URL.createObjectURL(foto)
                        : (foto as any).url;
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Inicial ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemoveFotoInicial(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
          </div>

          {/* Fotos Vistoria Final */}
          <div>
            <Label>Fotos - Vistoria Final</Label>
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'final')}
                className="hidden"
                id="upload-final"
              />
              <label htmlFor="upload-final">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Fotos (ou Ctrl+V)
                  </span>
                </Button>
              </label>
            </div>

            {currentApontamento.vistoriaFinal?.fotos &&
              currentApontamento.vistoriaFinal.fotos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {currentApontamento.vistoriaFinal.fotos.map((foto, index) => {
                    const isFile = foto instanceof File;
                    const url = isFile
                      ? URL.createObjectURL(foto)
                      : (foto as any).url;
                    return (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Final ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onRemoveFotoFinal(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Observação */}
          <div>
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Observações adicionais..."
              value={currentApontamento.observacao || ''}
              onChange={(e) =>
                onCurrentChange({
                  ...currentApontamento,
                  observacao: e.target.value,
                })
              }
              rows={2}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex space-x-2">
            {editingApontamento ? (
              <>
                <Button onClick={onSaveEdit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button onClick={onCancelEdit} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={onAdd} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Apontamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ApontamentoForm.displayName = 'ApontamentoForm';

export default ApontamentoForm;
