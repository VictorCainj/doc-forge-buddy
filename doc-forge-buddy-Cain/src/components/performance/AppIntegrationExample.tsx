/**
 * Exemplo de Integração do Sistema de Performance Monitoring
 * Mostra como integrar o sistema completo no App principal
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  PerformanceDashboard, 
  ReactProfilerWrapper, 
  PerformanceDemo 
} from '@/components/performance';
import { 
  usePerformanceMonitor,
  useRenderTime,
  withPerformanceMonitoring 
} from '@/hooks/performance';
import '@/App.css';

// Componente de exemplo com monitoring automático
const Navbar = withPerformanceMonitoring(
  ({ children }: { children: React.ReactNode }) => {
    const renderData = useRenderTime('Navbar');
    
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">My App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Render: {renderData.renderTime.toFixed(1)}ms
              </span>
              {children}
            </div>
          </div>
        </div>
      </nav>
    );
  },
  { componentName: 'Navbar' }
);

// Página principal com monitoring
const HomePage: React.FC = () => {
  const performanceData = usePerformanceMonitor({
    componentName: 'HomePage',
    enableRenderTracking: true,
    enableMemoryTracking: true,
    enableApiTracking: true,
    onPerformanceIssue: (issue) => {
      console.warn('Performance issue in HomePage:', issue);
      // Aqui você pode enviar para analytics ou notificar o time
    }
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Home Page</h2>
            <p className="text-gray-600 mb-4">
              Esta página está sendo monitorada com performance tracking
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Render Time</div>
                <div className="font-mono">{performanceData.renderTime?.renderTime?.toFixed(2) || 0}ms</div>
              </div>
              <div>
                <div className="text-gray-500">Memory</div>
                <div className="font-mono">
                  {performanceData.memoryUsage?.usedMB?.toFixed(1) || 0} MB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Página de demonstração
const DemoPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <PerformanceDemo />
      </div>
    </div>
  );
};

// App principal com todas as integrações
const App: React.FC = () => {
  return (
    <ReactProfilerWrapper
      id="App"
      enableAdvancedMetrics={true}
      threshold={20}
      exportData={process.env.NODE_ENV === 'development'}
    >
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Performance Dashboard Global */}
          <PerformanceDashboard
            componentName="App"
            showRealTimeData={process.env.NODE_ENV === 'development'}
            autoRefresh={true}
            refreshInterval={3000}
            enableAlerts={true}
            position="overlay"
            enableProfiler={true}
          />
          
          <Navbar>
            <div className="text-sm text-gray-500">
              Performance Monitoring Ativo
            </div>
          </Navbar>
          
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ReactProfilerWrapper>
  );
};

export default App;