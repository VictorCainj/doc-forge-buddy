import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  Loader2,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Brain,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useOptimizedChat } from '@/hooks/useOptimizedChat';
import { useToast } from '@/hooks/use-toast';
import { useClipboard } from '@/hooks/useClipboard';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

const Chat = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [_showStats, _setShowStats] = useState(false);

  // Hooks otimizados
  const _toast = useToast();
  const { copyToClipboard, copiedMessageId } = useClipboard();
  const navigate = useNavigate();

  // Hook principal do chat otimizado
  const {
    messages,
    currentMode,
    isLoading,
    error: _error,
    inputText,
    setInputText,
    setMode,
    sendMessage,
    correctTextAction, // Destructure new action
    retryMessage,
    clearChat,
    getSuggestions,
    isTyping,
    connectionStatus,
  } = useOptimizedChat();

  // Scroll automático para a última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Obter sugestões contextuais
  const suggestions = useMemo(() => getSuggestions(), [getSuggestions]);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex-1 flex flex-col">
          {/* Info Card */}
          <Card className="glass-card mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Conversa com Assistente
                  </CardTitle>
                  {/* Modos de Operação */}
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                    {/* Modos de Chat */}
                    {[
                      { type: 'normal', title: 'Normal', icon: Brain },
                      { type: 'intelligent', title: 'Inteligente', icon: Zap },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isActive = currentMode.type === mode.type;

                      return (
                        <Button
                          key={mode.type}
                          variant="ghost"
                          size="sm"
                          className={`px-3 py-1 h-auto transition-all duration-300 ${
                            isActive
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                          onClick={() =>
                            setMode({
                              type: mode.type as 'normal' | 'intelligent',
                              title: mode.title,
                              description:
                                mode.type === 'normal'
                                  ? 'Correção de gramática'
                                  : 'Melhoria de clareza',
                            })
                          }
                        >
                          <div className="flex items-center space-x-2">
                            {isActive && mode.type === 'intelligent' ? (
                              <div className="relative">
                                <Icon className="h-4 w-4 animate-pulse" />
                                <div className="absolute inset-0">
                                  <Icon className="h-4 w-4 text-primary/30 animate-ping" />
                                </div>
                              </div>
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                              {mode.title}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center space-x-2">
                  {/* Botão Voltar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="h-8 px-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 w-8 p-0"
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chat Interface */}
          <Card className="glass-card flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    copiedMessageId={copiedMessageId}
                    onCopy={copyToClipboard}
                    onRetry={retryMessage}
                  />
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {currentMode.type === 'intelligent'
                            ? 'Melhorando texto...'
                            : 'Corrigindo texto...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-3 sm:p-4">
                <ChatInput
                  value={inputText}
                  onChange={setInputText}
                  onSubmit={sendMessage}
                  onCorrectText={correctTextAction} // Pass the new action
                  isLoading={isLoading}
                  currentMode={currentMode}
                  suggestions={suggestions}
                  isTyping={isTyping}
                  connectionStatus={connectionStatus}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
