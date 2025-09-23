import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Brain,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useClipboard } from '@/hooks/useClipboard';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isCorrected?: boolean;
  isImproved?: boolean;
}

const Chat = () => {
  // Estados principais
  const [inputText, setInputText] = useState('');
  const [isImprovementMode, setIsImprovementMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para mensagens
  const [messages, setMessages] = useState<Message[]>([]);

  // Hooks básicos
  const { toast } = useToast();
  const { correctText, improveText, isLoading } = useOpenAI();
  const { copyToClipboard, copiedMessageId } = useClipboard();
  const navigate = useNavigate();

  // Inicializar mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: isImprovementMode
          ? 'Olá! Sou seu assistente inteligente para melhoria de textos. Posso ajudar a melhorar a clareza, estrutura e impacto dos seus textos. Cole ou digite o texto que deseja melhorar!'
          : 'Olá! Sou seu assistente para correção de textos. Posso ajudar com gramática, ortografia e estilo. Cole ou digite o texto que deseja corrigir!',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isImprovementMode, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      let processedText: string;
      let messageType: 'corrected' | 'improved';

      if (isImprovementMode) {
        processedText = await improveText(inputText.trim());
        messageType = 'improved';
      } else {
        processedText = await correctText(inputText.trim());
        messageType = 'corrected';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: processedText,
        role: 'assistant',
        timestamp: new Date(),
        isCorrected: messageType === 'corrected',
        isImproved: messageType === 'improved',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: isImprovementMode
          ? 'Desculpe, ocorreu um erro ao melhorar o texto. Tente novamente.'
          : 'Desculpe, ocorreu um erro ao corrigir o texto. Tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: isImprovementMode ? 'Erro na melhoria' : 'Erro na correção',
        description: isImprovementMode
          ? 'Não foi possível melhorar o texto. Verifique sua conexão e tente novamente.'
          : 'Não foi possível corrigir o texto. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputText('');
    toast({
      title: 'Conversa limpa',
      description: 'A conversa foi limpa com sucesso.',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                    {/* Modo Normal */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-1 h-auto transition-all duration-300 ${
                        !isImprovementMode
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => {
                        setIsImprovementMode(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4" />
                        <span className="text-sm font-medium">Normal</span>
                      </div>
                    </Button>

                    {/* Modo Inteligente */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-1 h-auto transition-all duration-300 ${
                        isImprovementMode
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => {
                        setIsImprovementMode(true);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {isImprovementMode && (
                          <div className="relative">
                            <Zap className="h-4 w-4 animate-pulse" />
                            <div className="absolute inset-0">
                              <Zap className="h-4 w-4 text-primary/30 animate-ping" />
                            </div>
                          </div>
                        )}
                        {!isImprovementMode && <Zap className="h-4 w-4" />}
                        <span className="text-sm font-medium">Inteligente</span>
                      </div>
                    </Button>
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
                    onClick={handleClearChat}
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
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed select-text cursor-text">
                            {message.content}
                          </p>
                          {message.isCorrected && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Texto corrigido
                            </Badge>
                          )}
                          {message.isImproved && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Texto melhorado
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            message.role === 'user'
                              ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          onClick={() =>
                            copyToClipboard(message.content, message.id)
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
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
                          {isImprovementMode
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
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isImprovementMode
                        ? 'Digite ou cole o texto que deseja melhorar para clareza...'
                        : 'Digite ou cole o texto que deseja corrigir...'
                    }
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
