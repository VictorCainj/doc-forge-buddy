import { useState, lazy, Suspense, useMemo, useCallback, useEffect } from 'react';
import { PromptBuilder } from '@/features/prompt/components/PromptBuilder';
import { Loader2 } from 'lucide-react';
import type { EnhancedPrompt } from '@/features/prompt/types/prompt';
import { usePromptEnhancer } from '@/features/prompt/hooks/usePromptEnhancer';

// Lazy loading granular para componentes não críticos
const PromptPreview = lazy(() =>
  import('@/features/prompt/components/PromptPreview').then((module) => ({
    default: module.PromptPreview,
  }))
);

const ContextAnalyzer = lazy(() =>
  import('@/features/prompt/components/ContextAnalyzer').then((module) => ({
    default: module.ContextAnalyzer,
  }))
);

const PromptTemplates = lazy(() =>
  import('@/features/prompt/components/PromptTemplates').then((module) => ({
    default: module.PromptTemplates,
  }))
);

const PromptHistory = lazy(() =>
  import('@/features/prompt/components/PromptHistory').then((module) => ({
    default: module.PromptHistory,
  }))
);

// Componente de fallback otimizado
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8" aria-label="Carregando componente">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const Prompt = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const { enhancedPrompt, saveToHistory } = usePromptEnhancer();

  // Memoizar callbacks para evitar re-renders desnecessários
  const handlePromptEnhanced = useCallback((prompt: string) => {
    setSelectedPrompt(prompt);
  }, []);

  const handleUseTemplate = useCallback((template: string) => {
    setSelectedPrompt(template);
  }, []);

  const handleSavePrompt = useCallback(
    async (prompt: EnhancedPrompt) => {
      await saveToHistory(prompt);
    },
    [saveToHistory]
  );

  // Memoizar componente condicional para evitar re-renders
  const selectedPromptContent = useMemo(() => {
    if (!selectedPrompt || enhancedPrompt) return null;
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground mb-2">
          Prompt selecionado do histórico/template:
        </p>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {selectedPrompt}
        </pre>
      </div>
    );
  }, [selectedPrompt, enhancedPrompt]);

  // Prefetch de componentes quando o usuário interage com a página
  useEffect(() => {
    // Prefetch de componentes críticos após carga inicial
    const timer = setTimeout(() => {
      import('@/features/prompt/components/PromptPreview');
      import('@/features/prompt/components/ContextAnalyzer');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Atualizar meta tags SEO dinamicamente
  useEffect(() => {
    document.title = 'Construtor de Prompts - Doc Forge Buddy';
    
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, value);
      } else {
        // Criar elemento se não existir
        const meta = document.createElement('meta');
        if (selector.includes('property')) {
          meta.setAttribute('property', selector.split('[')[1].split('=')[1].replace(/"]/g, ''));
        } else {
          meta.setAttribute('name', selector.split('[')[1].split('=')[1].replace(/"]/g, ''));
        }
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }
    };

    updateMetaTag('meta[name="description"]', 'content', 'Transforme suas ideias em prompts completos e estruturados com IA. Crie prompts profissionais para diversas tarefas.');
    updateMetaTag('meta[name="keywords"]', 'content', 'prompts, IA, inteligência artificial, templates, automação');
    updateMetaTag('meta[property="og:title"]', 'content', 'Construtor de Prompts - Doc Forge Buddy');
    updateMetaTag('meta[property="og:description"]', 'content', 'Transforme suas ideias em prompts completos e estruturados com IA');
    updateMetaTag('meta[property="og:url"]', 'content', `${window.location.origin}/prompt`);
    updateMetaTag('meta[name="robots"]', 'content', 'index, follow');

    return () => {
      document.title = 'doc-forge-buddy';
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Construtor de Prompts</h1>
          <p className="text-muted-foreground mt-2">
            Transforme suas ideias em prompts completos e estruturados com IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Área principal - 2 colunas */}
          <div className="lg:col-span-2 space-y-6">
            <PromptBuilder onPromptEnhanced={handlePromptEnhanced} />

            {enhancedPrompt && (
              <Suspense fallback={<ComponentLoader />}>
                <PromptPreview prompt={enhancedPrompt} onSave={handleSavePrompt} />
                <ContextAnalyzer prompt={enhancedPrompt} />
              </Suspense>
            )}

            {selectedPromptContent}
          </div>

          {/* Sidebar - 1 coluna com lazy loading */}
          <div className="space-y-6">
            <Suspense fallback={<ComponentLoader />}>
              <PromptTemplates onUseTemplate={handleUseTemplate} />
              <PromptHistory onSelectPrompt={handlePromptEnhanced} />
            </Suspense>
          </div>
        </div>
      </div>
  );
};

export default Prompt;

