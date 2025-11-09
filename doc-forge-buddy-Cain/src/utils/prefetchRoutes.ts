import { preloadCriticalLibs } from '@/hooks/useSmartImport';
import type { ImportType } from '@/hooks/useSmartImport';

type Prefetcher = () => Promise<unknown>;
type SmartPrefetcher = {
  prefetch: Prefetcher;
  feature?: ImportType;
  weight: number;
  dependencies?: ImportType[];
};

let hasPrefetched = false;
let prefetchMetrics = {
  successCount: 0,
  errorCount: 0,
  totalTime: 0,
  cacheHits: 0,
};

// Configurações otimizadas de timing
const PREFETCH_CONFIG = {
  CRITICAL_DELAY: 500,    // 500ms para rotas críticas
  SECONDARY_DELAY: 2000,  // 2s para rotas secundárias
  TERTIARY_DELAY: 5000,   // 5s para rotas terciárias
  STEP_DELAY: 200,        // 200ms entre cada prefetch
  MAX_CONCURRENT: 3,      // Máximo 3 prefetches simultâneos
};

// Rotas críticas com weights (probabilidade de uso)
const criticalRoutes: SmartPrefetcher[] = [
  { 
    prefetch: () => import('@/pages/Index'),
    weight: 0.95,
    feature: 'docs'
  },
  { 
    prefetch: () => import('@/pages/Login'),
    weight: 0.9,
  },
  { 
    prefetch: () => import('@/pages/Contratos'),
    weight: 0.85,
    feature: 'docs'
  },
];

// Rotas secundárias com análise de probabilidade
const secondaryRoutes: SmartPrefetcher[] = [
  { 
    prefetch: () => import('@/pages/CadastrarContrato'),
    weight: 0.7,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/EditarContrato'),
    weight: 0.65,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/ProcessoRescisao'),
    weight: 0.4,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/GerarDocumento'),
    weight: 0.6,
    feature: 'pdf',
    dependencies: ['pdf', 'docs']
  },
  { 
    prefetch: () => import('@/pages/ForgotPassword'),
    weight: 0.3,
  },
];

// Rotas terciárias - carregamento inteligente baseado em comportamento
const tertiaryRoutes: SmartPrefetcher[] = [
  { 
    prefetch: () => import('@/pages/TermoLocador'),
    weight: 0.5,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/TermoLocatario'),
    weight: 0.5,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/TermoRecusaAssinaturaEmail'),
    weight: 0.2,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/AnaliseVistoria'),
    weight: 0.4,
    feature: 'ai',
    dependencies: ['ai', 'charts']
  },
  { 
    prefetch: () => import('@/pages/Prestadores'),
    weight: 0.3,
  },
  { 
    prefetch: () => import('@/pages/Tarefas'),
    weight: 0.4,
  },
  { 
    prefetch: () => import('@/pages/DashboardDesocupacao'),
    weight: 0.3,
    feature: 'charts',
    dependencies: ['charts']
  },
  { 
    prefetch: () => import('@/pages/Admin'),
    weight: 0.1,
    feature: 'admin',
    dependencies: ['admin']
  },
  { 
    prefetch: () => import('@/pages/DocumentoPublico'),
    weight: 0.25,
    feature: 'docs',
    dependencies: ['docs']
  },
  { 
    prefetch: () => import('@/pages/NotFound'),
    weight: 0.05,
  },
];

// Sistema de prefetch inteligente com queue controlada
class SmartPrefetchQueue {
  private queue: SmartPrefetcher[] = [];
  private active = 0;
  private maxConcurrent = PREFETCH_CONFIG.MAX_CONCURRENT;

  add(routes: SmartPrefetcher[]) {
    this.queue.push(...routes);
    this.process();
  }

  private process() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const route = this.queue.shift()!;
    this.active++;

    const startTime = performance.now();
    
    safelyPrefetch(route.prefetch, route)
      .then(() => {
        const loadTime = performance.now() - startTime;
        prefetchMetrics.successCount++;
        prefetchMetrics.totalTime += loadTime;
        
        // Verificar se tem cache hit
        if (loadTime < 50) {
          prefetchMetrics.cacheHits++;
        }
      })
      .catch(() => {
        prefetchMetrics.errorCount++;
      })
      .finally(() => {
        this.active--;
        this.process(); // Processar próximo item
      });
  }

  getMetrics() {
    return {
      ...prefetchMetrics,
      averageLoadTime: prefetchMetrics.successCount > 0 
        ? prefetchMetrics.totalTime / prefetchMetrics.successCount 
        : 0,
      cacheHitRate: prefetchMetrics.successCount > 0 
        ? (prefetchMetrics.cacheHits / prefetchMetrics.successCount) * 100 
        : 0,
    };
  }
}

const prefetchQueue = new SmartPrefetchQueue();

// Prefetch seguro com métricas
const safelyPrefetch = async (prefetch: Prefetcher, route?: SmartPrefetcher) => {
  try {
    await prefetch();
  } catch (error) {
    console.warn('Prefetch failed:', route?.prefetch.name || 'unknown route', error);
  }
};

// Carregar dependências de features antes das rotas
const loadFeatureDependencies = async (dependencies?: ImportType[]) => {
  if (!dependencies) return;
  
  for (const feature of dependencies) {
    try {
      // Carregar apenas as dependências que existem
      if (feature === 'docs') {
        await import('@/lib/smartImports/documentLibs');
      } else if (feature === 'pdf') {
        await import('@/lib/smartImports/pdfLibs');
      } else if (feature === 'charts') {
        await import('@/lib/smartImports/chartLibs');
      } else if (feature === 'admin') {
        await import('@/lib/smartImports/adminLibs');
      } else if (feature === 'ai') {
        await import('@/lib/smartImports/aiLibs');
      } else if (feature === 'animation') {
        await import('@/lib/smartImports/animationLibs');
      }
    } catch (error) {
      console.warn(`Failed to load feature dependency: ${feature}`, error);
    }
  }
};

// Prefetch inteligente com base em user agent e device
const detectDeviceCapabilities = () => {
  const connection = (navigator as any).connection;
  const isLowEndDevice = 
    navigator.hardwareConcurrency <= 2 ||
    (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'));
    
  return {
    isLowEnd: isLowEndDevice,
    isHighEnd: navigator.hardwareConcurrency >= 8,
    connectionType: connection?.effectiveType || 'unknown',
  };
};

// Prefetch apenas rotas críticas inicialmente
const prefetchCriticalRoutes = async () => {
  const capabilities = detectDeviceCapabilities();
  
  // Carregar dependências críticas primeiro
  await Promise.all([
    loadFeatureDependencies(['docs', 'animation']),
    preloadCriticalLibs(),
  ]);

  // Prefetch rotas críticas com base nas capacidades do dispositivo
  const criticalDelay = capabilities.isLowEnd ? 1000 : PREFETCH_CONFIG.CRITICAL_DELAY;
  
  criticalRoutes.forEach((route, index) => {
    setTimeout(() => prefetchQueue.add([route]), index * criticalDelay);
  });
};

// Prefetch rotas secundárias após análise de comportamento
const prefetchSecondaryRoutes = async () => {
  // Análise de comportamento do usuário para filtrar rotas
  const userBehavior = JSON.parse(localStorage.getItem('docforge_user_preferences') || '{}');
  const hasUsedContracts = userBehavior.docs > 0.3;
  
  // Filtrar rotas baseado no comportamento
  const relevantRoutes = secondaryRoutes.filter(route => {
    if (!hasUsedContracts && route.feature === 'docs') {
      return false; // Pular rotas de documentos se usuário não mostrou interesse
    }
    return route.weight > 0.2; // Threshold mínimo
  });

  // Carregar dependências
  for (const route of relevantRoutes) {
    if (route.dependencies) {
      await loadFeatureDependencies(route.dependencies);
    }
  }

  // Adicionar ao queue com delay
  setTimeout(() => {
    prefetchQueue.add(relevantRoutes);
  }, PREFETCH_CONFIG.SECONDARY_DELAY);
};

// Prefetch rotas terciárias com machine learning simples
const prefetchTertiaryRoutes = async () => {
  if (hasPrefetched) return;
  hasPrefetched = true;

  // Análise de padrão de navegação para predizer próximas rotas
  const recentPages = JSON.parse(sessionStorage.getItem('recent_pages') || '[]');
  const pagePattern = analyzePagePattern(recentPages);
  
  // Filtrar rotas baseado no padrão
  const predictedRoutes = tertiaryRoutes.filter(route => {
    if (pagePattern.includes('admin') && route.feature === 'admin') {
      return route.weight > 0.05; // Threshold baixo para admin
    }
    if (pagePattern.includes('document') && route.feature === 'docs') {
      return route.weight > 0.1; // Threshold baixo para documentos relacionados
    }
    return route.weight > 0.15; // Threshold padrão
  });

  // Carregar dependências primeiro
  for (const route of predictedRoutes) {
    if (route.dependencies) {
      await loadFeatureDependencies(route.dependencies);
    }
  }

  // Adicionar ao queue
  setTimeout(() => {
    prefetchQueue.add(predictedRoutes);
  }, PREFETCH_CONFIG.TERTIARY_DELAY);
};

// Análise simples de padrão de navegação
const analyzePagePattern = (recentPages: string[]): string[] => {
  if (recentPages.length < 2) return [];
  
  const patterns = [];
  for (let i = 1; i < recentPages.length; i++) {
    const prev = recentPages[i - 1];
    const curr = recentPages[i];
    
    if (prev.includes('contrato') && curr.includes('documento')) {
      patterns.push('document');
    }
    if (prev.includes('dashboard') && curr.includes('admin')) {
      patterns.push('admin');
    }
  }
  
  return [...new Set(patterns)]; // Remover duplicatas
};

export const prefetchRouteModules = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Registrar página atual para análise de padrão
  const currentPage = window.location.pathname;
  const recentPages = JSON.parse(sessionStorage.getItem('recent_pages') || '[]');
  recentPages.push(currentPage);
  sessionStorage.setItem('recent_pages', JSON.stringify(recentPages.slice(-10))); // Manter apenas últimas 10

  // Prefetch rotas críticas imediatamente
  prefetchCriticalRoutes();

  // Sistema de prefetch adaptativo
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      async () => {
        await prefetchSecondaryRoutes();
      },
      { timeout: 3000 }
    );
  } else {
    setTimeout(prefetchSecondaryRoutes, PREFETCH_CONFIG.SECONDARY_DELAY);
  }

  // Prefetch inteligente após interação do usuário
  let interactionCount = 0;
  const handleSmartInteraction = () => {
    interactionCount++;
    
    if (interactionCount === 1) {
      // Primeira interação: carregar recursos de animação
      loadFeatureDependencies(['animation']);
    } else if (interactionCount === 2) {
      // Segunda interação: carregar rotas terciárias
      prefetchTertiaryRoutes();
    }
    
    // Remover listeners após 3 interações
    if (interactionCount >= 3) {
      window.removeEventListener('mousedown', handleSmartInteraction);
      window.removeEventListener('touchstart', handleSmartInteraction);
      window.removeEventListener('keydown', handleSmartInteraction);
    }
  };

  window.addEventListener('mousedown', handleSmartInteraction, { once: false });
  window.addEventListener('touchstart', handleSmartInteraction, { once: false });
  window.addEventListener('keydown', handleSmartInteraction, { once: false });
};

// Função para obter métricas de prefetch
export const getPrefetchMetrics = () => {
  return prefetchQueue.getMetrics();
};

// Função para limpar cache de prefetch
export const clearPrefetchCache = () => {
  prefetchMetrics = {
    successCount: 0,
    errorCount: 0,
    totalTime: 0,
    cacheHits: 0,
  };
};
