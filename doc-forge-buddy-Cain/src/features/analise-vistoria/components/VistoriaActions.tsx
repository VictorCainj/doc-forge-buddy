import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Save,
  FileText,
  Trash2,
  Download,
  Copy,
  Printer,
  ChevronDown,
} from '@/utils/iconMapper';
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
  onCopyToEmail: () => Promise<void>;
  onPrint: () => Promise<void>;
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
  onCopyToEmail,
  onPrint,
}) => {
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDocumentMenu(false);
      }
    };

    if (showDocumentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDocumentMenu]);

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Informações Compactas à Esquerda */}
        <div className="flex items-center gap-6 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Apontamentos:</span>
            <Badge variant={apontamentosCount > 0 ? "outline" : "outline"} className="h-5 px-2 text-xs border-neutral-300 text-neutral-700">
              {apontamentosCount}
            </Badge>
          </div>
          
          {selectedContract && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Contrato:</span>
              <span className="text-neutral-700 font-medium">
                {selectedContract.form_data.numeroContrato || 'N/A'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Data:</span>
            <span className="text-neutral-700">
              {formatDateBrazilian(new Date().toISOString().split('T')[0])}
            </span>
          </div>

          {/* Status Badges Compactos */}
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Badge variant="outline" className="h-5 px-2 text-xs border-neutral-300 text-neutral-700 bg-neutral-50">
                Edição
              </Badge>
            )}
            {savedAnaliseId && (
              <Badge variant="outline" className="h-5 px-2 text-xs border-neutral-300 text-neutral-700 bg-neutral-50">
                Salvo
              </Badge>
            )}
            {hasExistingAnalise && (
              <Badge variant="outline" className="h-5 px-2 text-xs border-neutral-300 text-neutral-700 bg-neutral-50">
                Existente
              </Badge>
            )}
          </div>
        </div>

        {/* Ações Compactas à Direita */}
        <div className="flex items-center gap-2">
          {/* Botão Salvar Análise */}
          <Button
            onClick={onSave}
            disabled={saving || apontamentosCount === 0}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            <Save className="h-3 w-3 mr-1.5" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>

          {/* Menu de Documento com Dropdown */}
          <div className="relative" ref={menuRef}>
            <Button
              onClick={() => setShowDocumentMenu(!showDocumentMenu)}
              disabled={apontamentosCount === 0 || saving}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-neutral-300 text-neutral-700 hover:bg-neutral-50 justify-between gap-2"
            >
              <Download className="h-3 w-3" />
              <span>Documento</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showDocumentMenu ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {showDocumentMenu && (
              <div className="absolute z-10 right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg">
                <div className="py-1">
                  <button
                    onClick={async () => {
                      await onCopyToEmail();
                      setShowDocumentMenu(false);
                    }}
                    disabled={apontamentosCount === 0 || saving}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar para E-mail
                  </button>
                  <button
                    onClick={async () => {
                      await onPrint();
                      setShowDocumentMenu(false);
                    }}
                    disabled={apontamentosCount === 0 || saving}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="h-3 w-3" />
                    Imprimir
                  </button>
                  <div className="border-t border-neutral-200 my-1"></div>
                  <button
                    onClick={async () => {
                      await onGenerateDocument();
                      setShowDocumentMenu(false);
                    }}
                    disabled={apontamentosCount === 0 || saving}
                    className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="h-3 w-3" />
                    Visualizar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Limpar Tudo */}
          <Button
            onClick={onClearAll}
            disabled={saving}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Alertas Compactos (apenas quando necessário) */}
      {apontamentosCount === 0 && (
        <div className="px-2 py-1.5 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-neutral-500" />
            <p className="text-xs text-neutral-600">
              Adicione pelo menos um apontamento para salvar ou gerar documentos.
            </p>
          </div>
        </div>
      )}

      {hasExistingAnalise && !isEditMode && (
        <div className="px-2 py-1.5 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-neutral-500" />
            <p className="text-xs text-neutral-600">
              Existe uma análise salva para este contrato.
            </p>
          </div>
        </div>
      )}

      {savedAnaliseId && (
        <div className="px-2 py-1.5 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center gap-2">
            <Save className="h-3 w-3 text-neutral-500" />
            <p className="text-xs text-neutral-600">
              Análise salva. ID: {savedAnaliseId.slice(0, 8)}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};