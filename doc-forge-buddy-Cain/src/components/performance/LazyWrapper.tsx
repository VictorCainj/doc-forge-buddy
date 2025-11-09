import React, { ReactNode } from 'react';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSkeleton, ChartSkeleton } from './SkeletonComponents';

/**
 * Wrapper de Suspense com fallback customizado
 * Otimiza o carregamento de componentes lazy
 */
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  boundary?: boolean;
  className?: string;
}

export function LazyWrapper({
  children,
  fallback,
  boundary = true,
  className,
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <div className="text-sm text-gray-600">Carregando...</div>
      </div>
    </div>
  );

  if (boundary) {
    return (
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    );
  }

  return (
    <div className={cn(className)}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </div>
  );
}

/**
 * Componente para lazy loading com retry automático
 */
interface LazyComponentWithRetryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  boundary?: boolean;
}

export function LazyComponentWithRetry({
  children,
  fallback,
  onError,
  retryCount = 3,
  retryDelay = 1000,
  boundary = true,
}: LazyComponentWithRetryProps) {
  const [retryAttempts, setRetryAttempts] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  const handleError = (error: Error) => {
    setHasError(true);
    onError?.(error);
  };

  const handleRetry = () => {
    if (retryAttempts < retryCount) {
      setRetryAttempts(prev => prev + 1);
      setHasError(false);
    }
  };

  if (hasError && retryAttempts >= retryCount) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-sm">Erro ao carregar componente</div>
          <div className="text-gray-500 text-xs">
            Tentativas: {retryAttempts}/{retryCount}
          </div>
          <button
            onClick={handleRetry}
            className="text-sm text-blue-600 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <LazyWrapper fallback={fallback} boundary={boundary}>
      {hasError ? (
        <div className="flex items-center justify-center p-4">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Recarregar ({retryAttempts}/{retryCount})
          </button>
        </div>
      ) : (
        children
      )}
    </LazyWrapper>
  );
}

/**
 * Componente para lazy loading com preloading inteligente
 */
interface LazyComponentWithPreloadProps {
  children: ReactNode;
  preload?: () => void;
  preloadDelay?: number;
  boundary?: boolean;
  className?: string;
}

export function LazyComponentWithPreload({
  children,
  preload,
  preloadDelay = 1000,
  boundary = true,
  className,
}: LazyComponentWithPreloadProps) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  React.useEffect(() => {
    if (!preload) return;

    const timer = setTimeout(() => {
      preload();
      setIsPreloaded(true);
    }, preloadDelay);

    return () => clearTimeout(timer);
  }, [preload, preloadDelay]);

  return (
    <div className={cn('relative', className)}>
      <LazyWrapper boundary={boundary}>
        {children}
      </LazyWrapper>
      {isPreloaded && (
        <div className="absolute top-2 right-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          ✓ Pré-carregado
        </div>
      )}
    </div>
  );
}

/**
 * Componente para lazy loading com métricas
 */
export function LazyComponentWithMetrics({
  children,
  componentName,
  boundary = true,
  className,
}: {
  children: ReactNode;
  componentName: string;
  boundary?: boolean;
  className?: string;
}) {
  const [loadTime, setLoadTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
      console.log(`🚀 ${componentName} carregado em ${(endTime - startTime).toFixed(0)}ms`);
    };
  }, [componentName]);

  return (
    <div className={cn('relative', className)}>
      <LazyWrapper boundary={boundary}>
        {children}
      </LazyWrapper>
      {loadTime !== null && (
        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          {componentName}: {loadTime.toFixed(0)}ms
        </div>
      )}
    </div>
  );
}