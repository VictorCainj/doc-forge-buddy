import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, X, Download } from '@/utils/iconMapper';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal = ({
  imageUrl,
  onClose,
}: ImagePreviewModalProps) => {
  const [imageZoom, setImageZoom] = useState<number>(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `imagem-vistoria-${Date.now()}.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={() => {
        onClose();
        setImageZoom(1);
      }}
    >
      <div
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com controles */}
        <div className="absolute top-0 left-0 right-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="text-white">
            <p className="text-xs sm:text-sm font-medium">
              Visualização da Imagem
            </p>
            <p className="text-xs opacity-70 hidden sm:block">
              Clique para ampliar/reduzir ou use os botões
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              disabled={imageZoom <= 0.5}
              title="Reduzir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-white text-xs sm:text-sm font-medium min-w-[50px] sm:min-w-[60px] text-center">
              {Math.round(imageZoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageZoom(Math.min(4, imageZoom + 0.25))}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              disabled={imageZoom >= 4}
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageZoom(1)}
              className="text-white hover:bg-white/20 h-8 sm:h-9 px-2 sm:px-3"
              title="Resetar zoom (100%)"
            >
              <span className="text-xs">100%</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="Baixar imagem"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                setImageZoom(1);
              }}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Imagem */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <img
            src={imageUrl}
            alt="Visualização em tamanho ampliado"
            className="object-contain transition-transform duration-200 cursor-move shadow-2xl rounded-lg"
            style={{
              transform: `scale(${imageZoom})`,
              maxWidth: imageZoom === 1 ? '100%' : 'none',
              maxHeight: imageZoom === 1 ? '100%' : 'none',
              imageRendering: imageZoom > 1.5 ? 'crisp-edges' : 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setImageZoom(imageZoom === 1 ? 2 : 1);
            }}
          />
        </div>

        {/* Dica de uso */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full">
          <p>
            Clique na imagem para ampliar/reduzir ou use os controles acima
          </p>
        </div>
      </div>
    </div>
  );
};
