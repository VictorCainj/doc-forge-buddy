import { useState, useCallback } from 'react';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Hook para criar boundary de erro personalizado
 * Útil para capturar erros em componentes específicos
 */
export function useErrorBoundary() {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
  });

  const reset = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }, []);

  const captureError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      setState({
        hasError: true,
        error,
        errorInfo,
      });
      
      // Log do erro para monitoramento
      console.error('ErrorBoundary capturou um erro:', error, errorInfo);
      
      // Aqui você pode enviar para serviço de monitoramento como Sentry
      if (typeof window !== 'undefined' && 'Sentry' in window) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
    },
    []
  );

  return {
    hasError: state.hasError,
    error: state.error,
    errorInfo: state.errorInfo,
    reset,
    captureError,
  };
}

export default useErrorBoundary;