/**
 * Route Error Boundary - Captura erros específicos de rotas/pages
 * Permite recovery específico por rota sem afetar toda a aplicação
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { log } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  routeName?: string;
  allowRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  routeName: string;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      routeName: props.routeName || 'Unknown Route',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `route-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detalhado
    log.error('🟡 Route Error Boundary:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      routeName: this.state.routeName,
    });

    // Adicionar breadcrumb
    addBreadcrumb({
      message: `Route error in ${this.state.routeName}`,
      category: 'error',
      level: 'error',
      data: {
        errorId: this.state.errorId,
        routeName: this.state.routeName,
        componentStack: errorInfo.componentStack,
      },
    });

    // Enviar para Sentry
    captureException(error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      boundaryType: 'route',
      routeName: this.state.routeName,
    });

    // Chamar callback
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    addBreadcrumb({
      message: `Retrying route ${this.state.routeName}`,
      category: 'user',
      level: 'info',
      data: { routeName: this.state.routeName, errorId: this.state.errorId },
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoBack = () => {
    addBreadcrumb({
      message: `Navigating back from failed route ${this.state.routeName}`,
      category: 'navigation',
      level: 'info',
      data: { routeName: this.state.routeName },
    });

    // Use navigate if available, otherwise use window history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  private handleGoHome = () => {
    addBreadcrumb({
      message: `Navigating home from failed route ${this.state.routeName}`,
      category: 'navigation',
      level: 'info',
      data: { routeName: this.state.routeName },
    });

    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full w-fit">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-xl text-yellow-700 dark:text-yellow-300">
                Erro na página
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p>Não foi possível carregar esta página.</p>
                <p className="text-sm mt-2">
                  <strong>Página:</strong> {this.state.routeName}
                </p>
                <p className="text-xs mt-1">
                  ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="font-mono text-sm text-yellow-800 dark:text-yellow-200 break-all">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm mb-2">
                    Stack Trace (Dev)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {this.props.allowRecovery !== false && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                <Button 
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar com Router
export function useRouteErrorBoundary(routeName: string) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const enhancedRouteName = routeName || location.pathname;

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    log.warn('Route error handled:', { route: enhancedRouteName, error: error.message });
    
    // Optionally navigate away or take other recovery action
    if (error.message.includes('ChunkLoadError')) {
      // Handle chunk loading errors
      setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 1000);
    }
  };

  return {
    RouteErrorBoundary: (props: Omit<Props, 'routeName' | 'onError'>) => (
      <RouteErrorBoundary
        {...props}
        routeName={enhancedRouteName}
        onError={handleError}
        allowRecovery={true}
      />
    ),
  };
}

export default RouteErrorBoundary;