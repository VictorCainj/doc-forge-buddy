import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  CheckCircle, 
  Trash2, 
  Save, 
  FileText 
} from '@/utils/iconMapper';

interface AnaliseHeaderProps {
  isEditMode: boolean;
  apontamentosCount: number;
  savedAnaliseId: string | null;
  saving: boolean;
  hasExistingAnalise: boolean;
  selectedContract: unknown;
  onClearAll: () => void;
  onSave: () => void;
  onGenerateDocument: () => void;
}

export const AnaliseHeader = ({
  isEditMode,
  apontamentosCount,
  savedAnaliseId,
  saving,
  hasExistingAnalise,
  selectedContract,
  onClearAll,
  onSave,
  onGenerateDocument,
}: AnaliseHeaderProps) => {
  return (
    <div className="bg-white border-b border-neutral-100 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6">
          {/* Header Principal */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 tracking-tight">
                    {isEditMode ? 'Editar Análise de Vistoria' : 'Análise de Vistoria'}
                  </h1>
                  {savedAnaliseId && (
                    <Badge
                      variant="outline"
                      className="text-xs border-green-200 bg-green-50 text-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Salva
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-600">
                  Sistema de análise comparativa de vistoria de saída
                </p>
              </div>
            </div>
            
            {/* Badge de Contagem */}
            <div className="flex items-center">
              <div className="px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-2xl font-semibold text-neutral-900">{apontamentosCount}</span>
                <span className="text-sm text-neutral-600 ml-2">
                  {apontamentosCount === 1 ? 'apontamento' : 'apontamentos'}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Ações */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
            {apontamentosCount > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Tudo
              </button>
            )}
            <button
              disabled={apontamentosCount === 0 || !selectedContract || saving}
              onClick={onSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode
                    ? 'Atualizar Análise'
                    : hasExistingAnalise
                      ? 'Atualizar Análise Existente'
                      : 'Salvar Análise'}
                </>
              )}
            </button>
            <button
              disabled={apontamentosCount === 0 || !selectedContract}
              onClick={onGenerateDocument}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4" />
              Gerar Documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
