import React, { useState, useEffect, useCallback } from 'react';

/**
 * Sistema de pré-carregamento inteligente para componentes críticos
 * Identifica padrões de uso e pré-carrega automaticamente
 */

interface PreloadStrategy {
  id: string;
  trigger: 'idle' | 'interaction' | 'route' | 'predicted';
  delay?: number;
  dependencies: string[];
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface PreloadManager {
  preloadComponent: (id: string) => Promise<void>;
  preloadBundle: (components: string[]) => Promise<void>;
  isPreloaded: (id: string) => boolean;
  getMetrics: () => PreloadMetrics[];
  clearMetrics: () => void;
}

interface PreloadMetrics {
  id: string;
  loadTime: number;
  size: number;
  timestamp: number;
  success: boolean;
}

const preloadCache = new Set<string>();
let preloadMetrics: PreloadMetrics[] = [];
let isPreloading = false;

const preloadedComponents = new Map<string, boolean>();
const componentLoaders = new Map<string, () => Promise<any>>();

/**
 * Registra um componente para pré-carregamento
 */
export function registerPreloadableComponent(id: string, loader: () => Promise<any>) {
  componentLoaders.set(id, loader);
}

/**
 * Precarregador inteligente base idle time
 */
export function useIdlePreloader(strategy: PreloadStrategy) {
  useEffect(() => {
    if (strategy.trigger === 'idle') {
      const timer = setTimeout(() => {
        if (!preloadedComponents.has(strategy.id) && !isPreloading) {
          preloadComponent(strategy.id);
        }
      }, strategy.delay || 1000);

      return () => clearTimeout(timer);
    }
  }, [strategy.id, strategy.trigger, strategy.delay]);

  const preload = useCallback(() => {
    if (!preloadedComponents.has(strategy.id)) {
      preloadComponent(strategy.id);
    }
  }, [strategy.id]);

  return { preload };
}

/**
 * Precarregador baseado em interação do usuário
 */
export function useInteractionPreloader(
  triggerElement: React.RefObject<HTMLElement>,
  strategy: PreloadStrategy
) {
  useEffect(() => {
    if (strategy.trigger === 'interaction' && triggerElement.current) {
      const element = triggerElement.current;
      
      const handleInteraction = () => {
        if (!preloadedComponents.has(strategy.id)) {
          preloadComponent(strategy.id);
          // Remove o listener após primeira interação
          element.removeEventListener('mouseenter', handleInteraction);
          element.removeEventListener('click', handleInteraction);
          element.removeEventListener('touchstart', handleInteraction);
        }
      };

      element.addEventListener('mouseenter', handleInteraction);
      element.addEventListener('click', handleInteraction);
      element.addEventListener('touchstart', handleInteraction);

      return () => {
        element.removeEventListener('mouseenter', handleInteraction);
        element.removeEventListener('click', handleInteraction);
        element.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [strategy.id, strategy.trigger, triggerElement]);
}

/**
 * Hook para pré-carregamento preditivo
 * Baseado em padrões de navegação
 */
export function usePredictivePreloader() {
  const [predictedComponents, setPredictedComponents] = useState<string[]>([]);

  const analyzeNavigationPattern = useCallback(() => {
    // Simular análise de padrões de navegação
    const currentPath = window.location.pathname;
    const pattern: string[] = [];

    // Lógica simples de predição baseada na rota atual
    if (currentPath.includes('/contratos')) {
      pattern.push('Contratos', 'EditarContrato', 'GerarDocumento');
    } else if (currentPath.includes('/analise-vistoria')) {
      pattern.push('AnaliseVistoria', 'ImageGallery', 'DocumentViewer');
    } else if (currentPath.includes('/dashboard')) {
      pattern.push('Dashboard', 'ChartComponents', 'ReportGenerator');
    } else {
      pattern.push('Contratos', 'Dashboard');
    }

    setPredictedComponents(pattern);
  }, []);

  const preloadPredicted = useCallback(async () => {
    const newComponents = predictedComponents.filter(id => 
      !preloadedComponents.has(id)
    );

    if (newComponents.length > 0) {
      preloadBundle(newComponents);
    }
  }, [predictedComponents]);

  useEffect(() => {
    analyzeNavigationPattern();
  }, [analyzeNavigationPattern]);

  useEffect(() => {
    if (predictedComponents.length > 0) {
      const timer = setTimeout(preloadPredicted, 2000);
      return () => clearTimeout(timer);
    }
  }, [predictedComponents, preloadPredicted]);

  return { predictedComponents, preloadPredicted };
}

/**
 * Hook para métricas de pré-carregamento
 */
export function usePreloadMetrics() {
  const [metrics, setMetrics] = useState<PreloadMetrics[]>([]);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics([...preloadMetrics]);
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearMetrics = useCallback(() => {
    preloadMetrics = [];
    setMetrics([]);
  }, []);

  return { metrics, clearMetrics };
}

/**
 * Provider global para pré-carregamento
 */
export function PreloadProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Registrar componentes críticos para pré-carregamento
    const criticalComponents = [
      { id: 'Index', loader: () => import('@/pages/Index') },
      { id: 'Contratos', loader: () => import('@/pages/Contratos') },
      { id: 'Login', loader: () => import('@/pages/Login') },
    ];

    criticalComponents.forEach(({ id, loader }) => {
      registerPreloadableComponent(id, loader);
    });

    // Pré-carregamento inicial
    const initializePreloading = () => {
      setIsInitializing(false);
      
      // Carregar componentes críticos após a página estar estável
      setTimeout(() => {
        criticalComponents.forEach(({ id }) => {
          if (!preloadedComponents.has(id)) {
            preloadComponent(id);
          }
        });
      }, 1500);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(initializePreloading);
    } else {
      setTimeout(initializePreloading, 1000);
    }
  }, []);

  return (
    <>
      {children}
      {isInitializing && (
        <div className="sr-only">
          Inicializando sistema de pré-carregamento...
        </div>
      )}
    </>
  );
}

/**
 * Sistema de pré-carregamento inteligente
 */
export class SmartPreloadManager implements PreloadManager {
  
  async preloadComponent(id: string): Promise<void> {
    if (preloadedComponents.has(id)) return;
    
    const loader = componentLoaders.get(id);
    if (!loader) {
      console.warn(`Nenhum loader encontrado para componente: ${id}`);
      return;
    }

    try {
      const startTime = performance.now();
      isPreloading = true;
      
      await loader();
      
      const loadTime = performance.now() - startTime;
      preloadedComponents.set(id, true);
      preloadCache.add(id);
      
      // Registrar métricas
      preloadMetrics.push({
        id,
        loadTime,
        size: 0, // Seria calculado pelo webpack
        timestamp: Date.now(),
        success: true
      });

      console.log(`🚀 Componente ${id} pré-carregado em ${loadTime.toFixed(0)}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      preloadMetrics.push({
        id,
        loadTime: 0,
        size: 0,
        timestamp: Date.now(),
        success: false
      });

      console.warn(`❌ Falha ao pré-carregar ${id}:`, errorMessage);
    } finally {
      isPreloading = false;
    }
  }

  async preloadBundle(components: string[]): Promise<void> {
    const uniqueComponents = components.filter(id => !preloadedComponents.has(id));
    
    if (uniqueComponents.length === 0) return;

    console.log(`📦 Pré-carregando bundle de ${uniqueComponents.length} componentes...`);
    
    const startTime = performance.now();
    const promises = uniqueComponents.map(id => this.preloadComponent(id));
    
    try {
      await Promise.allSettled(promises);
      const totalTime = performance.now() - startTime;
      console.log(`📦 Bundle pré-carregado em ${totalTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('❌ Erro ao pré-carregar bundle:', error);
    }
  }

  isPreloaded(id: string): boolean {
    return preloadedComponents.has(id);
  }

  getMetrics(): PreloadMetrics[] {
    return [...preloadMetrics];
  }

  clearMetrics(): void {
    preloadMetrics = [];
  }
}

// Instância global do gerenciador
export const preloadManager = new SmartPreloadManager();

// Função de conveniência para pré-carregamento
export const preloadComponent = (id: string) => preloadManager.preloadComponent(id);
export const preloadBundle = (components: string[]) => preloadManager.preloadBundle(components);

/**
 * Hook para uso do preloader manager
 */
export function usePreloadManager() {
  return {
    preload: preloadManager.preloadComponent.bind(preloadManager),
    preloadBundle: preloadManager.preloadBundle.bind(preloadManager),
    isPreloaded: preloadManager.isPreloaded.bind(preloadManager),
    getMetrics: preloadManager.getMetrics.bind(preloadManager),
    clearMetrics: preloadManager.clearMetrics.bind(preloadManager),
  };
}