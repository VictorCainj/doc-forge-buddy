import { useState, useEffect, useCallback } from 'react';

// Tipos para os diferentes tipos de import
export type ImportType = 'docs' | 'pdf' | 'charts' | 'admin' | 'ai' | 'animation';

interface SmartImportOptions {
  type: ImportType;
  enabled?: boolean;
  preload?: boolean;
  fallback?: React.ComponentType;
}

interface SmartImportState<T> {
  component: T | null;
  loading: boolean;
  error: Error | null;
  loadTime: number;
}

// Configurações por tipo de import
const IMPORT_CONFIGS: Record<ImportType, () => Promise<any>> = {
  docs: () => import('@/lib/smartImports/documentLibs'),
  pdf: () => import('@/lib/smartImports/pdfLibs'),
  charts: () => import('@/lib/smartImports/chartLibs'),
  admin: () => import('@/lib/smartImports/adminLibs'),
  ai: () => import('@/lib/smartImports/aiLibs'),
  animation: () => import('@/lib/smartImports/animationLibs'),
};

// Configurações de preload inteligente
const PRELOAD_CONFIG: Record<ImportType, { 
  delay: number;
  trigger: 'idle' | 'interaction' | 'viewport';
  priority: 'high' | 'medium' | 'low';
}> = {
  docs: { delay: 3000, trigger: 'idle', priority: 'high' },
  pdf: { delay: 2000, trigger: 'idle', priority: 'medium' },
  charts: { delay: 5000, trigger: 'interaction', priority: 'low' },
  admin: { delay: 10000, trigger: 'idle', priority: 'medium' },
  ai: { delay: 2000, trigger: 'idle', priority: 'high' },
  animation: { delay: 0, trigger: 'viewport', priority: 'high' },
};

const importCache = new Map<ImportType, any>();
const loadPromiseCache = new Map<ImportType, Promise<any>>();

/**
 * Hook para smart loading de bibliotecas pesadas
 * Carrega bibliotecas apenas quando necessário, com cache inteligente
 */
export function useSmartImport<T = any>(options: SmartImportOptions) {
  const { type, enabled = true, preload = false, fallback: Fallback } = options;
  const [state, setState] = useState<SmartImportState<T>>({
    component: null,
    loading: false,
    error: null,
    loadTime: 0,
  });

  // Carregar a biblioteca dinamicamente
  const loadComponent = useCallback(async () => {
    if (!enabled) return;
    if (importCache.has(type)) {
      setState(prev => ({ ...prev, component: importCache.get(type), loading: false }));
      return;
    }

    const startTime = performance.now();
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar cache de promise para evitar múltiplos loads simultâneos
      if (!loadPromiseCache.has(type)) {
        loadPromiseCache.set(type, IMPORT_CONFIGS[type]());
      }

      const module = await loadPromiseCache.get(type)!;
      const loadTime = performance.now() - startTime;

      // Cache do módulo
      importCache.set(type, module.default || module);
      
      setState({
        component: module.default || module,
        loading: false,
        error: null,
        loadTime,
      });

      // Limpar promise do cache
      loadPromiseCache.delete(type);
      
    } catch (error) {
      setState({
        component: null,
        loading: false,
        error: error as Error,
        loadTime: performance.now() - startTime,
      });
    }
  }, [type, enabled]);

  // Preload inteligente baseado na configuração
  const preloadComponent = useCallback(() => {
    const config = PRELOAD_CONFIG[type];
    if (!config) return;

    const executePreload = () => {
      loadComponent().catch(() => {
        // Silently fail preload
      });
    };

    switch (config.trigger) {
      case 'idle':
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(executePreload, { timeout: config.delay });
        } else {
          setTimeout(executePreload, config.delay);
        }
        break;
        
      case 'interaction':
        const handleInteraction = () => {
          executePreload();
          document.removeEventListener('mousedown', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
        };
        
        document.addEventListener('mousedown', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
        break;
        
      case 'viewport':
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              executePreload();
              observer.disconnect();
            }
          },
          { threshold: 0.1 }
        );
        
        // Observar um elemento específico ou o document.body como fallback
        const targetElement = document.querySelector(`[data-smart-import="${type}"]`) || document.body;
        observer.observe(targetElement);
        break;
    }
  }, [type, loadComponent]);

  // Carregar quando habilitado
  useEffect(() => {
    if (enabled) {
      loadComponent();
    }
  }, [enabled, loadComponent]);

  // Preload quando configurado
  useEffect(() => {
    if (preload && enabled) {
      preloadComponent();
    }
  }, [preload, enabled, preloadComponent]);

  return {
    ...state,
    loadComponent,
    preloadComponent,
    isCached: importCache.has(type),
    clearCache: () => importCache.delete(type),
  };
}

/**
 * Hook para import de páginas com fallback inteligente
 */
export function usePageImport(pageName: string) {
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      // Mapear páginas específicas para evitar imports dinâmicos problemáticos
      const pageModules: Record<string, () => Promise<any>> = {
        'Index': () => import('@/pages/Index'),
        'Login': () => import('@/pages/Login'),
        'Contratos': () => import('@/pages/Contratos'),
        'Admin': () => import('@/pages/Admin'),
      };

      const loadFn = pageModules[pageName];
      if (loadFn) {
        const pageModule = await loadFn();
        setComponent(pageModule.default);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageName]);

  return { component, loading, error, loadPage };
}

/**
 * Hook para import condicional baseado em permissões
 */
export function usePermissionBasedImport(
  permission: string,
  componentPath: string
) {
  const [hasPermission, setHasPermission] = useState(false);
  const { component, loading, error, loadPage } = usePageImport(componentPath);

  useEffect(() => {
    // Verificar permissão (implementar lógica de autenticação)
    const checkPermission = async () => {
      // Implementar lógica de verificação de permissão
      setHasPermission(true); // Placeholder
    };
    checkPermission();
  }, [permission]);

  useEffect(() => {
    if (hasPermission && !component && !loading) {
      loadPage();
    }
  }, [hasPermission, component, loading, loadPage]);

  return {
    component: hasPermission ? component : null,
    loading: hasPermission ? loading : false,
    error: hasPermission ? error : null,
    hasPermission,
  };
}

/**
 * Função para pré-carregar todas as bibliotecas críticas
 */
export async function preloadCriticalLibs() {
  const criticalTypes: ImportType[] = ['docs', 'ai', 'animation'];
  
  const promises = criticalTypes.map(async (type) => {
    if (!importCache.has(type)) {
      try {
        const module = await IMPORT_CONFIGS[type]();
        importCache.set(type, module.default || module);
      } catch (error) {
        console.warn(`Failed to preload ${type}:`, error);
      }
    }
  });

  await Promise.all(promises);
}

/**
 * Hook para carregamento baseado em comportamento do usuário
 * Carrega bibliotecas quando detecta padrões de uso
 */
export function useBehaviorBasedLoading() {
  const [isPreloading, setIsPreloading] = useState(false);

  const startPreloading = useCallback(async (types: ImportType[] = ['docs', 'charts']) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    try {
      await preloadLibraries(types);
    } finally {
      setIsPreloading(false);
    }
  }, [isPreloading]);

  return {
    isPreloading,
    startPreloading
  };
}

/**
 * Função para limpar cache de imports
 */
export function clearAllImportCaches() {
  importCache.clear();
  loadPromiseCache.clear();
}