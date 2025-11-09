import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sparkles, Wand2, Loader2 } from '@/lib/icons';
import { usePromptEnhancer } from '../hooks/usePromptEnhancer';

interface PromptBuilderProps {
  onPromptEnhanced?: (prompt: string) => void;
}

export const PromptBuilder = memo(({ onPromptEnhanced }: PromptBuilderProps) => {
  const [input, setInput] = useState('');
  const { enhance, enhancedPrompt, isLoading } = usePromptEnhancer();

  const handleEnhance = useCallback(async () => {
    if (!input.trim()) {
      return;
    }

    try {
      const result = await enhance({
        userInput: input.trim(),
        options: {
          detailLevel: 'detailed',
          tone: 'professional',
          language: 'pt-BR',
        },
      });

      if (result && onPromptEnhanced) {
        onPromptEnhanced(result.enhanced);
      }
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao expandir prompt:', error);
    }
  }, [input, enhance, onPromptEnhanced]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleEnhance();
      }
    },
    [handleEnhance]
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold">Construtor de Prompts</h2>
        </div>

        <Textarea
          placeholder="Digite sua solicitação curta... Ex: 'Criar email profissional para cliente' ou 'Gerar relatório de vistoria'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          className="resize-none"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {input.length > 0 ? `${input.length} caracteres` : 'Digite sua solicitação acima'}
          </p>
          <Button
            onClick={handleEnhance}
            disabled={isLoading || !input.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Expandindo...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Expandir Prompt
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Dica: Pressione Ctrl+Enter (ou Cmd+Enter no Mac) para expandir rapidamente
        </div>
      </div>
    </Card>
  );
});

PromptBuilder.displayName = 'PromptBuilder';
