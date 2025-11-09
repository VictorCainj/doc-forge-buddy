import React, { Suspense, lazy } from 'react';
import { useLazyLoad, useLazyImport, useLoadingMetrics } from '@/hooks/useLazyLoad';
import { FileSkeleton, ChartSkeleton } from './SkeletonComponents';
import { cn } from '@/lib/utils';

/**
 * Lazy Excel Component - Para exportação de dados
 */
const LazyExcelComponent = lazy(() => import('@/utils/exportContractsToExcel').then(module => ({ default: module })));
const LazyDashboardExcelComponent = lazy(() => import('@/utils/exportDashboardToExcel').then(module => ({ default: module })));

interface LazyExcelProps {
  type?: 'contracts' | 'dashboard';
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Componente lazy para funcionalidades do Excel
 * Usado para exportação de contratos e dashboard
 */
export function LazyExcel({
  type = 'contracts',
  className,
  fallback = <FileSkeleton type="excel" />,
  onLoad,
  onError,
}: LazyExcelProps) {
  const { component: ExcelModule, isLoading, error, load } = useLazyImport(() =>
    import('@/utils/exportContractsToExcel')
  );

  const { metrics, startLoad, endLoad } = useLoadingMetrics();

  const handleLoad = async () => {
    if (ExcelModule) return;
    
    startLoad();
    try {
      await load();
      endLoad();
      onLoad?.();
    } catch (err) {
      endLoad();
      onError?.(err as Error);
    }
  };

  // Usar useLazyLoad para carregar quando visível
  useLazyLoad();

  React.useEffect(() => {
    handleLoad();
  }, []);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (error) {
    return (
      <div className={cn('p-4 border border-red-200 rounded-lg bg-red-50', className)}>
        <p className="text-red-600 text-sm">Erro ao carregar módulo Excel</p>
        <button
          onClick={handleLoad}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!ExcelModule) {
    return <>{fallback}</>;
  }

  return (
    <div className={className}>
      {metrics.loadDuration > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          Carregado em {metrics.loadDuration.toFixed(0)}ms
        </div>
      )}
      {/* O componente Excel é usado como utilitário, não como JSX */}
      <div className="hidden">
        {React.createElement(LazyExcelComponent)}
      </div>
    </div>
  );
}

/**
 * Lazy Chart Component - Para gráficos
 */
const LazyChartJS = lazy(() => import('chart.js').then(module => ({ default: module })));
const LazyReactChartJS2 = lazy(() => import('react-chartjs-2').then(module => ({ default: module })));

interface LazyChartProps {
  type?: 'bar' | 'line' | 'pie' | 'doughnut';
  data?: any;
  options?: any;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Componente lazy para Chart.js
 * Carregamento dinâmico apenas quando necessário
 */
export function LazyChart({
  type = 'bar',
  data,
  options,
  className,
  fallback = <ChartSkeleton />,
  onLoad,
  onError,
}: LazyChartProps) {
  const { component: ChartJS, isLoading: chartLoading, load: loadChart } = useLazyImport(() =>
    import('chart.js')
  );
  
  const { component: ReactChartJS2, isLoading: reactChartLoading, load: loadReactChart } = useLazyImport(() =>
    import('react-chartjs-2')
  );

  const isLoading = chartLoading || reactChartLoading;

  const loadDependencies = async () => {
    if (ChartJS && ReactChartJS2) return;
    
    try {
      await Promise.all([loadChart(), loadReactChart()]);
      onLoad?.();
    } catch (err) {
      onError?.(err as Error);
    }
  };

  const { elementRef, isVisible } = useLazyLoad();

  React.useEffect(() => {
    if (isVisible) {
      loadDependencies();
    }
  }, [isVisible]);

  if (isLoading) {
    return (
      <div ref={elementRef}>
        {fallback}
      </div>
    );
  }

  if (!ChartJS || !ReactChartJS2) {
    return (
      <div className={cn('p-4 border border-yellow-200 rounded-lg bg-yellow-50', className)}>
        <p className="text-yellow-600 text-sm">Erro ao carregar biblioteca de gráficos</p>
        <button
          onClick={loadDependencies}
          className="mt-2 text-sm text-yellow-700 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Configurar Chart.js apenas uma vez
  React.useEffect(() => {
    if (ChartJS && !ChartJS.registered) {
      // Register Chart.js components (line, bar, pie, etc.)
      ChartJS.Chart.register(
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.PointElement,
        ChartJS.LineElement,
        ChartJS.BarElement,
        ChartJS.ArcElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend
      );
      ChartJS.registered = true;
    }
  }, [ChartJS]);

  return (
    <div ref={elementRef} className={className}>
      {React.createElement(ReactChartJS2[type], { data, options })}
    </div>
  );
}

/**
 * Lazy PDF Component - Para geração de PDFs
 */
const LazyPDFModule = lazy(() => import('@/utils/pdfExport').then(module => ({ default: module })));

interface LazyPDFProps {
  summary: string;
  userName: string;
  date: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  autoGenerate?: boolean;
}

/**
 * Componente lazy para funcionalidades de PDF
 */
export function LazyPDF({
  summary,
  userName,
  date,
  className,
  fallback = <FileSkeleton type="pdf" />,
  onLoad,
  onError,
  autoGenerate = false,
}: LazyPDFProps) {
  const { component: PDFModule, isLoading, error, load } = useLazyImport(() =>
    import('@/utils/pdfExport')
  );

  const { elementRef, isVisible } = useLazyLoad();
  const { metrics, startLoad, endLoad } = useLoadingMetrics();

  const loadPDFModule = async () => {
    if (PDFModule) return;
    
    startLoad();
    try {
      await load();
      endLoad();
      onLoad?.();
    } catch (err) {
      endLoad();
      onError?.(err as Error);
    }
  };

  React.useEffect(() => {
    if (isVisible) {
      loadPDFModule();
    }
  }, [isVisible]);

  const handleGeneratePDF = async () => {
    if (!PDFModule?.exportSummaryToPDF) return;
    
    startLoad();
    try {
      await PDFModule.exportSummaryToPDF(summary, userName, date);
      endLoad();
    } catch (err) {
      endLoad();
      onError?.(err as Error);
    }
  };

  if (isLoading) {
    return (
      <div ref={elementRef}>
        {fallback}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={elementRef} className={cn('p-4 border border-red-200 rounded-lg bg-red-50', className)}>
        <p className="text-red-600 text-sm">Erro ao carregar módulo PDF</p>
        <button
          onClick={loadPDFModule}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!PDFModule) {
    return (
      <div ref={elementRef}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={elementRef} className={className}>
      {metrics.loadDuration > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          Módulo PDF carregado em {metrics.loadDuration.toFixed(0)}ms
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={handleGeneratePDF}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Gerar PDF
        </button>
        
        <div className="text-xs text-gray-600">
          <p>Resumo: {summary.substring(0, 100)}...</p>
          <p>Usuário: {userName}</p>
          <p>Data: {date}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy DOCX Component - Para geração de documentos Word
 */
const LazyDocxModule = lazy(() => import('@/utils/docxGenerator').then(module => ({ default: module })));

interface LazyDocxProps {
  data: {
    title: string;
    date: string;
    content: string;
    signatures: {
      name1: string;
      name2: string;
    };
  };
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  autoDownload?: boolean;
}

/**
 * Componente lazy para funcionalidades de DOCX
 */
export function LazyDocx({
  data,
  className,
  fallback = <FileSkeleton type="docx" />,
  onLoad,
  onError,
  autoDownload = false,
}: LazyDocxProps) {
  const { component: DocxModule, isLoading, error, load } = useLazyImport(() =>
    import('@/utils/docxGenerator')
  );

  const { elementRef, isVisible } = useLazyLoad();
  const { metrics, startLoad, endLoad } = useLoadingMetrics();

  const loadDocxModule = async () => {
    if (DocxModule) return;
    
    startLoad();
    try {
      await load();
      endLoad();
      onLoad?.();
    } catch (err) {
      endLoad();
      onError?.(err as Error);
    }
  };

  React.useEffect(() => {
    if (isVisible) {
      loadDocxModule();
    }
  }, [isVisible]);

  const handleGenerateDocx = async () => {
    if (!DocxModule?.generateDocx || !DocxModule?.downloadDocx) return;
    
    startLoad();
    try {
      const blob = await DocxModule.generateDocx(data);
      const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${data.date}.docx`;
      DocxModule.downloadDocx(blob, fileName);
      endLoad();
    } catch (err) {
      endLoad();
      onError?.(err as Error);
    }
  };

  if (isLoading) {
    return (
      <div ref={elementRef}>
        {fallback}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={elementRef} className={cn('p-4 border border-red-200 rounded-lg bg-red-50', className)}>
        <p className="text-red-600 text-sm">Erro ao carregar módulo DOCX</p>
        <button
          onClick={loadDocxModule}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!DocxModule) {
    return (
      <div ref={elementRef}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={elementRef} className={className}>
      {metrics.loadDuration > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          Módulo DOCX carregado em {metrics.loadDuration.toFixed(0)}ms
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={handleGenerateDocx}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Gerar Documento Word
        </button>
        
        <div className="text-xs text-gray-600">
          <p>Título: {data.title}</p>
          <p>Data: {data.date}</p>
          <p>Assinantes: {data.signatures.name1} & {data.signatures.name2}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy Bundle Component - Para carregar múltiplas bibliotecas
 */
interface LazyBundleProps {
  libraries: ('excel' | 'chart' | 'pdf' | 'docx')[];
  className?: string;
  children: (loadedLibs: string[]) => React.ReactNode;
  onLoad?: (loadedLibs: string[]) => void;
  onError?: (error: Error, library: string) => void;
}

/**
 * Componente para carregar múltiplas bibliotecas em bundle
 */
export function LazyBundle({
  libraries,
  className,
  children,
  onLoad,
  onError,
}: LazyBundleProps) {
  const [loadedLibs, setLoadedLibs] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, Error>>({});

  const { elementRef, isVisible } = useLazyLoad();

  const loadLibraries = async () => {
    setIsLoading(true);
    const newLoadedLibs: string[] = [];
    const newErrors: Record<string, Error> = {};

    for (const lib of libraries) {
      try {
        switch (lib) {
          case 'excel':
            await import('@/utils/exportContractsToExcel');
            newLoadedLibs.push('excel');
            break;
          case 'chart':
            await import('chart.js');
            await import('react-chartjs-2');
            newLoadedLibs.push('chart');
            break;
          case 'pdf':
            await import('@/utils/pdfExport');
            newLoadedLibs.push('pdf');
            break;
          case 'docx':
            await import('@/utils/docxGenerator');
            newLoadedLibs.push('docx');
            break;
        }
      } catch (err) {
        newErrors[lib] = err as Error;
        onError?.(err as Error, lib);
      }
    }

    setLoadedLibs(newLoadedLibs);
    setErrors(newErrors);
    setIsLoading(false);
    
    if (newLoadedLibs.length > 0) {
      onLoad?.(newLoadedLibs);
    }
  };

  React.useEffect(() => {
    if (isVisible) {
      loadLibraries();
    }
  }, [isVisible]);

  if (isLoading) {
    return (
      <div ref={elementRef} className={cn('space-y-4', className)}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            <p className="text-gray-600">Carregando bibliotecas...</p>
            <div className="text-xs text-gray-500">
              {libraries.map(lib => (
                <span key={lib} className="mr-2">
                  {lib === 'excel' && '📊'}
                  {lib === 'chart' && '📈'}
                  {lib === 'pdf' && '📄'}
                  {lib === 'docx' && '📝'}
                  {lib}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (Object.keys(errors).length === libraries.length) {
    return (
      <div ref={elementRef} className={cn('p-4 border border-red-200 rounded-lg bg-red-50', className)}>
        <p className="text-red-600 text-sm mb-2">Erro ao carregar todas as bibliotecas</p>
        {Object.entries(errors).map(([lib, error]) => (
          <div key={lib} className="text-xs text-red-500">
            {lib}: {error.message}
          </div>
        ))}
        <button
          onClick={loadLibraries}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div ref={elementRef} className={className}>
      {children(loadedLibs)}
    </div>
  );
}

/**
 * Provider para pré-carregar bibliotecas
 */
export function LazyLibraryProvider({ children }: { children: React.ReactNode }) {
  const [preloadedLibs, setPreloadedLibs] = React.useState<Set<string>>(new Set());

  const preloadLibrary = async (libName: string) => {
    if (preloadedLibs.has(libName)) return;

    try {
      switch (libName) {
        case 'excel':
          await import('@/utils/exportContractsToExcel');
          break;
        case 'chart':
          await import('chart.js');
          await import('react-chartjs-2');
          break;
        case 'pdf':
          await import('@/utils/pdfExport');
          break;
        case 'docx':
          await import('@/utils/docxGenerator');
          break;
      }
      
      setPreloadedLibs(prev => new Set([...prev, libName]));
    } catch (error) {
      console.warn(`Falha ao pré-carregar biblioteca ${libName}:`, error);
    }
  };

  React.useEffect(() => {
    // Pré-carregar bibliotecas comuns após o carregamento inicial
    const timer = setTimeout(() => {
      preloadLibrary('excel');
      preloadLibrary('pdf');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}