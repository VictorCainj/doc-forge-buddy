import React from 'react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { useSafeHTML } from '@/hooks/useSafeHTML';
import {
  ArrowLeft,
  Printer,
  Save,
  Minimize2,
  Maximize2,
} from '@/utils/iconMapper';

interface DocumentPreviewProps {
  title: string;
  documentContent: string;
  fontSize: number;
  saving: boolean;
  hideSaveButton?: boolean;
  onBack: () => void;
  onSave: () => void;
  onPrint: () => void;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
}

/**
 * Componente de preview do documento
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = React.memo(
  ({
    documentContent,
    fontSize,
    saving,
    hideSaveButton = false,
    onBack,
    onSave,
    onPrint,
    onIncreaseFont,
    onDecreaseFont,
  }) => {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-sm">
                Madia Imóveis
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-foreground hover:bg-accent gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Editar
              </Button>
              {!hideSaveButton && (
                <Button
                  onClick={onSave}
                  variant="outline"
                  className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
              <Button
                onClick={onDecreaseFont}
                variant="outline"
                className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                title="Diminuir tamanho da fonte"
              >
                <Minimize2 className="h-4 w-4" />
                Diminuir
              </Button>
              <Button
                onClick={onIncreaseFont}
                variant="outline"
                className="gap-2 bg-background text-foreground hover:bg-accent border-border"
                title="Aumentar tamanho da fonte"
              >
                <Maximize2 className="h-4 w-4" />
                Aumentar
              </Button>
              <CopyButton content={documentContent} className="gap-2" />
              <Button
                onClick={onPrint}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </header>

        <main className="bg-background min-h-screen">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="p-6 overflow-hidden">
                <div
                  id="document-content"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    width: '100%',
                    maxWidth: '794px',
                    minHeight: '800px',
                    maxHeight: '950px',
                    padding: '40px',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    lineHeight: '1.4',
                    fontSize: `${fontSize}px`,
                    position: 'relative',
                    overflow: 'hidden',
                    pageBreakInside: 'avoid',
                    pageBreakAfter: 'avoid',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  <div
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      maxWidth: '100%',
                    }}
                  >
                    <SafeContent html={documentContent} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';

// Componente para renderizar conteúdo de forma segura
const SafeContent = ({ html }: { html: string }) => {
  const safeHTML = useSafeHTML(html);
  return <div dangerouslySetInnerHTML={{ __html: safeHTML }} />;
};
