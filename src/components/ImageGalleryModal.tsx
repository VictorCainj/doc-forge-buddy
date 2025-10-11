import { memo, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Send } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGalleryModalProps {
  images: Array<{
    url: string;
    timestamp: Date;
    messageId: string;
  }>;
  initialIndex?: number;
  onClose: () => void;
  onSendToChat?: (imageUrl: string) => void;
}

const ImageGalleryModal = memo(({ 
  images, 
  initialIndex = 0, 
  onClose,
  onSendToChat 
}: ImageGalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `image-${currentImage.timestamp.getTime()}.png`;
    link.click();
  };

  const handleSendToChat = () => {
    if (onSendToChat) {
      onSendToChat(currentImage.url);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <p className="text-sm opacity-70">
              {currentIndex + 1} de {images.length}
            </p>
            <p className="text-xs opacity-50">
              {currentImage.timestamp.toLocaleString('pt-BR')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="text-white hover:bg-white/20"
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>

            {onSendToChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendToChat}
                className="text-white hover:bg-white/20"
                title="Enviar para o chat"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={currentImage.url}
              alt={`Imagem ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{ 
                transform: `scale(${zoom})`,
                imageRendering: zoom > 1 ? 'crisp-edges' : 'auto'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: zoom }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.messageId}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(1);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? 'border-neutral-400 scale-110'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ImageGalleryModal.displayName = 'ImageGalleryModal';

export default ImageGalleryModal;
