import { X } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useSafeHTML } from '@/hooks/useSafeHTML';

interface DocumentViewerProps {
  htmlContent: string;
  onClose: () => void;
}

export function DocumentViewer({ htmlContent, onClose }: DocumentViewerProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleImageDoubleClick = (src: string) => {
    setZoomedImage(src);
  };

  const handleImageClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header com botão de fechar */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            Modo Exibição - Documento Completo
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-neutral-100"
          >
            <X className="h-5 w-5 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Conteúdo do documento */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <SafeDocumentViewer
          html={htmlContent}
          onDoubleClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              const src = target.getAttribute('src');
              if (src && (src.startsWith('http') || src.startsWith('data:'))) {
                handleImageDoubleClick(src);
              }
            }
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              const src = target.getAttribute('src');
              if (src && src.startsWith('http')) {
                handleImageClick(src);
              }
            }
          }}
        />
      </div>

      {/* Modal de imagem ampliada */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-8"
          onClick={() => {
            setZoomedImage(null);
          }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* Botão de fechar */}
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoomedImage(null);
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <img
              src={zoomedImage || ''}
              alt="Imagem ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style>{`
        .document-viewer-content img {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-radius: 4px;
        }
        .document-viewer-content img:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 3px #2196F3;
        }
      `}</style>
    </div>
  );
}

// Componente para renderizar documento de forma segura
const SafeDocumentViewer = ({
  html,
  onDoubleClick,
}: {
  html: string;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
}) => {
  const safeHTML = useSafeHTML(html);
  return (
    <div
      className="document-viewer-content"
      dangerouslySetInnerHTML={{ __html: safeHTML }}
      onDoubleClick={onDoubleClick}
    />
  );
};
