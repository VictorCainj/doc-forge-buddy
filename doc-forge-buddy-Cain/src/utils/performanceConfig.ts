/**
 * Configurações de performance para o aplicativo
 */

export const PERFORMANCE_CONFIG = {
  // Configurações de busca
  search: {
    debounceMs: 300,
    maxResults: 100,
    cacheSize: 50,
    enableCache: true,
  },
  
  // Configurações de lista
  list: {
    virtualScrolling: true,
    itemHeight: 120,
    containerHeight: 600,
    batchSize: 20,
    overscan: 5,
  },
  
  // Configurações de cache
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutos
    maxSize: 100,
    enableCompression: false,
    cleanupInterval: 60000, // 1 minuto
  },
  
  // Configurações de bundle
  bundle: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableMinification: true,
    chunkSizeWarningLimit: 1000,
  },
  
  // Configurações de renderização
  rendering: {
    enableMemoization: true,
    enableVirtualization: true,
    enableLazyLoading: true,
    maxRenderTime: 16, // 60fps
  },
};

/**
 * Configurações específicas para diferentes ambientes
 */
export const getEnvironmentConfig = (env: 'development' | 'production') => {
  const baseConfig = PERFORMANCE_CONFIG;
  
  if (env === 'development') {
    return {
      ...baseConfig,
      search: {
        ...baseConfig.search,
        debounceMs: 100, // Mais responsivo em dev
      },
      cache: {
        ...baseConfig.cache,
        defaultTtl: 30 * 1000, // 30 segundos em dev
      },
    };
  }
  
  return baseConfig;
};

/**
 * Métricas de performance
 */
export const PERFORMANCE_METRICS = {
  // Limites de performance
  limits: {
    maxRenderTime: 16, // ms
    maxSearchTime: 500, // ms
    maxLoadTime: 2000, // ms
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  },
  
  // Alertas de performance
  alerts: {
    slowRender: 50, // ms
    slowSearch: 1000, // ms
    slowLoad: 3000, // ms
    highMemoryUsage: 80 * 1024 * 1024, // 80MB
  },
};

/**
 * Configurações de otimização por componente
 */
export const COMPONENT_OPTIMIZATIONS = {
  // Otimizações para lista de contratos
  contractsList: {
    enableVirtualization: true,
    itemHeight: 200,
    batchSize: 10,
    enableMemoization: true,
  },
  
  // Otimizações para busca
  search: {
    enableDebounce: true,
    debounceMs: 300,
    enableCache: true,
    maxCacheSize: 50,
  },
  
  // Otimizações para dashboard
  dashboard: {
    enableLazyLoading: true,
    enableMemoization: true,
    enableVirtualization: false, // Dashboard não precisa de virtualização
  },
};

/**
 * Configurações de monitoramento
 */
export const MONITORING_CONFIG = {
  // Métricas a serem coletadas
  metrics: [
    'renderTime',
    'searchTime',
    'loadTime',
    'memoryUsage',
    'cacheHitRate',
  ],
  
  // Intervalo de coleta de métricas
  collectionInterval: 30000, // 30 segundos
  
  // Limite de métricas armazenadas
  maxMetrics: 1000,
  
  // Configurações de alertas
  alerts: {
    enabled: true,
    email: false, // Desabilitado por padrão
    console: true,
  },
};

export default PERFORMANCE_CONFIG;