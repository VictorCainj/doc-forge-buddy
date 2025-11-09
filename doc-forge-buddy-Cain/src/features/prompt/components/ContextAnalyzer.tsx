import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Lightbulb } from '@/lib/icons';
import type { EnhancedPrompt } from '../types/prompt';
import { memo, useMemo } from 'react';

interface ContextAnalyzerProps {
  prompt: EnhancedPrompt;
}

export const ContextAnalyzer = memo(({ prompt }: ContextAnalyzerProps) => {
  const { context, metadata } = prompt;

  // Calcular pontuação de qualidade com useMemo para evitar recálculos
  const qualityScore = useMemo(() => {
    let score = 0;
    let maxScore = 0;

    // Seções estruturadas (40 pontos)
    maxScore += 40;
    if (context.sections.length > 0) {
      score += Math.min(context.sections.length * 10, 40);
    }

    // Variáveis definidas (20 pontos)
    maxScore += 20;
    if (context.variables.length > 0) {
      score += Math.min(context.variables.length * 5, 20);
    }

    // Sugestões de melhorias (20 pontos)
    maxScore += 20;
    if (context.suggestedImprovements.length > 0) {
      score += Math.min(context.suggestedImprovements.length * 5, 20);
    }

    // Complexidade adequada (20 pontos)
    maxScore += 20;
    if (metadata.complexity === 'medium' || metadata.complexity === 'high') {
      score += 20;
    } else if (metadata.complexity === 'low') {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  }, [context.sections.length, context.variables.length, context.suggestedImprovements.length, metadata.complexity]);

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    return 'Precisa Melhorar';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold">Análise de Contexto</h3>
        </div>

        {/* Pontuação de qualidade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Qualidade do Prompt</span>
            <span className={`text-lg font-bold ${getQualityColor(qualityScore)}`}>
              {qualityScore}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                qualityScore >= 80
                  ? 'bg-green-500'
                  : qualityScore >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {getQualityLabel(qualityScore)}
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {context.sections.length}
            </div>
            <div className="text-xs text-muted-foreground">Seções</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {context.variables.length}
            </div>
            <div className="text-xs text-muted-foreground">Variáveis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {context.suggestedImprovements.length}
            </div>
            <div className="text-xs text-muted-foreground">Sugestões</div>
          </div>
        </div>

        {/* Indicadores */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            {context.sections.length > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm">
              {context.sections.length > 0
                ? 'Prompt estruturado em seções'
                : 'Prompt sem estruturação clara'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {context.variables.length > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm">
              {context.variables.length > 0
                ? 'Variáveis definidas para reutilização'
                : 'Nenhuma variável definida'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prompt.enhanced.length > 500 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm">
              {prompt.enhanced.length > 500
                ? 'Prompt detalhado e completo'
                : 'Prompt pode ser mais detalhado'}
            </span>
          </div>
        </div>

        {/* Dicas */}
        {context.suggestedImprovements.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Dicas de Melhoria</span>
            </div>
            <ul className="space-y-1">
              {context.suggestedImprovements.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
});

ContextAnalyzer.displayName = 'ContextAnalyzer';

