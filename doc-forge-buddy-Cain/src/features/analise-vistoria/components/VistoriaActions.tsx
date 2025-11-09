import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, FileText, Trash2, Download } from '@/utils/iconMapper';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

interface VistoriaActionsProps {
  isEditMode: boolean;
  apontamentosCount: number;
  savedAnaliseId: string | null;
  saving: boolean;
  hasExistingAnalise: boolean;
  selectedContract: Contract | null;
  onClearAll: () => void;
  onSave: () => void;
  onGenerateDocument: () => Promise<void>;
}

export const VistoriaActions: React.FC<VistoriaActionsProps> = ({
  isEditMode,
  apontamentosCount,
  savedAnaliseId,
  saving,
  hasExistingAnalise,
  selectedContract,
  onClearAll,
  onSave,
  onGenerateDocument,
}) => {
  return (
    <Card className="bg-white border-neutral-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-neutral-900">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <span className="text-lg font-medium">Ações da Análise</span>
            <p className="text-sm font-normal text-neutral-600 mt-1">
              Gerencie sua análise de vistoria
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Análise */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Status</span>
            <div className="flex items-center space-x-2">
              {isEditMode && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Modo Edição
                </Badge>
              )}
              {savedAnaliseId && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Salvo
                </Badge>
              )}
              {hasExistingAnalise && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  Análise Existente
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Apontamentos</span>
            <Badge variant={apontamentosCount > 0 ? "default" : "outline"}>
              {apontamentosCount} {apontamentosCount === 1 ? 'item' : 'itens'}
            </Badge>
          </div>

          {selectedContract && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Contrato</span>
              <span className="text-sm text-neutral-600">
                {selectedContract.form_data.numeroContrato || 'N/A'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Data</span>
            <span className="text-sm text-neutral-600">
              {formatDateBrazilian(new Date().toISOString().split('T')[0])}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4 space-y-3">
          {/* Botão Salvar Análise */}
          <Button
            onClick={onSave}
            disabled={saving || apontamentosCount === 0}
            className="w-full h-10"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Análise'}
          </Button>

          {/* Botão Gerar Documento */}
          <Button
            onClick={onGenerateDocument}
            disabled={apontamentosCount === 0 || saving}
            variant="outline"
            className="w-full h-10"
          >
            <Download className="h-4 w-4 mr-2" />
            Gerar Documento
          </Button>

          {/* Botão Limpar Tudo */}
          <Button
            onClick={onClearAll}
            disabled={saving}
            variant="destructive"
            className="w-full h-10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>

        {/* Alertas e Avisos */}
        {apontamentosCount === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Adicione pelo menos um apontamento para salvar ou gerar documentos.
              </p>
            </div>
          </div>
        )}

        {hasExistingAnalise && !isEditMode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Existe uma análise salva para este contrato. Você pode editá-la ou criar uma nova.
              </p>
            </div>
          </div>
        )}

        {savedAnaliseId && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Save className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                Análise salva com sucesso! ID: {savedAnaliseId.slice(0, 8)}...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};