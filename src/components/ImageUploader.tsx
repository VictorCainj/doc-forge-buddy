import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { validateImage, compressImage, formatFileSize } from '@/utils/imageValidation';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // em bytes
  maxWidth?: number;
  maxHeight?: number;
  currentImage?: string;
  disabled?: boolean;
}

/**
 * Componente de upload de imagens com otimização automática
 * - Validação de tipo, tamanho e dimensões
 * - Compressão automática se necessário
 * - Preview da imagem
 * - Feedback visual de progresso
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  onRemove,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB padrão
  maxWidth = 2048,
  maxHeight = 2048,
  currentImage,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      // Validar imagem
      const validation = await validateImage(file, {
        maxSize,
        maxWidth,
        maxHeight,
      });

      if (!validation.valid) {
        toast.error(validation.error || 'Imagem inválida');
        setIsProcessing(false);
        return;
      }

      // Mostrar avisos se houver
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      let finalFile = file;

      // Comprimir se necessário (maior que 1MB)
      if (file.size > 1024 * 1024) {
        toast.info('Comprimindo imagem...');
        const compressed = await compressImage(file, 1024 * 1024); // 1MB
        if (compressed) {
          finalFile = compressed;
          const savedSize = file.size - compressed.size;
          toast.success(
            `Imagem otimizada! Economizados ${formatFileSize(savedSize)}`
          );
        }
      }

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(finalFile);

      // Callback com arquivo otimizado
      onUpload(finalFile);
      
      toast.success('Imagem carregada com sucesso');
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    } finally {
      setIsProcessing(false);
    }
  }, [maxSize, maxWidth, maxHeight, onUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    } else {
      toast.error('Por favor, envie apenas arquivos de imagem');
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onRemove?.();
    toast.info('Imagem removida');
  }, [onRemove]);

  return (
    <div className="space-y-2">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            relative border-2 border-dashed rounded-lg p-6
            transition-colors duration-200
            ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'}
            ${isProcessing ? 'animate-pulse' : ''}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={disabled || isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isProcessing ? 'bg-blue-100' : 'bg-blue-50'}
            `}>
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : (
                <Upload className="h-8 w-8 text-blue-600" />
              )}
            </div>
            
            <p className="text-sm font-medium text-slate-700 mb-1">
              {isProcessing ? 'Processando...' : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG ou WEBP até {formatFileSize(maxSize)}
            </p>
            
            {!disabled && !isProcessing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                Selecionar Arquivo
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-green-200 rounded-lg p-4 bg-green-50/50">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-600" />
                    Imagem carregada
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Imagem otimizada e pronta para uso
                  </p>
                </div>
                
                {!disabled && onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Info Card */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">Otimização Automática</p>
          <p>Imagens maiores que 1MB serão automaticamente comprimidas mantendo a qualidade visual.</p>
        </div>
      </div>
    </div>
  );
};
