import { useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  MessageSquare,
} from '@/utils/iconMapper';
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
    dualChatState,
    sendDualMessage,
    sendDualAudio,
    sendDualImage,
    clearDualChat,
    saveCurrentSession,
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header profissional com Material Design 3 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-slate-200/60 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-full h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                  <MessageSquare className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                    Chat Dual
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Locador & Locatário
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveCurrentSession}
                disabled={dualMessages.length === 0}
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-full h-10 w-10 disabled:opacity-50"
                title="Salvar conversa"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDualChat}
                disabled={dualMessages.length === 0}
                className="text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-200 rounded-full h-10 w-10 disabled:opacity-50"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Layout de duas colunas com design profissional */}
      <div className="flex-1 flex">
        {/* Coluna Esquerda - Locador */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col border-r border-slate-200/60"
        >
          <div className="bg-white border-b border-slate-200/60 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Locador
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Proprietário do imóvel
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <AnimatePresence>
              {dualMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DualChatMessage
                    message={message}
                    side="locador"
                    showGreeting={!dualChatState.hasUsedGreeting}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12"
              >
                <div className="flex items-center gap-4 text-slate-600 bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                  <span className="font-medium">
                    Gerando resposta para locador...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={locadorScrollRef} />
          </div>
        </motion.div>

        {/* Coluna Direita - Locatário */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-white border-b border-slate-200/60 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Locatário
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Inquilino do imóvel
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <AnimatePresence>
              {dualMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DualChatMessage
                    message={message}
                    side="locatario"
                    showGreeting={!dualChatState.hasUsedGreeting}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12"
              >
                <div className="flex items-center gap-4 text-slate-600 bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                  <span className="font-medium">
                    Gerando resposta para locatário...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={locatarioScrollRef} />
          </div>
        </motion.div>
      </div>

      {/* Campo de entrada centralizado */}
      <CentralInput
        onSendMessage={handleSubmit}
        onSendAudio={handleAudioSubmit}
        onUploadImage={handleImageSubmit}
        isLoading={isLoading}
        placeholder="Cole a mensagem ou imagem do WhatsApp..."
      />

      {/* Mensagem de erro profissional */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 right-6 bg-white border border-red-200/60 rounded-xl p-4 max-w-md shadow-lg z-50"
        >
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-xs">⚠</span>
            </div>
            <div className="text-slate-800 text-sm">
              <div className="font-semibold text-red-600 mb-1">Erro</div>
              <div className="text-slate-600">{error}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chat;
