import { useState, useRef, useCallback, useEffect } from 'react';

export interface ApiCallData {
  id: string;
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  size?: number;
  error?: string;
  timestamp: number;
}

export interface ApiPerformanceStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  p50: number;
  p90: number;
  p99: number;
  errorRate: number;
  throughput: number; // calls per minute
  totalDataTransferred: number;
  slowestCall: ApiCallData | null;
  fastestCall: ApiCallData | null;
}

export interface ApiOptions {
  trackResponseSize?: boolean;
  trackHeaders?: boolean;
  slowThreshold?: number; // ms
  errorThreshold?: number; // % of calls
  onSlowCall?: (data: ApiCallData) => void;
  onError?: (data: ApiCallData) => void;
  maxHistorySize?: number;
}

const DEFAULT_OPTIONS: Required<ApiOptions> = {
  trackResponseSize: true,
  trackHeaders: false,
  slowThreshold: 1000, // 1 second
  errorThreshold: 10, // 10%
  onSlowCall: () => {},
  onError: () => {},
  maxHistorySize: 100
};

class ApiPerformanceMonitor {
  private callHistory: ApiCallData[] = [];
  private subscribers: Set<(stats: ApiPerformanceStats) => void> = new Set();

  constructor(private options: Required<ApiOptions>) {}

  recordCall(call: Omit<ApiCallData, 'id' | 'timestamp'>): ApiCallData {
    const id = this.generateId();
    const timestamp = Date.now();
    
    const fullCall: ApiCallData = {
      ...call,
      id,
      timestamp
    };

    // Adicionar ao histórico
    this.callHistory.push(fullCall);
    if (this.callHistory.length > this.options.maxHistorySize) {
      this.callHistory.shift();
    }

    // Notificar subscribers
    this.notifySubscribers();

    // Verificar thresholds
    if (call.duration > this.options.slowThreshold) {
      this.options.onSlowCall(fullCall);
    }

    if (!call.success) {
      this.options.onError(fullCall);
    }

    return fullCall;
  }

  getStats(timeWindowMs: number = 300000): ApiPerformanceStats { // 5 minutos padrão
    const now = Date.now();
    const recentCalls = this.callHistory.filter(
      call => now - call.timestamp <= timeWindowMs
    );

    const totalCalls = recentCalls.length;
    const successfulCalls = recentCalls.filter(call => call.success).length;
    const failedCalls = totalCalls - successfulCalls;

    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageResponseTime: 0,
        p50: 0,
        p90: 0,
        p99: 0,
        errorRate: 0,
        throughput: 0,
        totalDataTransferred: 0,
        slowestCall: null,
        fastestCall: null
      };
    }

    // Calcular tempos
    const durations = recentCalls
      .map(call => call.duration)
      .sort((a, b) => a - b);

    const averageResponseTime = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const p50 = this.getPercentile(durations, 0.5);
    const p90 = this.getPercentile(durations, 0.9);
    const p99 = this.getPercentile(durations, 0.99);

    // Calcular taxa de erro
    const errorRate = (failedCalls / totalCalls) * 100;

    // Calcular throughput (calls per minute)
    const throughput = (totalCalls / (timeWindowMs / 1000)) * 60;

    // Calcular dados transferidos
    const totalDataTransferred = recentCalls
      .filter(call => call.size)
      .reduce((sum, call) => sum + (call.size || 0), 0);

    // Encontrar calls mais lento e mais rápido
    const slowestCall = recentCalls.reduce((slowest, call) => 
      !slowest || call.duration > slowest.duration ? call : slowest
    , null as ApiCallData | null);

    const fastestCall = recentCalls.reduce((fastest, call) => 
      !fastest || call.duration < fastest.duration ? call : fastest
    , null as ApiCallData | null);

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime,
      p50,
      p90,
      p99,
      errorRate,
      throughput,
      totalDataTransferred,
      slowestCall,
      fastestCall
    };
  }

  subscribe(callback: (stats: ApiPerformanceStats) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const stats = this.getStats();
    this.subscribers.forEach(callback => callback(stats));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  getCallHistory(): ApiCallData[] {
    return [...this.callHistory];
  }

  clearHistory(): void {
    this.callHistory = [];
    this.notifySubscribers();
  }
}

const globalApiMonitor = new ApiPerformanceMonitor(DEFAULT_OPTIONS);

/**
 * Hook para monitorar performance de API calls
 * @param options Opções de configuração
 * @returns Stats de performance e função para fetch com monitoring
 */
export const useApiPerformance = (options: ApiOptions = {}) => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const [stats, setStats] = useState<ApiPerformanceStats>(() => 
    globalApiMonitor.getStats()
  );
  const monitorRef = useRef(globalApiMonitor);

  // Atualizar opções do monitor
  useEffect(() => {
    monitorRef.current = new ApiPerformanceMonitor(finalOptions);
  }, [finalOptions]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = monitorRef.current.subscribe(setStats);
    return unsubscribe;
  }, []);

  const fetchWithMonitoring = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const startTime = performance.now();
    const method = options.method || 'GET';

    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Calcular tamanho da resposta
      let size: number | undefined;
      if (finalOptions.trackResponseSize && response.headers) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          size = parseInt(contentLength, 10);
        }
      }

      const callData = monitorRef.current.recordCall({
        url,
        method,
        startTime,
        endTime,
        duration,
        status: response.status,
        success: response.ok,
        size,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      monitorRef.current.recordCall({
        url,
        method,
        startTime,
        endTime,
        duration,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [finalOptions.trackResponseSize]);

  const getCallHistory = useCallback(() => {
    return monitorRef.current.getCallHistory();
  }, []);

  const clearHistory = useCallback(() => {
    monitorRef.current.clearHistory();
  }, []);

  const getStats = useCallback((timeWindowMs?: number) => {
    return monitorRef.current.getStats(timeWindowMs);
  }, []);

  return {
    stats,
    fetchWithMonitoring,
    getCallHistory,
    clearHistory,
    getStats,
    isSupported: typeof fetch !== 'undefined'
  };
};

/**
 * Hook para monitorar performance de operações async
 * @param operationName Nome da operação
 * @returns Função wrapped que retorna Promise com monitoring
 */
export const useAsyncOperationMonitor = (operationName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastOperation, setLastOperation] = useState<ApiCallData | null>(null);

  const executeWithMonitoring = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    setIsLoading(true);

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      const callData: ApiCallData = {
        id: Math.random().toString(36).substr(2, 9),
        url: operationName,
        method: 'OPERATION',
        startTime,
        endTime,
        duration,
        status: 200,
        success: true,
        timestamp: Date.now()
      };

      setLastOperation(callData);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const callData: ApiCallData = {
        id: Math.random().toString(36).substr(2, 9),
        url: operationName,
        method: 'OPERATION',
        startTime,
        endTime,
        duration,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };

      setLastOperation(callData);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operationName]);

  return {
    executeWithMonitoring,
    isLoading,
    lastOperation
  };
};