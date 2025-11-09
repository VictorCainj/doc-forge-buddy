/**
 * Painel de insights emocionais para análise de mensagens
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Brain,
  Heart,
  Clock,
  AlertTriangle,
} from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageAnalysis } from '@/types/conversationProfile';

interface EmotionalInsightPanelProps {
  analysis: MessageAnalysis | null;
  isVisible: boolean;
  onToggle: () => void;
  suggestions?: string[];
}

const EmotionalInsightPanel = ({
  analysis,
  isVisible,
  onToggle,
  suggestions = [],
}: EmotionalInsightPanelProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['emotion'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'positive':
      case 'grateful':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
      case 'frustrated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'concerned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getFormalityColor = (formality: string) => {
    switch (formality) {
      case 'formal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'informal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'empathetic':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'friendly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'direct':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reassuring':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8)
      return { level: 'Alta', color: 'bg-green-100 text-green-800' };
    if (confidence >= 0.6)
      return { level: 'Média', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Baixa', color: 'bg-red-100 text-red-800' };
  };

  if (!analysis) {
    return (
      <div className="border-t border-neutral-200 bg-neutral-50">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-between p-4 h-auto"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">
              Análise Emocional
            </span>
          </div>
          {isVisible ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {isVisible && (
          <div className="px-4 pb-4">
            <p className="text-sm text-neutral-500 text-center py-4">
              Envie uma mensagem para ver a análise emocional
            </p>
          </div>
        )}
      </div>
    );
  }

  const confidenceInfo = getConfidenceLevel(analysis.confidence);

  return (
    <div className="border-t border-neutral-200 bg-neutral-50">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-between p-4 h-auto"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">
            Análise Emocional
          </span>
          <Badge className={confidenceInfo.color}>{confidenceInfo.level}</Badge>
        </div>
        {isVisible ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {isVisible && (
        <div className="px-4 pb-4 space-y-3">
          {/* Emoção */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>Emoção Detectada</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => toggleSection('emotion')}
                >
                  {expandedSections.has('emotion') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has('emotion') && (
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getEmotionColor(analysis.emotion)}>
                    {analysis.emotion}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Urgência */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Urgência</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => toggleSection('urgency')}
                >
                  {expandedSections.has('urgency') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has('urgency') && (
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getUrgencyColor(analysis.urgency)}>
                    {analysis.urgency === 'high' && 'Alta'}
                    {analysis.urgency === 'medium' && 'Média'}
                    {analysis.urgency === 'low' && 'Baixa'}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Formalidade */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span>📝</span>
                  <span>Formalidade</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => toggleSection('formality')}
                >
                  {expandedSections.has('formality') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has('formality') && (
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getFormalityColor(analysis.formality)}>
                    {analysis.formality === 'formal' && 'Formal'}
                    {analysis.formality === 'informal' && 'Informal'}
                    {analysis.formality === 'neutral' && 'Neutro'}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tom Sugerido */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span>🎭</span>
                  <span>Tom Sugerido</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => toggleSection('tone')}
                >
                  {expandedSections.has('tone') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has('tone') && (
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getToneColor(analysis.suggestedTone)}>
                    {analysis.suggestedTone === 'empathetic' && 'Empático'}
                    {analysis.suggestedTone === 'professional' &&
                      'Profissional'}
                    {analysis.suggestedTone === 'friendly' && 'Amigável'}
                    {analysis.suggestedTone === 'direct' && 'Direto'}
                    {analysis.suggestedTone === 'reassuring' &&
                      'Tranquilizador'}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Contexto */}
          {analysis.context && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>🔍</span>
                    <span>Contexto</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto"
                    onClick={() => toggleSection('context')}
                  >
                    {expandedSections.has('context') ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.has('context') && (
                <CardContent className="p-3 pt-0">
                  <p className="text-sm text-neutral-600">{analysis.context}</p>
                </CardContent>
              )}
            </Card>
          )}

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Sugestões</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto"
                    onClick={() => toggleSection('suggestions')}
                  >
                    {expandedSections.has('suggestions') ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.has('suggestions') && (
                <CardContent className="p-3 pt-0">
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-neutral-600 flex items-start gap-2"
                      >
                        <span className="text-neutral-400 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EmotionalInsightPanel;
