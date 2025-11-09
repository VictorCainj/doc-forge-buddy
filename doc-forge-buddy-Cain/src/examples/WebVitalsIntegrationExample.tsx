/**
 * Exemplo de integração do Web Vitals no App.tsx
 * Este arquivo mostra como integrar o sistema completo de monitoramento
 */

import React, { useEffect } from 'react';
import { 
  initializeWebVitalsSystem,
  getWebVitalsSystem,
  WebVitalsUtils
} from '../lib/web-vitals';
import { WebVitalsMonitor } from '../components/performance/WebVitalsMonitor';
import { PerformanceDashboard } from '../components/performance/PerformanceDashboard';

// Exemplo de componente que usa o monitor
const WebVitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Inicializar sistema de Web Vitals
    const initializePerformance = async () => {
      try {
        const system = await initializeWebVitalsSystem({
          // Configurações customizadas
          thresholds: {
            FCP: { good: 1500, poor: 2500 }, // thresholds mais agressivos
            LCP: { good: 2000, poor: 3500 },
            FID: { good: 80, poor: 250 },
            CLS: { good: 0.05, poor: 0.15 },
            TTFB: { good: 600, poor: 1500 }
          },
          collection: {
            sampleRate: 1.0, // 100% dos usuários
            bufferSize: 500, // buffer menor
            flushInterval: 3000, // 3 segundos
            enableAlerts: true,
            enableStorage: true,
            enableCustomMetrics: true
          },
          analytics: {
            // Google Analytics ID se disponível
            googleAnalyticsId: process.env.REACT_APP_GA_MEASUREMENT_ID,
            enableSentry: true,
            enableLighthouse: true,
            endpoints: [] // endpoints customizados
          }
        });

        console.log('✅ Web Vitals system initialized');
        
        // Marcar início da aplicação
        WebVitalsUtils.mark('app-start');
        
        // Configurar listener para alertas
        if (system) {
          const monitor = system.getMonitor();
          if (monitor) {
            monitor.subscribe((metrics) => {
              console.log('📊 New Web Vitals metrics:', metrics);
            });
          }
        }

      } catch (error) {
        console.error('❌ Failed to initialize Web Vitals:', error);
      }
    };

    // Só inicializar se não estiver em ambiente de teste
    if (!WebVitalsUtils.isTestEnvironment()) {
      initializePerformance();
    }
  }, []);

  return <>{children}</>;
};

// Exemplo de componente de performance para desenvolvimento
const DevelopmentPerformanceTools: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Monitor compacto no canto */}
      <WebVitalsMonitor
        componentName="App"
        position="top-right"
        size="compact"
        showOnGoodPerformance={false}
        onAlert={(metric) => {
          console.warn('🚨 Performance Alert:', metric);
          // Aqui você pode integrar com notificações, Slack, etc.
        }}
      />
      
      {/* Dashboard completo acessível via URL */}
      {/* Este seria renderizado em uma rota separada como /performance */}
    </>
  );
};

// Componente de página que demonstra o uso
const PerformanceDemoPage: React.FC = () => {
  const webVitals = useWebVitals({
    autoStart: true,
    enableAlerts: true
  });

  // Exemplo de medição de performance de função
  const handleExpensiveOperation = async () => {
    const result = webVitals.measureFunction(
      'expensive-operation',
      () => {
        // Simular operação cara
        const data = [];
        for (let i = 0; i < 100000; i++) {
          data.push(Math.random());
        }
        return data.length;
      }
    );
    
    console.log('Operation result:', result);
  };

  // Exemplo de monitoramento de API
  const handleAPICall = () => {
    webVitals.mark('api-call-start');
    
    fetch('/api/some-endpoint')
      .then(response => response.json())
      .then(data => {
        webVitals.mark('api-call-end');
        const duration = webVitals.measure('api-call', 'api-call-start', 'api-call-end');
        console.log('API call duration:', duration, 'ms');
      })
      .catch(error => {
        webVitals.mark('api-call-error');
        console.error('API call failed:', error);
      });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Performance Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Web Vitals Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Score Geral: {webVitals.getOverallScore()}</div>
              <div>Métricas Coletadas: {webVitals.metrics.length}</div>
              <div>Status: {webVitals.getStatus().isGood ? 'Bom' : 'Precisa Melhorar'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testes de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={handleExpensiveOperation}>
                Testar Operação Cara
              </Button>
              <Button onClick={handleAPICall}>
                Testar API Call
              </Button>
              <Button onClick={() => webVitals.clear()}>
                Limpar Métricas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard completo */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceDashboard />
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper principal da aplicação com Web Vitals
const AppWithWebVitals: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WebVitalsProvider>
      {children}
      <DevelopmentPerformanceTools />
    </WebVitalsProvider>
  );
};

// Exemplo de como usar em rotas
const PerformanceRouteWrapper: React.FC<{ 
  component: React.ComponentType;
  componentName: string;
}> = ({ component: Component, componentName }) => {
  const webVitals = useComponentPerformance(componentName);

  return (
    <WebVitalsMonitor
      componentName={componentName}
      position="bottom-left"
      size="full"
      showOnGoodPerformance={false}
    />
  );
};

// Hook personalizado para performance de páginas
const usePagePerformance = (pageName: string) => {
  const webVitals = useComponentPerformance(pageName);

  useEffect(() => {
    // Marcar início da página
    webVitals.mark(`${pageName}-page-start`);

    // Cleanup ao desmontar
    return () => {
      webVitals.mark(`${pageName}-page-end`);
      const duration = webVitals.measure(
        `${pageName}-page-lifecycle`,
        `${pageName}-page-start`,
        `${pageName}-page-end`
      );
      console.log(`📊 ${pageName} page lifecycle:`, duration, 'ms');
    };
  }, [pageName]);

  return webVitals;
};

// Exemplo de integração no App.tsx principal
export const AppWithPerformanceMonitoring: React.FC = () => {
  return (
    <AppWithWebVitals>
      <ErrorBoundary>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BrowserRouter>
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/login" element={
                      <PerformanceRouteWrapper 
                        component={LoginPage} 
                        componentName="LoginPage" 
                      />
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <PerformanceRouteWrapper 
                          component={DashboardPage} 
                          componentName="DashboardPage" 
                        />
                      </ProtectedRoute>
                    } />
                    <Route path="/performance-demo" element={
                      <PerformanceRouteWrapper 
                        component={PerformanceDemoPage} 
                        componentName="PerformanceDemoPage" 
                      />
                    } />
                    <Route path="/performance" element={
                      <ProtectedRoute>
                        <PerformanceDashboard />
                      </ProtectedRoute>
                    } />
                    {/* outras rotas... */}
                  </Routes>
                </AnimatePresence>
              </BrowserRouter>
            </AuthProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ErrorBoundary>
      
      {/* Toast notifications */}
      <Toaster />
      <Sonner />
    </AppWithWebVitals>
  );
};

// Exemplo de configuração de CI/CD para performance
export const performanceCIConfig = {
  // Configuração para GitHub Actions
  githubActions: {
    runs: 3,
    budgets: {
      FCP: 1800,
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800
    },
    thresholds: {
      performanceScore: 0.9, // 90%
      accessibilityScore: 0.9,
      bestPracticesScore: 0.9,
      seoScore: 0.9
    }
  },
  
  // Configuração para outros CI
  generic: {
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.2 }],
        'max-potential-fid': ['error', { maxNumericValue: 200 }]
      }
    }
  }
};

export default {
  WebVitalsProvider,
  DevelopmentPerformanceTools,
  PerformanceDemoPage,
  AppWithWebVitals,
  PerformanceRouteWrapper,
  usePagePerformance,
  performanceCIConfig
};