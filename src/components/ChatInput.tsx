import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Send, Loader2, Zap, Brain, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ChatMode {
  type: 'normal' | 'intelligent';
  title: string;
  description: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  currentMode: ChatMode;
  placeholder?: string;
  suggestions?: string[];
  isTyping?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
}

const ChatInput = memo(
  ({
    value,
    onChange,
    onSubmit,
    isLoading,
    currentMode,
    placeholder,
    suggestions = [],
    isTyping = false,
    connectionStatus = 'connected',
  }: ChatInputProps) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

    // Auto-resize textarea
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    }, [value]);

    // Mostrar sugestões após delay
    useEffect(() => {
      if (suggestions.length > 0 && value.trim()) {
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }

        suggestionTimeoutRef.current = setTimeout(() => {
          setShowSuggestions(true);
        }, 1000);
      } else {
        setShowSuggestions(false);
      }

      return () => {
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }
      };
    }, [suggestions, value]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() || isLoading) return;

        await onSubmit();

        // Focar no textarea após envio
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      },
      [value, isLoading, onSubmit]
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

    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
      },
      [onChange]
    );

    const getPlaceholder = () => {
      if (placeholder) return placeholder;

      switch (currentMode.type) {
        case 'normal':
          return 'Digite ou cole o texto que deseja corrigir...';
        case 'intelligent':
          return 'Digite ou cole o texto que deseja melhorar para clareza...';
        default:
          return 'Digite sua mensagem...';
      }
    };

    const getModeIcon = () => {
      switch (currentMode.type) {
        case 'normal':
          return <Brain className="h-4 w-4" />;
        case 'intelligent':
          return <Zap className="h-4 w-4" />;
        default:
          return <Brain className="h-4 w-4" />;
      }
    };

    const getConnectionStatusColor = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'text-green-500';
        case 'disconnected':
          return 'text-red-500';
        case 'reconnecting':
          return 'text-orange-500 animate-pulse';
        default:
          return 'text-gray-500';
      }
    };

    const getConnectionStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'Conectado';
        case 'disconnected':
          return 'Desconectado';
        case 'reconnecting':
          return 'Reconectando...';
        default:
          return '';
      }
    };

    return (
      <div className="relative">
        {/* Status da conexão */}
        <div className="flex items-center justify-between mb-2">
          {/* Badge do modo removido conforme solicitado */}

          {isTyping && (
            <Badge variant="outline" className="text-xs text-blue-600">
              Digitando...
            </Badge>
          )}
        </div>

        {/* Sugestões */}
        {/* Bloco de sugestões removido conforme solicitado */}

        {/* Form de input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="min-h-[60px] max-h-[120px] resize-none pr-12"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            {/* Contador de caracteres */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {value.length}/2000
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              !value.trim() || isLoading || connectionStatus === 'disconnected'
            }
            className="px-4 h-auto min-h-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Dica de atalho */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
