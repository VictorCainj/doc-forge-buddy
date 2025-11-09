// Configurações de query por ambiente e tipo
export interface QueryConfig {
  staleTime: number;
  gcTime: number;
  retry: number;
  mutationRetry: number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  networkMode: 'online' | 'offline' | 'always';
}

export const getQueryConfig = (): QueryConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isTest = import.meta.env.MODE === 'test';
  
  // Configurações base para desenvolvimento
  if (isDevelopment) {
    return {
      staleTime: 30 * 1000, // 30 segundos em dev para ver mudanças rapidamente
      gcTime: 5 * 60 * 1000, // 5 minutos
      retry: 1, // Menos retries em dev
      mutationRetry: 0, // Sem retry em mutações em dev
      refetchOnWindowFocus: true, // Refetch ao focar janela em dev
      refetchOnReconnect: true,
      networkMode: 'online'
    };
  }
  
  // Configurações para produção
  if (isTest) {
    return {
      staleTime: 0,
      gcTime: 0,
      retry: 0,
      mutationRetry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: 'always'
    };
  }
  
  // Configurações de produção otimizadas
  return {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    mutationRetry: 1,
    refetchOnWindowFocus: false, // Não refetch ao focar para evitar spams
    refetchOnReconnect: true, // Refetch ao reconectar
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos para dados críticos
    refetchIntervalInBackground: true,
    networkMode: 'online'
  };
};

// Configurações específicas por entidade
export const entitySpecificConfig = {
  // Dados de usuário - sempre frescos
  user: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true
  },
  
  // Contratos - dados importantes
  contracts: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false
  },
  
  // Vistorias - dados dinâmicos
  vistorias: {
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos
    refetchOnWindowFocus: true
  },
  
  // Analytics - dados em tempo real
  analytics: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch a cada minuto
    refetchIntervalInBackground: true
  },
  
  // Settings - dados estáticos
  settings: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    refetchOnWindowFocus: false
  }
};

// Estrategias de retry por tipo de erro
export const retryStrategies = {
  // Erro de rede - retry com backoff exponencial
  network: {
    retry: (failureCount: number, error: any) => {
      if (failureCount >= 3) return false;
      if (error?.status === 401) return false; // Não retry auth errors
      if (error?.status === 403) return false; // Não retry forbidden
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  },
  
  // Erro 5xx - retry agressivo
  serverError: {
    retry: (failureCount: number, error: any) => {
      return failureCount < 5 && error?.status >= 500;
    },
    retryDelay: (attemptIndex) => 2000 * (attemptIndex + 1)
  },
  
  // Erro 4xx - não retry
  clientError: {
    retry: (failureCount: number, error: any) => {
      return false; // Nunca retry erros do cliente
    }
  }
};