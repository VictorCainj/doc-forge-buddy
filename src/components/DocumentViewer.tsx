import { X, Trash2 } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useSafeHTML } from '@/hooks/useSafeHTML';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentViewerProps {
  htmlContent: string;
  onClose: () => void;
  onImageDelete?: (imageSrc: string) => void;
}

export function DocumentViewer({
  htmlContent,
  onClose,
  onImageDelete,
}: DocumentViewerProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleImageDoubleClick = (src: string) => {
    setZoomedImage(src);
  };

  const handleImageClick = (url: string, event: React.MouseEvent) => {
    // Se Ctrl+Click, mostrar opção de exclusão
    if (event.ctrlKey) {
      event.preventDefault();
      setImageToDelete(url);
      setShowDeleteDialog(true);
      return;
    }

    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageRightClick = (url: string, event: React.MouseEvent) => {
    event.preventDefault();
    setImageToDelete(url);
    setShowDeleteDialog(true);
  };

  const handleImageDelete = () => {
    if (imageToDelete && onImageDelete) {
      onImageDelete(imageToDelete);
    }
    setShowDeleteDialog(false);
    setImageToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header com botão de fechar */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-base sm:text-xl font-semibold text-neutral-900">
            Modo Exibição - Documento Completo
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-neutral-100 text-sm sm:text-base"
          >
            <X className="h-5 w-5 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Conteúdo do documento */}
      <div className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
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
              if (src) {
                handleImageClick(src, e as React.MouseEvent);
              }
            }
          }}
          onContextMenu={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              const src = target.getAttribute('src');
              if (src) {
                handleImageRightClick(src, e as React.MouseEvent);
              }
            }
          }}
          onImageDelete={(imageSrc) => {
            setImageToDelete(imageSrc);
            setShowDeleteDialog(true);
          }}
        />
      </div>

      {/* Modal de imagem ampliada */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => {
            setZoomedImage(null);
          }}
        >
          <div className="relative max-w-[95vw] sm:max-w-[90vw] max-h-[90vh]">
            {/* Botão de fechar */}
            <div className="absolute -top-10 sm:-top-12 right-0 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoomedImage(null);
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Excluir Imagem
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta imagem do documento? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImageDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .document-viewer-content img {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-radius: 4px;
          position: relative;
          max-width: 100%;
          height: auto;
          display: block;
        }
        .document-viewer-content img:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 3px #2196F3;
        }
        .document-viewer-content img:hover::after {
          content: "Ctrl+Click ou botão direito para excluir";
          position: absolute;
          top: -30px;
          left: 0;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          white-space: nowrap;
          z-index: 1000;
        }
        .image-delete-overlay {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 1001;
        }
        .image-container:hover .image-delete-overlay {
          opacity: 1;
        }
        .image-container {
          position: relative;
          display: inline-block;
        }
        
        /* Estilos específicos para mobile */
        @media (max-width: 640px) {
          .document-viewer-content img {
            max-width: 100%;
            height: auto;
          }
          .document-viewer-content img:hover {
            transform: scale(1.02);
          }
          .document-viewer-content img:hover::after {
            display: none;
          }
          .image-delete-overlay {
            opacity: 1;
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}

// Componente para renderizar documento de forma segura
const SafeDocumentViewer = ({
  html,
  onDoubleClick,
  onClick,
  onContextMenu,
  onImageDelete,
}: {
  html: string;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu: React.MouseEventHandler<HTMLDivElement>;
  onImageDelete?: (imageSrc: string) => void;
}) => {
  const safeHTML = useSafeHTML(html);

  // Usar HTML original sem processamento
  const processedHTML = safeHTML;

  React.useEffect(() => {
    // Expor função global para os botões de exclusão
    if (onImageDelete) {
      (window as any).handleImageDelete = (imageSrc: string) => {
        console.log('Botão de exclusão clicado para:', imageSrc);
        onImageDelete(imageSrc);
      };
    }

    return () => {
      delete (window as any).handleImageDelete;
    };
  }, [onImageDelete]);

  // Adicionar botões de exclusão via JavaScript após renderização
  React.useEffect(() => {
    if (!onImageDelete) return;

    const addDeleteButtons = () => {
      const images = document.querySelectorAll('.document-viewer-content img');
      console.log('🔍 Encontradas', images.length, 'imagens para processar');
      console.log(
        '🔍 HTML do documento:',
        document
          .querySelector('.document-viewer-content')
          ?.innerHTML.substring(0, 200) + '...'
      );

      if (images.length === 0) {
        console.log('❌ Nenhuma imagem encontrada no documento');
        console.log('🔍 Tentando seletores alternativos...');

        // Tentar seletores alternativos
        const allImages = document.querySelectorAll('img');
        console.log('🔍 Total de imagens na página:', allImages.length);

        allImages.forEach((img, index) => {
          console.log(
            `🔍 Imagem ${index + 1}:`,
            img.src?.substring(0, 50) + '...'
          );
        });
        return;
      }

      images.forEach((img, index) => {
        console.log(`🔍 Processando imagem ${index + 1}:`, {
          tagName: img.tagName,
          src: img.src?.substring(0, 50) + '...',
          className: img.className,
          parentElement: img.parentElement?.tagName,
        });

        // Verificar se já tem botão de exclusão
        if (img.parentElement?.querySelector('.image-delete-overlay')) {
          console.log(`⏭️ Imagem ${index + 1} já tem botão, pulando`);
          return;
        }

        const src = img.getAttribute('src');
        if (!src) {
          console.log(`❌ Imagem ${index + 1} não tem src`);
          return;
        }

        console.log(
          `✅ Processando imagem ${index + 1}:`,
          src.substring(0, 50) + '...'
        );

        // Criar container
        const container = document.createElement('div');
        container.className = 'image-container';
        container.style.cssText =
          'position: relative; display: inline-block; margin: 5px;';

        // Criar botão de exclusão
        const deleteButton = document.createElement('button');
        deleteButton.className = 'image-delete-overlay';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Excluir imagem';
        deleteButton.style.cssText = `
          position: absolute; 
          top: 5px; 
          right: 5px; 
          background: #ef4444; 
          color: white; 
          border: none; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          font-size: 12px; 
          opacity: 1; 
          z-index: 1001; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        deleteButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🗑️ Botão de exclusão clicado para:', src);
          onImageDelete(src);
        };

        // Envolver imagem no container
        if (img.parentNode) {
          img.parentNode.insertBefore(container, img);
          container.appendChild(img);
          container.appendChild(deleteButton);
          console.log(`✅ Botão adicionado à imagem ${index + 1}`);
          console.log(
            `✅ Container criado:`,
            container.outerHTML.substring(0, 100) + '...'
          );
        } else {
          console.log(`❌ Imagem ${index + 1} não tem parentNode`);
        }
      });
    };

    // Executar após um pequeno delay para garantir que o HTML foi renderizado
    const timeoutId = setTimeout(addDeleteButtons, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [processedHTML, onImageDelete]);

  return (
    <div
      className="document-viewer-content"
      dangerouslySetInnerHTML={{ __html: processedHTML }}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
};
