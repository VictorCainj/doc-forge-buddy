import { memo, useCallback, useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Loader2,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  retryCount?: number;
  status?: 'sending' | 'sent' | 'error' | 'retrying';
  error?: string;
  imageUrl?: string;
  imageData?: string;
  metadata?: {
    model?: string;
    tokens?: number;
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

    const [imageLoaded, setImageLoaded] = useState(false);

    const getStatusIcon = () => {
      switch (message.status) {
        case 'sending':
          return <Loader2 className="h-3 w-3 animate-spin" />;
        case 'error':
          return <AlertCircle className="h-3 w-3 text-red-500" />;
        case 'sent':
          return <Check className="h-3 w-3 text-green-500" />;
        case 'retrying':
          return <RotateCcw className="h-3 w-3 animate-spin text-orange-500" />;
        default:
          return null;
      }
    };

    const handleDownloadImage = useCallback(() => {
      if (message.imageUrl || message.imageData) {
        const link = document.createElement('a');
        link.href = message.imageUrl || message.imageData || '';
        link.download = `image-${message.id}.png`;
        link.click();
      }
    }, [message.imageUrl, message.imageData, message.id]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}
      >
        {message.role === 'assistant' && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        <div
          className={`max-w-[75%] rounded-2xl px-4 py-3 transition-all duration-200 ${
            message.role === 'user'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
          }`}
        >
          <div className="flex flex-col gap-2">
            {/* Image Display */}
            {(message.imageUrl || message.imageData) && (
              <div className="relative rounded-xl overflow-hidden mb-2 max-w-md">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                )}
                <img
                  src={message.imageUrl || message.imageData}
                  alt="Imagem enviada"
                  className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => window.open(message.imageUrl || message.imageData, '_blank')}
                  title="Clique para abrir em tamanho real"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(message.imageUrl || message.imageData, '_blank')}
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                    title="Visualizar em tamanho real"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadImage}
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                    title="Baixar imagem"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Text Content with Markdown */}
            {message.content && (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customizar estilos dos elementos Markdown
                    h1: ({ ...props }) => (
                      <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2 className="text-lg font-bold text-white mb-2 mt-3" {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h3 className="text-base font-bold text-white mb-2 mt-3" {...props} />
                    ),
                    h4: ({ ...props }) => (
                      <h4 className="text-sm font-bold text-white mb-2 mt-2" {...props} />
                    ),
                    p: ({ ...props }) => (
                      <p className="text-sm leading-relaxed mb-3 text-white" {...props} />
                    ),
                    strong: ({ ...props }) => (
                      <strong className="font-bold text-blue-200" {...props} />
                    ),
                    em: ({ ...props }) => (
                      <em className="italic text-blue-100" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc ml-4 mb-3 space-y-1.5" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="list-decimal ml-4 mb-3 space-y-1.5" {...props} />
                    ),
                    li: ({ ...props }) => (
                      <li className="text-sm text-white ml-1" {...props} />
                    ),
                    code: ({ inline, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
                      inline ? (
                        <code
                          className="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-black/30 p-3 rounded-lg text-blue-300 text-xs font-mono overflow-x-auto mb-2"
                          {...props}
                        />
                      ),
                    pre: ({ ...props }) => (
                      <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto mb-2" {...props} />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-blue-400 pl-4 italic text-blue-100 my-2"
                        {...props}
                      />
                    ),
                    a: ({ ...props }) => (
                      <a
                        className="text-blue-300 hover:text-blue-200 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                    hr: ({ ...props }) => (
                      <hr className="border-white/20 my-4" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Error Display */}
            {message.error && (
              <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{message.error}</span>
                </div>
              </div>
            )}

            {/* Status and Metadata */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>
                {message.metadata?.model && (
                  <span className="text-xs opacity-50">
                    • {message.metadata.model}
                  </span>
                )}
                {getStatusIcon()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {message.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-white/10"
                    onClick={handleRetry}
                    title="Tentar novamente"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-white/10"
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
          </div>
        </div>

        {message.role === 'user' && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
