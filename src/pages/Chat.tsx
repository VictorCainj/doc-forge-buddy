import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Trash2 } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDualChat } from '@/hooks/useDualChat';
import DualChatMessage from '@/components/DualChatMessage';
import CentralInput from '@/components/CentralInput';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente principal do Chat Dual Locador/Locatário
 * Interface dividida em duas colunas com campo de entrada centralizado
 */
const Chat = () => {
  // Refs para scroll
  const locadorScrollRef = useRef<HTMLDivElement>(null);
  const locatarioScrollRef = useRef<HTMLDivElement>(null);

  // Hooks
  const navigate = useNavigate();
  const {
    dualMessages,
    isLoading,
    error,
    inputText,
    setInputText,
    dualChatState,
    sendDualMessage,
    sendDualAudio,
    sendDualImage,
    clearDualChat,
    saveCurrentSession,
    loadSession,
    currentSessionId,
  } = useDualChat();

  // Scroll automático para cada coluna
  const scrollToBottom = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom(locadorScrollRef);
      scrollToBottom(locatarioScrollRef);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [dualMessages.length, scrollToBottom]);

  // Função para lidar com envio de mensagem
  const handleSubmit = useCallback(
    async (text?: string) => {
      await sendDualMessage(text);
    },
    [sendDualMessage]
  );

  // Função para lidar com envio de áudio
  const handleAudioSubmit = useCallback(
    async (audioFile: File) => {
      await sendDualAudio(audioFile);
    },
    [sendDualAudio]
  );

  // Função para lidar com envio de imagem
  const handleImageSubmit = useCallback(
    async (file: File) => {
      await sendDualImage(file);
    },
    [sendDualImage]
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header minimalista */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-neutral-600 hover:bg-neutral-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-neutral-900">
                Chat Dual Locador/Locatário
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveCurrentSession}
                disabled={dualMessages.length === 0}
                className="text-neutral-600 hover:bg-neutral-100"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDualChat}
                disabled={dualMessages.length === 0}
                className="text-neutral-600 hover:bg-neutral-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Layout de duas colunas */}
      <div className="flex-1 flex">
        {/* Coluna Esquerda - Locador */}
        <div className="flex-1 flex flex-col border-r border-neutral-200">
          <div className="bg-white border-b border-neutral-200 px-6 py-3">
            <h2 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
              <span className="text-neutral-600">🏠</span>
              Locador
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50">
            <AnimatePresence>
              {dualMessages.map((message) => (
                <DualChatMessage
                  key={message.id}
                  message={message}
                  side="locador"
                  showGreeting={!dualChatState.hasUsedGreeting}
                />
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-neutral-600">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                  <span>Gerando resposta para locador...</span>
                </div>
              </div>
            )}

            <div ref={locadorScrollRef} />
          </div>
        </div>

        {/* Coluna Direita - Locatário */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-neutral-200 px-6 py-3">
            <h2 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
              <span className="text-neutral-600">👤</span>
              Locatário
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50">
            <AnimatePresence>
              {dualMessages.map((message) => (
                <DualChatMessage
                  key={message.id}
                  message={message}
                  side="locatario"
                  showGreeting={!dualChatState.hasUsedGreeting}
                />
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-neutral-600">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                  <span>Gerando resposta para locatário...</span>
                </div>
              </div>
            )}

            <div ref={locatarioScrollRef} />
          </div>
        </div>
      </div>

      {/* Campo de entrada centralizado */}
      <CentralInput
        onSendMessage={handleSubmit}
        onSendAudio={handleAudioSubmit}
        onUploadImage={handleImageSubmit}
        isLoading={isLoading}
        placeholder="Cole a mensagem ou imagem do WhatsApp..."
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-white border border-neutral-200 rounded-lg p-4 max-w-md shadow-lg">
          <div className="text-neutral-800 text-sm">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
