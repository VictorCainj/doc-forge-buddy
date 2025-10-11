import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  Loader2,
  MessageSquare,
  Menu,
  Plus,
  Save,
  Images,
} from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOptimizedChat } from '@/hooks/useOptimizedChat';
import { useClipboard } from '@/hooks/useClipboard';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatHistory from '@/components/ChatHistory';
import ImageGalleryModal from '@/components/ImageGalleryModal';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente principal do Chat com IA
 * Suporta mensagens de texto, imagens e áudios
 */
const Chat = () => {
  // Refs e estados locais
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Hooks otimizados
  const { copyToClipboard, copiedMessageId } = useClipboard();
  const navigate = useNavigate();

  // Hook principal do chat otimizado
  const {
    messages,
    isLoading,
    inputText,
    setInputText,
    sendMessage,
    retryMessage,
    clearChat,
    uploadImage,
    uploadMultipleImages,
    uploadAudio,
    generateImage,
    saveCurrentSession,
    loadSession,
    currentSessionId,
  } = useOptimizedChat();

  // Scroll automático para a última mensagem (otimizado)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Debounce do scroll para evitar múltiplas chamadas
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]); // Apenas quando o número de mensagens muda

  // Memoizar mensagens para evitar re-renders desnecessários
  const memoizedMessages = useMemo(() => messages, [messages]);

  // Extrair imagens das mensagens
  const chatImages = useMemo(() => {
    const images = messages
      .filter((msg) => msg.imageUrl || msg.imageData)
      .map((msg) => ({
        url: msg.imageUrl || msg.imageData || '',
        timestamp: msg.timestamp,
        messageId: msg.id,
      }));

    return images;
  }, [messages]);

  // Função para enviar imagem para o chat (reanálise)
  const handleSendImageToChat = useCallback(
    async (imageUrl: string) => {
      const imageMessage = messages.find(
        (msg) => msg.imageUrl === imageUrl || msg.imageData === imageUrl
      );
      if (imageMessage?.imageData) {
        // Usar uploadImage para processar novamente
        const file = await fetch(imageMessage.imageData)
          .then((r) => r.blob())
          .then((blob) => new File([blob], 'image.png', { type: 'image/png' }));
        uploadImage(file);
      }
    },
    [messages, uploadImage]
  );

  return (
    <div className="h-screen bg-neutral-50 flex relative overflow-hidden">
      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-72 bg-white border-r border-neutral-200 flex flex-col relative z-20 shadow-sm"
          >
            <div className="p-4 border-b border-neutral-200">
              <Button
                onClick={() => {
                  clearChat();
                  setShowSidebar(false);
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatHistory
                onSelectSession={(sessionId) => {
                  loadSession(sessionId);
                  setShowSidebar(false);
                }}
                currentSessionId={currentSessionId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header Minimalista */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-neutral-600 hover:bg-neutral-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-neutral-900 font-semibold">
                    DocForge AI
                  </h1>
                  <p className="text-xs text-neutral-500">
                    Assistente Universal
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (chatImages.length > 0) {
                    setSelectedImageIndex(0);
                    setShowImageGallery(true);
                  }
                }}
                disabled={chatImages.length === 0}
                className="text-neutral-600 hover:bg-neutral-100"
                title={`Ver ${chatImages.length} imagem(ns)`}
              >
                <Images className="h-4 w-4 mr-2" />
                Imagens ({chatImages.length})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={saveCurrentSession}
                disabled={messages.length === 0}
                className="text-neutral-600 hover:bg-neutral-100"
                title="Salvar conversa"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contratos')}
                className="text-neutral-600 hover:bg-neutral-100"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {memoizedMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
              >
                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
                  Como posso ajudar você hoje?
                </h2>
                <p className="text-neutral-600 max-w-md">
                  Converse sobre qualquer assunto, analise imagens ou crie
                  visualizações.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {memoizedMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={copyToClipboard}
                    onRetry={retryMessage}
                  />
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-700" />
                        <span className="text-sm text-neutral-900">
                          Pensando...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-neutral-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSubmit={sendMessage}
              onUploadImage={uploadImage}
              onUploadMultipleImages={uploadMultipleImages}
              onUploadAudio={uploadAudio}
              onGenerateImage={generateImage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {showImageGallery && chatImages.length > 0 && (
          <ImageGalleryModal
            images={chatImages}
            initialIndex={selectedImageIndex}
            onClose={() => setShowImageGallery(false)}
            onSendToChat={handleSendImageToChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
