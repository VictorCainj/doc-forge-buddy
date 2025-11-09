/**
 * Global Error Boundary - Captura erros de toda a aplicação
 * É o primeiro nível de defesa contra erros não tratados
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Sentry } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { log } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `global-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detalhado
    log.error('🔴 Global Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
    });

    // Adicionar breadcrumb para Sentry
    addBreadcrumb({
      message: 'Global error boundary triggered',
      category: 'error',
      level: 'fatal',
      data: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
      },
    });

    // Enviar para Sentry
    captureException(error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      boundaryType: 'global',
      retryCount: this.retryCount,
    });

    // Chamar callback personalizado
    this.props.onError?.(error, errorInfo);

    // Report to external monitoring (e.g., analytics)
    this.reportToMonitoring(error, errorInfo);
  }

  private reportToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    // Send to analytics platform
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: this.state.errorId,
          component_stack: errorInfo.componentStack,
        },
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      addBreadcrumb({
        message: `Retrying after global error (attempt ${this.retryCount})`,
        category: 'user',
        level: 'info',
        data: { errorId: this.state.errorId, retryCount: this.retryCount },
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } else {
      this.handleReload();
    }
  };

  private handleReload = () => {
    addBreadcrumb({
      message: 'Reloading page after max retries',
      category: 'user',
      level: 'info',
      data: { errorId: this.state.errorId },
    });

    window.location.reload();
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <Sentry className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-700 dark:text-red-300">
                Ops! Algo deu muito errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p>Um erro inesperado ocorreu. Nossa equipe foi notificada automaticamente.</p>
                <p className="text-sm mt-2">
                  ID do erro: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{this.state.errorId}</code>
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Detalhes do erro:
                </h3>
                <p className="font-mono text-sm text-red-700 dark:text-red-300 break-all">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Stack Trace Completo (Dev Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    Tentar Novamente ({this.maxRetries - this.retryCount} tentativas restantes)
                  </Button>
                )}
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Reset do Estado
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Recarregar Página
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Se o problema persistir, entre em contato com nosso suporte técnico.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;