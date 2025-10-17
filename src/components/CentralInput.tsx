/**
 * Componente de entrada centralizada para o chat dual
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  MicOff,
  Send,
  Square,
  Image as ImageIcon,
  X,
} from '@/utils/iconMapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface CentralInputProps {
  onSendMessage: (message: string) => void;
  onSendAudio: (audioBlob: Blob) => void;
  onUploadImage?: (file: File) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

const CentralInput = ({
  onSendMessage,
  onSendAudio,
  onUploadImage,
  isLoading = false,
  placeholder = 'Cole a mensagem ou imagem do WhatsApp...',
}: CentralInputProps) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      // Handle multiple images upload
      if (selectedFiles.length > 0 && onUploadImage) {
        for (const file of selectedFiles) {
          await onUploadImage(file);
        }
        handleRemoveAllImages();
        return;
      }

      // Handle text message
      if (inputText.trim() && !isLoading) {
        onSendMessage(inputText.trim());
        setInputText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [
      inputText,
      isLoading,
      onSendMessage,
      selectedFiles,
      onUploadImage,
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

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    },
    []
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        onSendAudio(audioBlob);
        setAudioChunks([]);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  }, [onSendAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-10">
      <div className="max-w-4xl mx-auto">
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

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          {/* Campo de texto */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[200px] resize-none pr-20"
              disabled={isLoading}
            />

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

            {/* Botões de ação */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {/* Image Upload Button */}
              {onUploadImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImageButtonClick}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-600"
                  title="Enviar imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              )}

              {/* Botão de gravação */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                disabled={isLoading}
                className={`h-8 w-8 p-0 ${
                  isRecording
                    ? 'text-neutral-600 hover:text-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-600'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="stop"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <Square className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                    >
                      <Mic className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Botão de enviar */}
          <Button
            type="submit"
            disabled={
              (!inputText.trim() &&
                !isRecording &&
                selectedFiles.length === 0) ||
              isLoading
            }
            className="h-[60px] px-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Gerando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span>Enviar</span>
              </div>
            )}
          </Button>
        </form>

        {/* Indicadores */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 flex items-center gap-2 text-sm text-neutral-600"
            >
              <div className="h-2 w-2 bg-neutral-500 rounded-full animate-pulse" />
              <span>Gravando áudio... Clique no quadrado para parar</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        <div className="mt-2 text-xs text-neutral-500 text-center">
          <span className="font-medium">Enter</span> para enviar •{' '}
          <span className="font-medium">Shift+Enter</span> para nova linha •{' '}
          <span className="font-medium">Ctrl+V</span> para colar imagem
        </div>
      </div>
    </div>
  );
};

export default CentralInput;
