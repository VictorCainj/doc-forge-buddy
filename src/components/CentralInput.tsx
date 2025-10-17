/**
 * Componente de entrada centralizada para o chat dual
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Square } from '@/utils/iconMapper';
import { motion, AnimatePresence } from 'framer-motion';

interface CentralInputProps {
  onSendMessage: (message: string) => void;
  onSendAudio: (audioBlob: Blob) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const CentralInput = ({
  onSendMessage,
  onSendAudio,
  isLoading = false,
  placeholder = 'Cole a mensagem recebida do locador/locatário...',
}: CentralInputProps) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputText.trim() && !isLoading) {
        onSendMessage(inputText.trim());
        setInputText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [inputText, isLoading, onSendMessage]
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-10">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          {/* Campo de texto */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[200px] resize-none pr-12"
              disabled={isLoading}
            />

            {/* Botão de gravação */}
            <div className="absolute bottom-2 right-2">
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
            disabled={(!inputText.trim() && !isRecording) || isLoading}
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

        {/* Indicador de gravação */}
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
      </div>
    </div>
  );
};

export default CentralInput;
