import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Menu,
  Plus,
  Save,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOptimizedChat } from '@/hooks/useOptimizedChat';
import { useClipboard } from '@/hooks/useClipboard';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatHistory from '@/components/ChatHistory';
import ImageGalleryModal from '@/components/ImageGalleryModal';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
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
      .filter(msg => msg.imageUrl || msg.imageData)
      .map(msg => ({
        url: msg.imageUrl || msg.imageData || '',
        timestamp: msg.timestamp,
        messageId: msg.id,
      }));
    
    return images;
  }, [messages]);

  // Função para enviar imagem para o chat (reanálise)
  const handleSendImageToChat = useCallback(async (imageUrl: string) => {
    const imageMessage = messages.find(msg => msg.imageUrl === imageUrl || msg.imageData === imageUrl);
    if (imageMessage?.imageData) {
      // Usar uploadImage para processar novamente
      const file = await fetch(imageMessage.imageData)
        .then(r => r.blob())
        .then(blob => new File([blob], 'image.png', { type: 'image/png' }));
      uploadImage(file);
    }
  }, [messages, uploadImage]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-white/30 rounded-lg -rotate-45"></div>
      </div>

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-72 bg-slate-900/95 backdrop-blur-xl border-r border-blue-400/30 flex flex-col relative z-20 shadow-lg"
          >
            <div className="p-4 border-b border-blue-400/30">
              <Button
                onClick={() => {
                  clearChat();
                  setShowSidebar(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
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
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-b border-blue-400/30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold">DocForge AI</h1>
                  <p className="text-xs text-blue-200">Assistente Universal</p>
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
                className="text-slate-700 hover:bg-blue-100/50"
                title={`Ver ${chatImages.length} imagem(ns)`}
              >
                <Images className="h-4 w-4 mr-2" />
                Ver Imagens ({chatImages.length})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={saveCurrentSession}
                disabled={messages.length === 0}
                className="text-slate-700 hover:bg-blue-100/50"
                title="Salvar conversa"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contratos')}
                className="text-slate-700 hover:bg-blue-100/50"
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
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Como posso ajudar você hoje?
                </h2>
                <p className="text-blue-200 mb-8 max-w-md">
                  Converse sobre qualquer assunto, analise imagens ou crie visualizações.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputText('Me ajude com uma análise detalhada')}
                    className="bg-white/10 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-left hover:bg-white/20 hover:border-blue-400/60 transition-all shadow-sm"
                  >
                    <MessageSquare className="h-5 w-5 text-blue-400 mb-2" />
                    <p className="text-white font-medium mb-1">Conversação Inteligente</p>
                    <p className="text-sm text-blue-200">Tire dúvidas e converse sobre qualquer tema</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputText('Gere uma imagem de um contrato moderno')}
                    className="bg-white/10 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 text-left hover:bg-white/20 hover:border-blue-400/60 transition-all shadow-sm"
                  >
                    <ImageIcon className="h-5 w-5 text-blue-300 mb-2" />
                    <p className="text-white font-medium mb-1">Geração de Imagens</p>
                    <p className="text-sm text-blue-200">Crie visualizações e diagramas</p>
                  </motion.button>
                </div>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-blue-400/30 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        <span className="text-sm text-white">Pensando...</span>
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
        <div className="bg-slate-900/80 backdrop-blur-xl border-t border-blue-400/30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSubmit={sendMessage}
              onUploadImage={uploadImage}
              onUploadMultipleImages={uploadMultipleImages}
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
