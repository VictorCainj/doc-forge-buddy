import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Interface para métricas de performance
 */
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  componentName: string;
  timestamp: number;
  propsSize: number;
  stateSize: number;
}

/**
 * Interface para análise de memoization
 */
interface MemoizationAnalysis {
  opportunities: MemoizationOpportunity[];
  inefficiencies: MemoizationInefficiency[];
  suggestions: string[];
  overallScore: number; // 0-100
}

/**
 * Interface para oportunidades de memoization
 */
interface MemoizationOpportunity {
  type: 'useMemo' | 'useCallback' | 'React.memo' | 'Context';
  component: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: number; // percentage
}

/**
 * Interface para ineficiências detectadas
 */
interface MemoizationInefficiency {
  type: 'unstable-dependency' | 'shallow-comparison' | 'missing-memo' | 'over-memoization';
  component: string;
  issue: string;
  current: string;
  recommended: string;
  performanceGain: number;
}

/**
 * Hook para monitorar performance de componentes
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef<number>();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    renderCountRef.current += 1;
    startTimeRef.current = performance.now();
  });

  const recordMetrics = useCallback((propsSize: number = 0, stateSize: number = 0) => {
    const renderTime = startTimeRef.current 
      ? performance.now() - startTimeRef.current 
      : 0;
    
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    const metric: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      reRenderCount: renderCountRef.current,
      componentName,
      timestamp: Date.now(),
      propsSize,
      stateSize,
    };
    
    setMetrics(metric);
    
    // Log performance warnings
    if (renderTime > 16) { // 60fps threshold
      console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
    
    return metric;
  }, [componentName]);

  return { metrics, recordMetrics, renderCount: renderCountRef.current };
}

/**
 * Hook para análise automática de memoization
 */
export function useMemoizationAnalyzer(componentName: string, props: any) {
  const [analysis, setAnalysis] = useState<MemoizationAnalysis | null>(null);
  const propsRef = useRef(props);
  const [reRenderCount, setReRenderCount] = useState(0);

  useEffect(() => {
    if (JSON.stringify(props) !== JSON.stringify(propsRef.current)) {
      setReRenderCount(prev => prev + 1);
      propsRef.current = props;
    }
  }, [props]);

  useEffect(() => {
    const analyzeComponent = () => {
      const opportunities: MemoizationOpportunity[] = [];
      const inefficiencies: MemoizationInefficiency[] = [];
      const suggestions: string[] = [];
      
      // Detectar prop changes
      if (reRenderCount > 5) {
        opportunities.push({
          type: 'React.memo',
          component: componentName,
          location: 'Component declaration',
          severity: 'high',
          description: 'Component re-renders frequently',
          impact: 'Performance degradation on prop changes',
          solution: 'Wrap component with React.memo',
          estimatedImprovement: 40
        });
      }
      
      // Detectar objetos e arrays em props
      const hasComplexProps = Object.entries(props).some(([key, value]) => 
        typeof value === 'object' && value !== null && !Array.isArray(value)
      );
      
      if (hasComplexProps) {
        opportunities.push({
          type: 'useMemo',
          component: componentName,
          location: 'Props processing',
          severity: 'medium',
          description: 'Complex objects in props need memoization',
          impact: 'Unnecessary re-computations',
          solution: 'Use useMemo for complex calculations',
          estimatedImprovement: 25
        });
      }
      
      // Detectar funções em props
      const hasFunctions = Object.entries(props).some(([key, value]) => 
        typeof value === 'function'
      );
      
      if (hasFunctions) {
        opportunities.push({
          type: 'useCallback',
          component: componentName,
          location: 'Event handlers',
          severity: 'medium',
          description: 'Functions cause child re-renders',
          impact: 'Child components re-render unnecessarily',
          solution: 'Wrap functions with useCallback',
          estimatedImprovement: 30
        });
      }
      
      // Calcular score geral
      const totalOpportunities = opportunities.length;
      const avgImprovement = opportunities.reduce((sum, opp) => sum + opp.estimatedImprovement, 0) / Math.max(totalOpportunities, 1);
      const overallScore = Math.max(0, 100 - (totalOpportunities * 10) - (reRenderCount * 5));
      
      if (overallScore < 70) {
        suggestions.push(`Consider memoizing ${componentName} - performance score: ${overallScore.toFixed(0)}/100`);
      }
      
      if (reRenderCount > 10) {
        suggestions.push(`${componentName} re-rendered ${reRenderCount} times - investigate prop stability`);
      }
      
      const analysisResult: MemoizationAnalysis = {
        opportunities,
        inefficiencies,
        suggestions,
        overallScore: Math.max(0, Math.min(100, overallScore))
      };
      
      setAnalysis(analysisResult);
    };
    
    analyzeComponent();
  }, [componentName, props, reRenderCount]);

  return { analysis, reRenderCount };
}

/**
 * Hook para detecção automática de dependências instáveis
 */
export function useUnstableDependencyDetector(componentName: string, deps: any[]) {
  const [instability, setInstability] = useState<{
    isUnstable: boolean;
    unstableDeps: number[];
    suggestions: string[];
  }>({ isUnstable: false, unstableDeps: [], suggestions: [] });

  const prevDepsRef = useRef<any[]>([]);
  const instabilityCountRef = useRef(0);

  useEffect(() => {
    const currentDeps = [...deps];
    const prevDeps = prevDepsRef.current;
    
    if (prevDeps.length > 0) {
      const unstableIndices: number[] = [];
      
      currentDeps.forEach((dep, index) => {
        const prevDep = prevDeps[index];
        if (typeof dep === 'object' && dep !== null) {
          // Deep comparison for objects
          if (JSON.stringify(dep) !== JSON.stringify(prevDep)) {
            unstableIndices.push(index);
          }
        } else if (dep !== prevDep) {
          // Simple comparison for primitives
          unstableIndices.push(index);
        }
      });
      
      if (unstableIndices.length > 0) {
        instabilityCountRef.current += 1;
      }
      
      setInstability({
        isUnstable: unstableIndices.length > 0,
        unstableDeps: unstableIndices,
        suggestions: unstableIndices.map(index => 
          `Dependency at index ${index} is unstable. Consider memoizing or using stable reference.`
        )
      });
    }
    
    prevDepsRef.current = currentDeps;
  }, [JSON.stringify(deps)]);

  return instability;
}

/**
 * Hook para automação de memoization suggestions
 */
export function useAutoMemoizationSuggestions(componentName: string, code: string) {
  const [suggestions, setSuggestions] = useState<{
    type: 'warning' | 'error' | 'info';
    message: string;
    fix: string;
    priority: number;
  }[]>([]);

  useEffect(() => {
    const analyzeCode = () => {
      const newSuggestions = [];
      
      // Detectar funções criadas dentro do componente
      const functionPattern = /const\s+(\w+)\s*=\s*\(\s*\)\s*=>/g;
      let match;
      const functions = [];
      while ((match = functionPattern.exec(code)) !== null) {
        functions.push(match[1]);
      }
      
      if (functions.length > 0) {
        newSuggestions.push({
          type: 'warning' as const,
          message: `Found ${functions.length} inline functions in ${componentName}`,
          fix: `Wrap functions with useCallback or move outside component`,
          priority: 8
        });
      }
      
      // Detectar objetos criados dentro do componente
      const objectPattern = /{\s*[^}]*:\s*[^}]*\s*}/g;
      const objects = [];
      while ((match = objectPattern.exec(code)) !== null) {
        objects.push(match[0]);
      }
      
      if (objects.length > 3) {
        newSuggestions.push({
          type: 'info' as const,
          message: `Found ${objects.length} object creations in ${componentName}`,
          fix: `Consider memoizing complex objects with useMemo`,
          priority: 5
        });
      }
      
      // Detectar arrays criados dentro do componente
      const arrayPattern = /\[\s*[^\]]*\s*]/g;
      const arrays = [];
      while ((match = arrayPattern.exec(code)) !== null) {
        arrays.push(match[0]);
      }
      
      if (arrays.length > 2) {
        newSuggestions.push({
          type: 'info' as const,
          message: `Found ${arrays.length} array creations in ${componentName}`,
          fix: `Consider memoizing arrays with useMemo`,
          priority: 4
        });
      }
      
      // Ordenar por prioridade
      newSuggestions.sort((a, b) => b.priority - a.priority);
      setSuggestions(newSuggestions);
    };
    
    analyzeCode();
  }, [code, componentName]);

  return suggestions;
}

/**
 * Função para calcular impacto de performance
 */
export function calculatePerformanceImpact(
  metrics: PerformanceMetrics[]
): {
  totalRenderTime: number;
  averageRenderTime: number;
  memoryGrowth: number;
  renderFrequency: number;
  bottlenecks: string[];
} {
  if (metrics.length === 0) {
    return {
      totalRenderTime: 0,
      averageRenderTime: 0,
      memoryGrowth: 0,
      renderFrequency: 0,
      bottlenecks: []
    };
  }

  const totalRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0);
  const averageRenderTime = totalRenderTime / metrics.length;
  
  const memoryGrowth = metrics.length > 1 
    ? metrics[metrics.length - 1].memoryUsage - metrics[0].memoryUsage
    : 0;
  
  const renderFrequency = metrics.length / ((metrics[metrics.length - 1].timestamp - metrics[0].timestamp) / 1000);
  
  const slowRenders = metrics.filter(m => m.renderTime > 16);
  const bottlenecks = slowRenders.map(m => `${m.componentName}: ${m.renderTime.toFixed(2)}ms`);

  return {
    totalRenderTime,
    averageRenderTime,
    memoryGrowth,
    renderFrequency,
    bottlenecks
  };
}

/**
 * Hook para reportar métricas de memoization
 */
export function useMemoizationReporter(componentName: string) {
  const reportData = useRef({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    memoizationOpportunities: 0,
    lastReportTime: 0
  });

  const report = useCallback((metrics: PerformanceMetrics) => {
    const data = reportData.current;
    data.renderCount += 1;
    data.totalRenderTime += metrics.renderTime;
    data.averageRenderTime = data.totalRenderTime / data.renderCount;
    
    // Report every 10 renders or 5 seconds
    if (data.renderCount % 10 === 0 || Date.now() - data.lastReportTime > 5000) {
      console.group(`[Memoization Report] ${componentName}`);
      console.log(`Total renders: ${data.renderCount}`);
      console.log(`Average render time: ${data.averageRenderTime.toFixed(2)}ms`);
      console.log(`Current render time: ${metrics.renderTime.toFixed(2)}ms`);
      console.log(`Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      console.groupEnd();
      
      data.lastReportTime = Date.now();
    }
  }, [componentName]);

  return { report, data: reportData.current };
}

// Export tipos
export type { 
  PerformanceMetrics, 
  MemoizationAnalysis, 
  MemoizationOpportunity, 
  MemoizationInefficiency 
};