import { useState, useEffect, useCallback } from 'react';
import { useSmartImport, type ImportType } from './useSmartImport';

interface UserBehaviorMetrics {
  pageViews: Record<string, number>;
  timeSpent: Record<string, number>;
  interactions: Record<string, number>;
  scrollDepth: Record<string, number>;
  clickPatterns: Record<string, string[]>;
}

interface SmartLoadingOptions {
  enableBehaviorTracking?: boolean;
  enablePredictiveLoading?: boolean;
  trackUserPreferences?: boolean;
  preloadThreshold?: number; // 0-1, percentagem de probabilidade de uso
}

const BEHAVIOR_STORAGE_KEY = 'docforge_behavior_metrics';
const PREFERENCES_STORAGE_KEY = 'docforge_user_preferences';

const behaviorMetrics: UserBehaviorMetrics = {
  pageViews: {},
  timeSpent: {},
  interactions: {},
  scrollDepth: {},
  clickPatterns: {},
};

// Configurações de thresholds para diferentes features
const LOADING_THRESHOLDS = {
  docs: { viewThreshold: 0.3, interactionThreshold: 2 },
  pdf: { viewThreshold: 0.2, interactionThreshold: 1 },
  charts: { viewThreshold: 0.4, interactionThreshold: 3 },
  admin: { viewThreshold: 0.1, interactionThreshold: 5 },
  ai: { viewThreshold: 0.5, interactionThreshold: 1 },
  animation: { viewThreshold: 0.8, interactionThreshold: 0 },
};

/**
 * Hook para smart loading baseado no comportamento do usuário
 */
export function useBehaviorBasedLoading(options: SmartLoadingOptions = {}) {
  const {
    enableBehaviorTracking = true,
    enablePredictiveLoading = true,
    trackUserPreferences = true,
    preloadThreshold = 0.3,
  } = options;

  const [userPreferences, setUserPreferences] = useState<Record<string, number>>({});
  const [isHighActivityUser, setIsHighActivityUser] = useState(false);

  // Carregar métricas salvas
  useEffect(() => {
    if (trackUserPreferences) {
      const savedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }
    }
  }, [trackUserPreferences]);

  // Salvar métricas periodicamente
  const saveMetrics = useCallback(() => {
    if (trackUserPreferences) {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(userPreferences));
      localStorage.setItem(BEHAVIOR_STORAGE_KEY, JSON.stringify(behaviorMetrics));
    }
  }, [userPreferences, trackUserPreferences]);

  useEffect(() => {
    const interval = setInterval(saveMetrics, 30000); // Salvar a cada 30s
    return () => clearInterval(interval);
  }, [saveMetrics]);

  // Rastrear visualização de página
  const trackPageView = useCallback((pagePath: string, duration: number) => {
    if (!enableBehaviorTracking) return;

    behaviorMetrics.pageViews[pagePath] = (behaviorMetrics.pageViews[pagePath] || 0) + 1;
    behaviorMetrics.timeSpent[pagePath] = (behaviorMetrics.timeSpent[pagePath] || 0) + duration;

    // Atualizar preferências do usuário
    const pageFeature = getFeatureFromPath(pagePath);
    if (pageFeature) {
      setUserPreferences(prev => ({
        ...prev,
        [pageFeature]: Math.min(1, (prev[pageFeature] || 0) + 0.1),
      }));
    }
  }, [enableBehaviorTracking]);

  // Rastrear interação do usuário
  const trackInteraction = useCallback((feature: ImportType, element?: string) => {
    if (!enableBehaviorTracking) return;

    behaviorMetrics.interactions[feature] = (behaviorMetrics.interactions[feature] || 0) + 1;
    if (element) {
      if (!behaviorMetrics.clickPatterns[feature]) {
        behaviorMetrics.clickPatterns[feature] = [];
      }
      behaviorMetrics.clickPatterns[feature].push(element);
    }

    // Atualizar preferências para feature específica
    setUserPreferences(prev => ({
      ...prev,
      [feature]: Math.min(1, (prev[feature] || 0) + 0.2),
    }));
  }, [enableBehaviorTracking]);

  // Rastrear scroll depth
  const trackScrollDepth = useCallback((pagePath: string, depth: number) => {
    if (!enableBehaviorTracking) return;

    behaviorMetrics.scrollDepth[pagePath] = Math.max(
      behaviorMetrics.scrollDepth[pagePath] || 0,
      depth
    );
  }, [enableBehaviorTracking]);

  // Verificar se usuário é de alta atividade
  useEffect(() => {
    if (trackUserPreferences) {
      const totalActivity = Object.values(userPreferences).reduce((sum, val) => sum + val, 0);
      const averageActivity = totalActivity / Object.keys(userPreferences).length;
      setIsHighActivityUser(averageActivity > 0.6);
    }
  }, [userPreferences, trackUserPreferences]);

  // Função para determinar se deve pré-carregar uma feature
  const shouldPreload = useCallback((feature: ImportType): boolean => {
    if (!enablePredictiveLoading) return false;

    // Obter preferência do usuário para esta feature
    const userPreference = userPreferences[feature] || 0;
    
    // Obter threshold da feature
    const threshold = LOADING_THRESHOLDS[feature];
    
    // Calcular score baseado em preferências e atividade
    let score = userPreference;
    
    // Bonus para usuários de alta atividade
    if (isHighActivityUser) {
      score += 0.2;
    }
    
    // Bonus baseado em interações recentes
    const interactions = behaviorMetrics.interactions[feature] || 0;
    score += Math.min(0.3, interactions * 0.1);
    
    // Bonus baseado no padrão de uso da página atual
    const currentPath = window.location.pathname;
    if (isPageRelatedToFeature(currentPath, feature)) {
      score += 0.3;
    }

    return score >= preloadThreshold;
  }, [enablePredictiveLoading, userPreferences, isHighActivityUser, preloadThreshold]);

  // Função para obter score de probabilidade de uso
  const getUsageScore = useCallback((feature: ImportType): number => {
    const userPreference = userPreferences[feature] || 0;
    const interactions = behaviorMetrics.interactions[feature] || 0;
    const currentPath = window.location.pathname;
    
    let score = userPreference * 0.5; // 50% peso para preferência
    
    // Calcular baseado em interações
    score += Math.min(0.3, interactions * 0.1);
    
    // Calcular baseado na página atual
    if (isPageRelatedToFeature(currentPath, feature)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }, [userPreferences]);

  return {
    trackPageView,
    trackInteraction,
    trackScrollDepth,
    shouldPreload,
    getUsageScore,
    userPreferences,
    isHighActivityUser,
    behaviorMetrics,
  };
}

/**
 * Hook específico para features com smart loading
 */
export function useSmartFeatureLoading(feature: ImportType) {
  const { shouldPreload, getUsageScore, trackInteraction } = useBehaviorBasedLoading();
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Usar o hook de smart import
  const smartImport = useSmartImport({
    type: feature,
    enabled: shouldPreload(feature),
    preload: shouldPreload(feature),
  });

  // Rastrear primeira interação com a feature
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        trackInteraction(feature);
      }
    };

    const element = document.querySelector(`[data-feature="${feature}"]`) || document.body;
    element.addEventListener('click', handleFirstInteraction, { once: true });
    
    return () => {
      element.removeEventListener('click', handleFirstInteraction);
    };
  }, [feature, hasInteracted, trackInteraction]);

  // Auto-carregar se o score de uso for alto
  useEffect(() => {
    const usageScore = getUsageScore(feature);
    if (usageScore > 0.8 && !smartImport.component && !smartImport.loading) {
      smartImport.loadComponent();
    }
  }, [feature, getUsageScore, smartImport]);

  return {
    ...smartImport,
    usageScore: getUsageScore(feature),
    shouldPreload: shouldPreload(feature),
    hasInteracted,
  };
}

// Funções auxiliares
function getFeatureFromPath(path: string): ImportType | null {
  if (path.includes('admin')) return 'admin';
  if (path.includes('document') || path.includes('contrato')) return 'docs';
  if (path.includes('pdf') || path.includes('gerar')) return 'pdf';
  if (path.includes('chart') || path.includes('dashboard')) return 'charts';
  if (path.includes('ai') || path.includes('prompt')) return 'ai';
  return null;
}

function isPageRelatedToFeature(path: string, feature: ImportType): boolean {
  const featurePaths: Record<ImportType, string[]> = {
    admin: ['/admin', '/users', '/roles'],
    docs: ['/contratos', '/documento', '/cadastrar', '/editar'],
    pdf: ['/gerar', '/pdf', '/documento'],
    charts: ['/dashboard', '/relatorio', '/analytics'],
    ai: ['/prompt', '/ai', '/gerar'],
    animation: ['/'], // Sempre ativo
  };

  const paths = featurePaths[feature] || [];
  return paths.some(p => path.includes(p));
}

/**
 * Hook para monitoring de performance de carregamento
 */
export function useLoadingPerformance() {
  const [metrics, setMetrics] = useState({
    totalLoadTime: 0,
    cachedLoads: 0,
    networkLoads: 0,
    failedLoads: 0,
  });

  useEffect(() => {
    // Monitorar performance dos smart imports
    const originalLoad = window.performance.now();
    
    // Implementar monitoring de performance
    const interval = setInterval(() => {
      // Calcular métricas baseadas nos dados reais
      setMetrics(prev => ({
        ...prev,
        // Implementar lógica de cálculo real
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}