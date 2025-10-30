import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException } from '@/lib/sentry';
import { log } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('🔴 Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Enviar para Sentry em produção
    if (import.meta.env.PROD) {
      captureException(error, {
        errorInfo: errorInfo.componentStack,
        boundary: 'ErrorBoundary',
      });
    }
  }

  handleReset = () => {
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
        <main role="main" aria-label="Erro na aplicação">
          <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-800">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-destructive text-lg">
                  <AlertTriangle className="h-6 w-6" />
                  Algo deu errado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-mono text-sm text-destructive">
                    {this.state.error?.message || 'Erro desconhecido'}
                  </p>
                </div>

                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="bg-muted/50 rounded-lg p-4">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Stack Trace (Dev Only)
                    </summary>
                    <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3">
                  <Button onClick={this.handleReset} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={() => (window.location.href = '/')}>
                    Voltar ao Início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
