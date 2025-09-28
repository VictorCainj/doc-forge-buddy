import { memo, useCallback } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  Zap,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isCorrected?: boolean;
  isImproved?: boolean;
  isAnalysis?: boolean;
  retryCount?: number;
  status?: 'sending' | 'sent' | 'error' | 'retrying';
  error?: string;
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
    suggestions?: string[];
  };
}

interface ChatMessageProps {
  message: Message;
  copiedMessageId: string | null;
  onCopy: (text: string, messageId: string) => void;
  onRetry?: (messageId: string) => void;
}

const ChatMessage = memo(
  ({ message, copiedMessageId, onCopy, onRetry }: ChatMessageProps) => {
    const formatTime = useCallback((date: Date) => {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }, []);

    const handleCopy = useCallback(() => {
      onCopy(message.content, message.id);
    }, [message.content, message.id, onCopy]);

    const handleRetry = useCallback(() => {
      if (onRetry) {
        onRetry(message.id);
      }
    }, [message.id, onRetry]);

    const getStatusIcon = () => {
      switch (message.status) {
        case 'sending':
          return <Loader2 className="h-3 w-3 animate-spin" />;
        case 'error':
          return <AlertCircle className="h-3 w-3 text-red-500" />;
        case 'sent':
          return <CheckCircle2 className="h-3 w-3 text-green-500" />;
        case 'retrying':
          return <RotateCcw className="h-3 w-3 animate-spin text-orange-500" />;
        default:
          return null;
      }
    };

    const getStatusColor = () => {
      switch (message.status) {
        case 'error':
          return 'border-red-200 bg-red-50';
        case 'retrying':
          return 'border-orange-200 bg-orange-50';
        default:
          return message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50 text-foreground';
      }
    };

    return (
      <div
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
          className={`max-w-[80%] rounded-lg px-4 py-3 border transition-all duration-200 ${getStatusColor()}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="whitespace-pre-wrap text-sm leading-relaxed select-text cursor-text">
                {message.content}
              </p>

              {message.error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                  {message.error}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                {message.isCorrected && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Texto corrigido
                  </Badge>
                )}
                {message.isImproved && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Texto melhorado
                  </Badge>
                )}
                {/* Removido: badge de análise de contratos */}

                {getStatusIcon()}
              </div>

              {message.metadata?.confidence && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Confiança: {Math.round(message.metadata.confidence * 100)}%
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {message.status === 'error' && onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                  onClick={handleRetry}
                  title="Tentar novamente"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${
                  message.role === 'user'
                    ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={handleCopy}
                title="Copiar mensagem"
              >
                {copiedMessageId === message.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div
            className={`text-xs mt-2 flex items-center justify-between ${
              message.role === 'user'
                ? 'text-primary-foreground/70'
                : 'text-muted-foreground'
            }`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {message.retryCount && message.retryCount > 0 && (
              <span className="text-orange-600">
                Tentativa {message.retryCount + 1}
              </span>
            )}
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
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
