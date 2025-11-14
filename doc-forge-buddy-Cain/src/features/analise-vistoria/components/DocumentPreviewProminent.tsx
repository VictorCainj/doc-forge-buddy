import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentPreviewContent } from './DocumentPreviewContent';
import { FileText } from '@/utils/iconMapper';

interface DocumentPreviewProminentProps {
  documentPreview: string;
  apontamentosCount: number;
  documentMode: 'analise' | 'orcamento';
}

export const DocumentPreviewProminent: React.FC<DocumentPreviewProminentProps> = ({
  documentPreview,
  apontamentosCount,
  documentMode,
}) => {
  if (!documentPreview) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">Adicione apontamentos para visualizar o documento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header minimalista */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">Pré-visualização do Documento</h2>
          <Badge variant="outline" className="text-xs">
            {apontamentosCount} {apontamentosCount === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
        <Badge variant="secondary" className="text-xs">
          {documentMode === 'analise' ? 'Análise' : 'Orçamento'}
        </Badge>
      </div>

      {/* Documento em destaque */}
      <div className="flex-1 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
        <div className="document-preview-container max-w-none">
          <DocumentPreviewContent html={documentPreview} />
        </div>
      </div>
    </div>
  );
};

