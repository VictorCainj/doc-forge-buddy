// @ts-nocheck
import { useState, useEffect } from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useToast } from '@/hooks/use-toast';
import type { UserPreferences } from '@/hooks/useAIMemory';

const AI_PROFILES = {
  professional: {
    name: 'Profissional',
    formality: 'formal' as const,
    verbosity: 'balanced' as const,
    responseStyle: 'structured' as const,
  },
  casual: {
    name: 'Casual',
    formality: 'casual' as const,
    verbosity: 'balanced' as const,
    responseStyle: 'conversational' as const,
  },
  technical: {
    name: 'Técnico',
    formality: 'neutral' as const,
    verbosity: 'detailed' as const,
    responseStyle: 'technical' as const,
  },
  creative: {
    name: 'Criativo',
    formality: 'casual' as const,
    verbosity: 'detailed' as const,
    responseStyle: 'conversational' as const,
  },
};

export const AIPersonalizationPanel = () => {
  const { memory, updatePreferences } = useAIMemory('default');
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    formality: 'neutral',
    verbosity: 'balanced',
    responseStyle: 'conversational',
    language: 'pt-BR',
  });

  useEffect(() => {
    if (memory?.preferences) {
      setPreferences(memory.preferences);
    }
  }, [memory]);

  const applyProfile = (profileKey: keyof typeof AI_PROFILES) => {
    const profile = AI_PROFILES[profileKey];
    const newPrefs = {
      ...preferences,
      formality: profile.formality,
      verbosity: profile.verbosity,
      responseStyle: profile.responseStyle,
    };
    setPreferences(newPrefs);
    updatePreferences(newPrefs);
    
    toast({
      title: `Perfil ${profile.name} aplicado`,
      description: 'A IA agora responderá com esse estilo.',
    });
  };

  const handleSave = () => {
    updatePreferences(preferences);
    toast({
      title: 'Preferências salvas',
      description: 'A IA foi personalizada conforme suas preferências.',
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Settings className="h-4 w-4 mr-2" />
        Personalizar IA
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-6 w-96 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Personalizar IA
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          ✕
        </Button>
      </div>

      {/* Perfis Predefinidos */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Perfis Rápidos</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(AI_PROFILES).map(([key, profile]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => applyProfile(key as keyof typeof AI_PROFILES)}
              className="text-xs"
            >
              {profile.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Formalidade */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">Formalidade</Label>
        <Select
          value={preferences.formality}
          onValueChange={(value) =>
            setPreferences({ ...preferences, formality: value as UserPreferences['formality'] })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verbosidade */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">Detalhamento</Label>
        <Select
          value={preferences.verbosity}
          onValueChange={(value) =>
            setPreferences({ ...preferences, verbosity: value as UserPreferences['verbosity'] })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concise">Conciso</SelectItem>
            <SelectItem value="balanced">Equilibrado</SelectItem>
            <SelectItem value="detailed">Detalhado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estilo de Resposta */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Estilo de Resposta</Label>
        <Select
          value={preferences.responseStyle}
          onValueChange={(value) =>
            setPreferences({ ...preferences, responseStyle: value as UserPreferences['responseStyle'] })
          }
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conversational">Conversacional</SelectItem>
            <SelectItem value="structured">Estruturado</SelectItem>
            <SelectItem value="technical">Técnico</SelectItem>
            <SelectItem value="simple">Simples</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Salvar Preferências
        </Button>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};
