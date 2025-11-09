// Exemplo prático de lazy loading para Doc Forge Buddy
// Implementação baseada no seu código atual

import { lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/loading-spinner';

// 1. LAZY LOADING DE BIBLIOTECAS PESADAS
const LazyExcel = lazy(() => 
  import('exceljs').then(module => ({ default: module.Workbook }))
);

const LazyChart = lazy(() => 
  import('react-chartjs-2').then(module => ({
    Bar: module.Bar,
    Line: module.Line,
    Doughnut: module.Doughnut
  }))
);

const LazyPDF = lazy(() => 
  import('jspdf').then(module => ({ default: module.default }))
);

// 2. LAZY LOADING DE PÁGINAS
const LazyAdminPage = lazy(() => import('@/pages/Admin'));
const LazyReportsPage = lazy(() => import('@/pages/Reports'));
const LazyPrestadoresPage = lazy(() => import('@/pages/Prestadores'));

// 3. LAZY LOADING DE COMPONENTES PESADOS
const LazyDocumentFormWizard = lazy(() => import('@/components/DocumentFormWizard'));
const LazyImageGallery = lazy(() => import('@/components/ImageGalleryModal'));

// 4. SKELETON COMPONENTS
const ChartSkeleton = () => (
  <Card className="p-6">
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-40 bg-gray-200 rounded"></div>
    </div>
  </Card>
);

const ExcelSkeleton = () => (
  <Card className="p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </Card>
);

// 5. HOC PARA SUSPENSE
const withSuspense = (Component, FallbackComponent = Spinner) => {
  return (props) => (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} />
    </Suspense>
  );
};

// 6. HOOK PARA LAZY LOADING
import { useState, useEffect, useRef } from 'react';

export const useLazyLoad = (importFunction, dependencies = []) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoaded && !isLoading) {
          setIsLoading(true);
          try {
            await importFunction();
            setIsLoaded(true);
          } catch (err) {
            setError(err);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );
    
    if (componentRef.current) {
      observer.observe(componentRef.current);
    }
    
    return () => observer.disconnect();
  }, dependencies);
  
  return { isLoaded, error, isLoading, componentRef };
};

// 7. COMPONENTE PRINCIPAL OTIMIZADO
const DashboardOptimized = () => {
  const [showCharts, setShowCharts] = useState(false);
  const [showExcel, setShowExcel] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Performance: Charts só carregam quando necessário */}
      <div className="mb-8">
        <button onClick={() => setShowCharts(true)}>
          Visualizar Gráficos
        </button>
        
        {showCharts && (
          <Suspense fallback={<ChartSkeleton />}>
            <DashboardCharts />
          </Suspense>
        )}
      </div>
      
      {/* Excel export só carrega quando exporta */}
      <div className="mb-8">
        <button onClick={() => setShowExcel(true)}>
          Exportar para Excel
        </button>
        
        {showExcel && (
          <Suspense fallback={<ExcelSkeleton />}>
            <ExcelExportComponent />
          </Suspense>
        )}
      </div>
      
      {/* PDF só carrega quando gera PDF */}
      <div className="mb-8">
        <button onClick={() => setShowPDF(true)}>
          Gerar PDF
        </button>
        
        {showPDF && (
          <Suspense fallback={<Spinner />}>
            <PDFGenerator />
          </Suspense>
        )}
      </div>
    </div>
  );
};

// 8. COMPONENTES OTIMIZADOS COM LAZY LOADING
const DashboardCharts = () => {
  const [ChartComponents, setChartComponents] = useState(null);
  
  useEffect(() => {
    // Lazy load charts apenas quando necessário
    import('react-chartjs-2').then(module => {
      setChartComponents({
        Bar: module.Bar,
        Line: module.Line,
        Doughnut: module.Doughnut
      });
    });
  }, []);
  
  if (!ChartComponents) {
    return <ChartSkeleton />;
  }
  
  return (
    <div className="charts-container">
      <h2>Gráficos de Performance</h2>
      {/* Componentes de gráfico usando ChartComponents */}
    </div>
  );
};

const ExcelExportComponent = () => {
  const [Excel, setExcel] = useState(null);
  
  useEffect(() => {
    // Lazy load Excel apenas quando necessário
    import('exceljs').then(module => {
      setExcel(module.Workbook);
    });
  }, []);
  
  if (!Excel) {
    return <ExcelSkeleton />;
  }
  
  const exportToExcel = async () => {
    const workbook = new Excel();
    // ... lógica de exportação
  };
  
  return (
    <div>
      <button onClick={exportToExcel}>
        Confirmar Exportação
      </button>
    </div>
  );
};

// 9. VITE CONFIGURAÇÃO OTIMIZADA
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas pesadas
          charts: ['react-chartjs-2', 'chart.js'],
          excel: ['exceljs'],
          pdf: ['jspdf', 'html2canvas'],
          office: ['docx', 'html2pdf'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog']
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  }
});

// 10. PREFETCH ESTRATÉGICO
// Prefetch apenas recursos necessários
const PrefetchLink = ({ to, children }) => {
  return (
    <Link 
      to={to}
      prefetch="intent" // Préfetch ao hover
    >
      {children}
    </Link>
  );
};

// INSTALAÇÃO
// 1. npm install react-window react-window-infinite-loader
// 2. Implementar os componentes acima
// 3. Atualizar vite.config.ts
// 4. Testar performance com lighthouse

// RESULTADO ESPERADO:
// ✅ Bundle inicial: 50% menor
// ✅ LCP (Largest Contentful Paint): -40%
// ✅ First Load: -30%
// ✅ Interação: Mais fluida
