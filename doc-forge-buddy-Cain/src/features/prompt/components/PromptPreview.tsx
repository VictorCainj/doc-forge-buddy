import { useState, useCallback, memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Save, ChevronDown, ChevronUp, Check } from '@/lib/icons';
import type { EnhancedPrompt } from '../types/prompt';
import { toast } from 'sonner';

interface PromptPreviewProps {
  prompt: EnhancedPrompt;
  onSave?: (prompt: EnhancedPrompt) => void;
}

export const PromptPreview = memo(({ prompt, onSave }: PromptPreviewProps) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set()
  );
  const [copied, setCopied] = useState(false);

  const toggleSection = useCallback((index: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt.enhanced);
      setCopied(true);
      toast.success('Prompt copiado para a área de transferência');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  }, [prompt.enhanced]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(prompt);
    }
  }, [prompt, onSave]);

  const getComplexityColor = useCallback((complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const complexityColor = useMemo(
    () => getComplexityColor(prompt.metadata.complexity),
    [prompt.metadata.complexity, getComplexityColor]
  );

  const complexityLabel = useMemo(() => {
    const complexity = prompt.metadata.complexity;
    return complexity === 'low'
      ? 'Baixa'
      : complexity === 'medium'
      ? 'Média'
      : 'Alta';
  }, [prompt.metadata.complexity]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prompt Expandido</h3>
          <div className="flex items-center gap-2">
            <Badge className={complexityColor}>
              {complexityLabel} Complexidade
            </Badge>
            <Badge variant="outline">
              ~{prompt.metadata.tokenCount} tokens
            </Badge>
          </div>
        </div>

        {/* Prompt completo */}
        <div className="space-y-2">
          <div className="bg-muted rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {prompt.enhanced}
            </pre>
          </div>
        </div>

        {/* Seções estruturadas */}
        {prompt.context.sections.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Seções Estruturadas</h4>
            {prompt.context.sections.map((section, index) => (
              <div key={index} className="border rounded-lg">
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{section.title}</span>
                  {collapsedSections.has(index) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.has(index) && (
                  <div className="p-3 pt-0 border-t bg-muted/50">
                    <pre className="whitespace-pre-wrap text-sm">
                      {section.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Variáveis */}
        {prompt.context.variables.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Variáveis Disponíveis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {prompt.context.variables.map((variable, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 bg-muted/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {variable.name}
                    </code>
                    {variable.required && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {variable.description}
                  </p>
                  {variable.example && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Exemplo: {variable.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões de melhorias */}
        {prompt.context.suggestedImprovements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Sugestões de Melhorias</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {prompt.context.suggestedImprovements.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Prompt
              </>
            )}
          </Button>
          {onSave && (
            <Button onClick={handleSave} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar no Histórico
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

PromptPreview.displayName = 'PromptPreview';

