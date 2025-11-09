/**
 * Feature Error Boundary - Captura erros específicos de componentes/features
 * Permite recovery granular sem afetar toda a rota ou aplicação
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, X } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { log } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  featureName?: string;
  allowRecovery?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  featureName: string;
  retryCount: number;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      featureName: props.featureName || 'Unknown Feature',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `feature-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detalhado
    log.error('🟢 Feature Error Boundary:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      featureName: this.state.featureName,
      retryCount: this.state.retryCount,
    });

    // Adicionar breadcrumb
    addBreadcrumb({
      message: `Feature error in ${this.state.featureName}`,
      category: 'error',
      level: 'error',
      data: {
        errorId: this.state.errorId,
        featureName: this.state.featureName,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Enviar para Sentry
    captureException(error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      boundaryType: 'feature',
      featureName: this.state.featureName,
      retryCount: this.state.retryCount,
    });

    // Chamar callback
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      addBreadcrumb({
        message: `Retrying feature ${this.state.featureName} (attempt ${this.state.retryCount + 1})`,
        category: 'user',
        level: 'info',
        data: { 
          featureName: this.state.featureName, 
          errorId: this.state.errorId,
          retryCount: this.state.retryCount + 1,
        },
      });
    }
  };

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    addBreadcrumb({
      message: `Dismissed error in feature ${this.state.featureName}`,
      category: 'user',
      level: 'info',
      data: { featureName: this.state.featureName, errorId: this.state.errorId },
    });
  };

  private handleReload = () => {
    addBreadcrumb({
      message: `Reloading page due to feature error in ${this.state.featureName}`,
      category: 'user',
      level: 'info',
      data: { featureName: this.state.featureName, errorId: this.state.errorId },
    });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { compact = false, showDetails = import.meta.env.DEV } = this.props;

      if (compact) {
        return (
          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                  Erro em: {this.state.featureName}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 truncate">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>
              <div className="flex gap-1">
                {this.state.retryCount < this.maxRetries && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={this.handleRetry}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {showDetails && this.state.errorInfo && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-red-600 dark:text-red-400">
                  Detalhes técnicos
                </summary>
                <pre className="mt-1 text-xs overflow-auto max-h-20 text-red-500 dark:text-red-400 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        );
      }

      return (
        <div className="p-4">
          <Card className="max-w-md w-full mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    Erro no componente
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {this.state.featureName}
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {this.state.error?.message || 'Erro desconhecido'}
                  </p>
                </div>

                {showDetails && this.state.errorInfo && (
                  <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <summary className="cursor-pointer font-semibold text-sm mb-2">
                      Stack Trace
                    </summary>
                    <pre className="text-xs overflow-auto max-h-32 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex flex-col gap-2">
                  {this.state.retryCount < this.maxRetries && (
                    <Button 
                      onClick={this.handleRetry}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  )}
                  <Button 
                    onClick={this.handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                  {this.state.retryCount >= this.maxRetries && (
                    <Button 
                      onClick={this.handleReload}
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Recarregar Página
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para wrappear componentes facilmente
export function withFeatureErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  options?: {
    allowRecovery?: boolean;
    showDetails?: boolean;
    compact?: boolean;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <FeatureErrorBoundary
        featureName={featureName}
        allowRecovery={options?.allowRecovery}
        showDetails={options?.showDetails}
        compact={options?.compact}
      >
        <Component {...props} />
      </FeatureErrorBoundary>
    );
  };
}

export default FeatureErrorBoundary;