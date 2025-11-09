/**
 * Configuração Global do Sistema de Performance Monitoring
 * Centraliza todas as configurações e thresholds do sistema
 */

export interface PerformanceConfig {
  // Thresholds gerais
  thresholds: {
    renderTime: number;      // ms para renders
    mountTime: number;       // ms para mount
    apiResponse: number;     // ms para API calls
    memoryWarning: number;   // % do heap limit
    memoryCritical: number;  // % do heap limit
  };
  
  // Configurações de coleta
  collection: {
    interval: number;        // ms entre coletas
    maxHistorySize: number;  // máximo de entries no histórico
    autoCleanup: boolean;    // limpeza automática
    debugMode: boolean;      // modo debug
  };
  
  // Configurações de alertas
  alerts: {
    enabled: boolean;
    consoleLogging: boolean;
    analytics: boolean;
    notifications: boolean;
    thresholds: {
      renderCount: number;   // máximo de renders antes do alerta
      errorRate: number;     // % de erro para alertas
    };
  };
  
  // Configurações de exportação
  export: {
    enabled: boolean;
    format: 'json' | 'csv' | 'both';
    autoExport: boolean;
    scheduledExport: boolean;
    exportInterval: number;  // ms
  };
  
  // Configurações de componentes
  components: {
    autoWrap: boolean;       // wrap automático de componentes
    trackAllComponents: boolean;
    excludedComponents: string[];
    priorityComponents: string[];
  };
  
  // Configurações de produção
  production: {
    enabled: boolean;
    reducedOverhead: boolean;
    sampling: number;        // 0-1, 1 = 100% sampling
    budget: {
      renderTime: number;
      mountTime: number;
      apiResponse: number;
      memoryUsage: number;
    };
  };
}

export const defaultConfig: PerformanceConfig = {
  thresholds: {
    renderTime: 16,          // 16ms para 60fps
    mountTime: 100,          // 100ms para mount
    apiResponse: 1000,       // 1s para API calls
    memoryWarning: 80,       // 80% do heap limit
    memoryCritical: 90       // 90% do heap limit
  },
  
  collection: {
    interval: 5000,          // 5 segundos
    maxHistorySize: 100,     // 100 entries
    autoCleanup: true,       // limpeza automática
    debugMode: process.env.NODE_ENV === 'development' // modo debug em dev
  },
  
  alerts: {
    enabled: true,
    consoleLogging: process.env.NODE_ENV === 'development',
    analytics: false,
    notifications: false,
    thresholds: {
      renderCount: 100,      // 100 renders por minuto
      errorRate: 10          // 10% de erro
    }
  },
  
  export: {
    enabled: true,
    format: 'json',
    autoExport: false,
    scheduledExport: false,
    exportInterval: 300000   // 5 minutos
  },
  
  components: {
    autoWrap: false,         // desabilitado por padrão
    trackAllComponents: false,
    excludedComponents: ['PerformanceMonitor', 'PerformanceDashboard'],
    priorityComponents: []
  },
  
  production: {
    enabled: process.env.NODE_ENV === 'production',
    reducedOverhead: true,
    sampling: 0.1,           // 10% de sampling
    budget: {
      renderTime: 16,        // budget de 16ms
      mountTime: 100,        // budget de 100ms
      apiResponse: 1000,     // budget de 1s
      memoryUsage: 100       // budget de 100MB
    }
  }
};

// Configurações específicas por ambiente
export const environmentConfigs = {
  development: {
    ...defaultConfig,
    collection: {
      ...defaultConfig.collection,
      interval: 2000,        // 2 segundos em dev
      debugMode: true
    },
    alerts: {
      ...defaultConfig.alerts,
      consoleLogging: true,
      notifications: true
    },
    export: {
      ...defaultConfig.export,
      autoExport: true
    }
  },
  
  staging: {
    ...defaultConfig,
    production: {
      ...defaultConfig.production,
      enabled: true,
      reducedOverhead: false,
      sampling: 0.5          // 50% de sampling
    }
  },
  
  production: {
    ...defaultConfig,
    production: {
      ...defaultConfig.production,
      enabled: true,
      reducedOverhead: true,
      sampling: 0.1          // 10% de sampling
    },
    alerts: {
      ...defaultConfig.alerts,
      consoleLogging: false,
      analytics: true
    },
    export: {
      ...defaultConfig.export,
      autoExport: false,
      scheduledExport: true
    }
  }
};

// Obter configuração baseada no ambiente
export const getPerformanceConfig = (): PerformanceConfig => {
  const env = process.env.NODE_ENV as keyof typeof environmentConfigs;
  return environmentConfigs[env] || defaultConfig;
};

// Validação de configuração
export const validateConfig = (config: PerformanceConfig): boolean => {
  const { thresholds, collection, alerts } = config;
  
  // Validar thresholds
  if (thresholds.renderTime < 1 || thresholds.renderTime > 1000) {
    console.warn('Invalid renderTime threshold');
    return false;
  }
  
  if (thresholds.memoryWarning < 50 || thresholds.memoryWarning > 100) {
    console.warn('Invalid memoryWarning threshold');
    return false;
  }
  
  // Validar coleção
  if (collection.interval < 1000 || collection.interval > 30000) {
    console.warn('Invalid collection interval');
    return false;
  }
  
  if (collection.maxHistorySize < 10 || collection.maxHistorySize > 1000) {
    console.warn('Invalid maxHistorySize');
    return false;
  }
  
  // Validar alertas
  if (alerts.thresholds.renderCount < 1 || alerts.thresholds.renderCount > 1000) {
    console.warn('Invalid renderCount threshold');
    return false;
  }
  
  return true;
};

// Hook para usar configuração
export const usePerformanceConfig = (): PerformanceConfig => {
  return getPerformanceConfig();
};

// Utility para criar configuração customizada
export const createCustomConfig = (overrides: Partial<PerformanceConfig>): PerformanceConfig => {
  const baseConfig = getPerformanceConfig();
  const customConfig = { ...baseConfig, ...overrides };
  
  if (!validateConfig(customConfig)) {
    console.warn('Custom config validation failed, falling back to default');
    return baseConfig;
  }
  
  return customConfig;
};

// Configurações predefinidas para diferentes tipos de aplicação
export const appTypeConfigs = {
  // Aplicação simples
  simple: createCustomConfig({
    thresholds: {
      renderTime: 20,
      mountTime: 200,
      apiResponse: 2000,
      memoryWarning: 85,
      memoryCritical: 95
    },
    collection: {
      interval: 10000,        // 10 segundos
      maxHistorySize: 50,     // 50 entries
      autoCleanup: true,
      debugMode: false
    }
  }),
  
  // Aplicação complexa
  complex: createCustomConfig({
    thresholds: {
      renderTime: 10,         // thresholds mais restritos
      mountTime: 50,
      apiResponse: 500,
      memoryWarning: 70,
      memoryCritical: 85
    },
    collection: {
      interval: 3000,         // 3 segundos
      maxHistorySize: 200,    // 200 entries
      autoCleanup: true,
      debugMode: true
    }
  }),
  
  // Aplicação em tempo real
  realtime: createCustomConfig({
    thresholds: {
      renderTime: 8,          // thresholds muito restritos
      mountTime: 30,
      apiResponse: 200,
      memoryWarning: 60,
      memoryCritical: 80
    },
    collection: {
      interval: 1000,         // 1 segundo
      maxHistorySize: 500,    // 500 entries
      autoCleanup: true,
      debugMode: true
    },
    alerts: {
      ...defaultConfig.alerts,
      enabled: true,
      consoleLogging: true,
      notifications: true
    }
  })
};

// Export de configuração
export const exportConfig = (config: PerformanceConfig, format: 'json' | 'ts' = 'json'): string => {
  if (format === 'ts') {
    return `export const performanceConfig = ${JSON.stringify(config, null, 2)};`;
  }
  
  return JSON.stringify(config, null, 2);
};

// Import de configuração
export const importConfig = (configString: string): PerformanceConfig | null => {
  try {
    const config = JSON.parse(configString);
    if (validateConfig(config)) {
      return config;
    }
  } catch (error) {
    console.error('Failed to import config:', error);
  }
  return null;
};

export default {
  defaultConfig,
  environmentConfigs,
  getPerformanceConfig,
  validateConfig,
  createCustomConfig,
  appTypeConfigs,
  exportConfig,
  importConfig
};