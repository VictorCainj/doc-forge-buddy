import { useEffect, useRef, useState, useCallback } from 'react';

export interface MemoryData {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  growthRate: number; // MB per second
  timestamp: number;
}

export interface MemoryOptions {
  interval?: number; // ms between measurements
  warningThreshold?: number; // % of heap limit
  criticalThreshold?: number; // % of heap limit
  onMemoryWarning?: (data: MemoryData) => void;
  onMemoryLeak?: (data: MemoryData) => void;
}

const DEFAULT_OPTIONS: Required<MemoryOptions> = {
  interval: 5000,
  warningThreshold: 70,
  criticalThreshold: 90,
  onMemoryWarning: () => {},
  onMemoryLeak: () => {}
};

/**
 * Hook para monitorar uso de memória e detectar memory leaks
 * @param options Opções de configuração
 * @returns Dados de memória e controles
 */
export const useMemoryUsage = (options: MemoryOptions = {}) => {
  const {
    interval = DEFAULT_OPTIONS.interval,
    warningThreshold = DEFAULT_OPTIONS.warningThreshold,
    criticalThreshold = DEFAULT_OPTIONS.criticalThreshold,
    onMemoryWarning,
    onMemoryLeak
  } = { ...DEFAULT_OPTIONS, ...options };

  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const memoryHistoryRef = useRef<{ timestamp: number; usedMB: number }[]>([]);

  const getMemoryData = useCallback((): MemoryData | null => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const timestamp = Date.now();
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const totalMB = memory.totalJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

    // Calcular pressão de memória
    const usagePercent = (usedMB / limitMB) * 100;
    let memoryPressure: 'low' | 'medium' | 'high' | 'critical';
    
    if (usagePercent >= criticalThreshold) {
      memoryPressure = 'critical';
    } else if (usagePercent >= warningThreshold) {
      memoryPressure = 'high';
    } else if (usagePercent >= warningThreshold * 0.7) {
      memoryPressure = 'medium';
    } else {
      memoryPressure = 'low';
    }

    // Adicionar ao histórico
    memoryHistoryRef.current.push({ timestamp, usedMB });
    if (memoryHistoryRef.current.length > 20) {
      memoryHistoryRef.current.shift();
    }

    // Calcular taxa de crescimento
    const history = memoryHistoryRef.current;
    let growthRate = 0;
    if (history.length >= 2) {
      const timeDiff = (history[history.length - 1].timestamp - history[0].timestamp) / 1000; // seconds
      const memoryDiff = history[history.length - 1].usedMB - history[0].usedMB;
      growthRate = timeDiff > 0 ? memoryDiff / timeDiff : 0;
    }

    const data: MemoryData = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedMB,
      totalMB,
      limitMB,
      memoryPressure,
      growthRate,
      timestamp
    };

    return data;
  }, [warningThreshold, criticalThreshold]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      const data = getMemoryData();
      if (data) {
        setMemoryData(data);
        
        // Verificar avisos
        if (data.memoryPressure === 'high' || data.memoryPressure === 'critical') {
          onMemoryWarning(data);
        }
        
        // Verificar potential memory leak
        if (data.growthRate > 0.1) { // 0.1 MB per second
          onMemoryLeak(data);
        }
      }
    }, interval);
  }, [interval, getMemoryData, onMemoryWarning, onMemoryLeak]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const getMemoryHistory = useCallback(() => {
    return [...memoryHistoryRef.current];
  }, []);

  const clearHistory = useCallback(() => {
    memoryHistoryRef.current = [];
  }, []);

  const forceGC = useCallback(() => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // Iniciar monitoramento automaticamente se suportado
    if (typeof window !== 'undefined' && 'memory' in performance) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    memoryData,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMemoryHistory,
    clearHistory,
    forceGC,
    isSupported: typeof window !== 'undefined' && 'memory' in performance
  };
};

/**
 * Hook específico para detectar memory leaks
 * @param componentName Nome do componente
 * @param options Opções de configuração
 * @returns Status de memory leak
 */
export const useMemoryLeakDetection = (
  componentName: string,
  options: MemoryOptions = {}
) => {
  const memoryUsage = useMemoryUsage(options);
  const [isLeaking, setIsLeaking] = useState(false);
  const leakDetectedRef = useRef(false);

  useEffect(() => {
    if (memoryUsage.memoryData) {
      const { growthRate, memoryPressure } = memoryUsage.memoryData;
      
      // Detectar leak baseado em crescimento contínuo
      const isGrowing = growthRate > 0.1; // 0.1 MB/s
      const isHighPressure = memoryPressure === 'high' || memoryPressure === 'critical';
      
      if (isGrowing && isHighPressure) {
        if (!leakDetectedRef.current) {
          setIsLeaking(true);
          leakDetectedRef.current = true;
          
          console.warn(
            `🧠 Potential memory leak detected in ${componentName}:\n` +
            `Growth rate: ${growthRate.toFixed(2)} MB/s\n` +
            `Memory pressure: ${memoryPressure}\n` +
            `Current usage: ${memoryUsage.memoryData.usedMB.toFixed(2)} MB`
          );
        }
      } else {
        leakDetectedRef.current = false;
        setIsLeaking(false);
      }
    }
  }, [memoryUsage.memoryData, componentName]);

  return {
    ...memoryUsage,
    isLeaking,
    hasMemoryApi: memoryUsage.isSupported
  };
};