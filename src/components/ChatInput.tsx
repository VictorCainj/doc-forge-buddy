import { memo, useCallback, useRef, useState } from 'react';
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  X,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onUploadImage?: (file: File) => Promise<void>;
  onUploadMultipleImages?: (files: File[]) => Promise<void>;
  onUploadAudio?: (file: File) => Promise<void>;
  onGenerateImage?: (prompt: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput = memo(
  ({
    value,
    onChange,
    onSubmit,
    onUploadMultipleImages,
    onUploadAudio,
    onGenerateImage,
    isLoading,
    placeholder = 'Digite sua mensagem...',
  }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const { toast } = useToast();

    // Handle paste events for images
    const handlePaste = useCallback(
      (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        // Look for image items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();

            if (!file) continue;

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              toast({
                title: 'Arquivo muito grande',
                description: 'O tamanho máximo é 10MB.',
                variant: 'destructive',
              });
              continue;
            }

            newFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
              newPreviews.push(event.target?.result as string);
              if (newPreviews.length === newFiles.length) {
                setPreviewImages((prev) => [...prev, ...newPreviews]);
              }
            };
            reader.readAsDataURL(file);
          }
        }

        if (newFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
          toast({
            title: `${newFiles.length} imagem(ns) colada(s)`,
            description: 'Imagens adicionadas com sucesso. Clique em enviar.',
          });
        }
      },
      [toast]
    );

    const handleRemoveImage = useCallback((index: number) => {
      setPreviewImages((prev) => prev.filter((_, i) => i !== index));
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleRemoveAllImages = useCallback(() => {
      setPreviewImages([]);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        // Handle multiple images upload
        if (selectedFiles.length > 0 && onUploadMultipleImages) {
          await onUploadMultipleImages(selectedFiles);
          handleRemoveAllImages();
          return;
        }

        // Handle text message
        if (!value.trim()) return;

        // Intelligent detection for image generation

        // Comprehensive and natural language detection for image generation
        const imageGenerationPatterns = [
          // Comandos diretos de geração
          /\b(gere?|crie?|desenhe?|ilustre?|fa[çc]a|fazer|monte?)\s+(uma?|um)?\s*(imagem|desenho|ilustra[çc][ãa]o|visual|gr[áa]fico|diagrama|foto|arte)/i,
          /\b(mostre?|quero|preciso|gostaria|pode)\s+(uma?|um|de\s+uma?|ver)?\s*(imagem|desenho|ilustra[çc][ãa]o|visual|foto)/i,
          /\b(visualize?|represente?)\s+(visualmente|graficamente)?/i,
          /\b(como\s+seria|como\s+ficaria)\s+.*\s*(imagem|visual|desenho)/i,
          /\b(gerar|criar|produzir)\s+.*\s*(imagem|visual|desenho|ilustra[çc][ãa]o)/i,
          // Comandos em inglês
          /\b(generate|create|draw|make|show|illustrate)\s+(an?|the)?\s*(image|picture|drawing|illustration|visual|diagram)/i,
          // Padrões mais específicos
          /^(imagem|desenho|ilustra[çc][ãa]o|visual)\s+(de|do|da)/i,
          /\b(render|renderize)\s+/i,
        ];

        const isImageGeneration = imageGenerationPatterns.some((pattern) =>
          pattern.test(value)
        );

        if (isImageGeneration && onGenerateImage) {
          await onGenerateImage(value);
        } else {
          await onSubmit();
        }

        // Focus on textarea after sending
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      },
      [
        value,
        isLoading,
        selectedFiles,
        onSubmit,
        onUploadMultipleImages,
        onGenerateImage,
        handleRemoveAllImages,
      ]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      },
      [handleSubmit]
    );

    const handleImageButtonClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    const handleAudioButtonClick = useCallback(() => {
      audioInputRef.current?.click();
    }, []);

    return (
      <div className="relative">
        {/* Image Previews */}
        {previewImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="max-h-32 rounded-xl border-2 border-neutral-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-error-500 hover:bg-error-600 text-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {previewImages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAllImages}
                className="h-8 px-3 bg-error-500/20 hover:bg-error-500/30 text-error-300 text-xs"
              >
                Remover todas
              </Button>
            )}
          </div>
        )}

        {/* Form de input */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 focus-within:border-neutral-400 transition-all shadow-sm">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const validFiles: File[] = [];
                    const newPreviews: string[] = [];

                    files.forEach((file) => {
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast({
                          title: 'Arquivo inválido',
                          description: `${file.name} não é uma imagem.`,
                          variant: 'destructive',
                        });
                        return;
                      }

                      // Validate file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: 'Arquivo muito grande',
                          description: `${file.name} excede 10MB.`,
                          variant: 'destructive',
                        });
                        return;
                      }

                      validFiles.push(file);

                      // Create preview
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        newPreviews.push(event.target?.result as string);
                        if (newPreviews.length === validFiles.length) {
                          setPreviewImages((prev) => [...prev, ...newPreviews]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });

                    if (validFiles.length > 0) {
                      setSelectedFiles((prev) => [...prev, ...validFiles]);
                    }
                  }}
                  className="hidden"
                />

                {/* Hidden audio input */}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUploadAudio) {
                      onUploadAudio(file);
                      e.target.value = ''; // Reset input
                    }
                  }}
                  className="hidden"
                />

                {/* Image Upload Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImageButtonClick}
                  disabled={isLoading}
                  className="h-9 w-9 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  title="Enviar imagem"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>

                {/* Audio Upload Button */}
                {onUploadAudio && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAudioButtonClick}
                    disabled={isLoading}
                    className="h-9 w-9 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    title="Enviar áudio"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}

                {/* Sparkles indicator - visual only */}
                {value.trim() && (
                  <div className="flex items-center gap-1 text-neutral-400 text-xs">
                    <Sparkles className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={
                  (!value.trim() && selectedFiles.length === 0) || isLoading
                }
                className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-2 text-xs text-neutral-500 text-center">
            <span className="font-medium">Enter</span> para enviar •{' '}
            <span className="font-medium">Shift+Enter</span> para nova linha •{' '}
            <span className="font-medium">Ctrl+V</span> para colar imagem
          </div>
        </form>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
