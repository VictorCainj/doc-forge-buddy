import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LazyWrapper, 
  LazyComponentWithPreload, 
  usePreloadManager,
  useIdlePreloader,
  useInteractionPreloader 
} from '@/components/performance';
import { 
  TableSkeleton, 
  CardSkeleton, 
  DashboardSkeleton,
  TextSkeleton 
} from '@/components/performance/SkeletonComponents';

/**
 * Exemplos de implementação de lazy loading em páginas principais
 * Demonstra diferentes estratégias para diferentes tipos de conteúdo
 */

// 1. Lazy Loading básico com Suspense
const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
const LazyGerarDocumento = lazy(() => import('@/pages/GerarDocumento'));
const LazyAdmin = lazy(() => import('@/pages/Admin'));

// 2. Componentes de gráficos com lazy loading
const LazyAdvancedChart = lazy(() => import('@/components/performance/LazyChart'));

// 3. Modais com lazy loading
const LazyModal = lazy(() => import('@/components/performance/LazyModal'));

/**
 * Página principal com lazy loading estratégico
 */
export function PaginaPrincipalOtimizada() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard com Lazy Loading
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Dashboard com lazy loading básico */}
          <div className="lg:col-span-2">
            <LazyComponentWithPreload
              componentName="DashboardPrincipal"
              preload={() => import('@/pages/Dashboard')}
              preloadDelay={2000}
            >
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyDashboard />
              </Suspense>
            </LazyComponentWithPreload>
          </div>

          {/* Sidebar com estatísticas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<CardSkeleton showHeader={false} contentLines={4} />}>
                  <StatsComponente />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/gerar-documento'}
                  >
                    Gerar Documento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/admin'}
                  >
                    Painel Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de gráficos com lazy loading */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Análises e Gráficos
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Contratos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton rows={5} columns={3} />}>
                  <LazyChartSection />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desocupações Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton rows={5} columns={3} />}>
                  <LazyChartSection secondChart />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de documentos com lazy loading */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Documentos Recentes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LazyComponentWithPreload
                key={i}
                componentName={`DocumentoCard${i}`}
                preload={() => import('@/components/cards/ContractCard')}
                preloadDelay={1000 + (i * 200)}
              >
                <Suspense 
                  fallback={
                    <CardSkeleton showHeader={true} showContent={true} contentLines={3} />
                  }
                >
                  <DocumentoCardLazy index={i} />
                </Suspense>
              </LazyComponentWithPreload>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de estatísticas que pode ser lazy loaded
 */
const StatsComponente = React.lazy(() => {
  return import('@/components/StatsComponente').then(module => ({
    default: module.StatsComponente
  }));
});

/**
 * Seção de gráficos com lazy loading inteligente
 */
function LazyChartSection({ secondChart = false }: { secondChart?: boolean }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Preloader baseado em intersection observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return <div ref={chartRef} className="h-64" />;
  }

  // Dados simulados para demonstração
  const chartData = secondChart ? {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [{
      label: 'Desocupações',
      data: [12, 19, 8, 5, 2, 3],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
    }]
  } : {
    labels: ['Ativos', 'Finalizados', 'Suspensos', 'Cancelados'],
    datasets: [{
      label: 'Contratos',
      data: [300, 150, 50, 25],
      backgroundColor: [
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(153, 102, 255, 0.2)',
      ],
    }]
  };

  return (
    <LazyAdvancedChart
      type={secondChart ? 'line' : 'doughnut'}
      data={chartData}
      className="h-64"
      onLoad={() => console.log(`Gráfico ${secondChart ? '2' : '1'} carregado!`)}
    />
  );
}

/**
 * Card de documento com lazy loading
 */
function DocumentoCardLazy({ index }: { index: number }) {
  // Simula dados do documento
  const documentData = {
    id: `doc-${index + 1}`,
    title: `Documento ${index + 1}`,
    date: new Date().toLocaleDateString('pt-BR'),
    status: ['Finalizado', 'Rascunho', 'Aguardando'][index % 3],
    type: ['Contrato', 'Vistoria', 'Rescisão'][index % 3],
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{documentData.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tipo:</span>
            <span className="font-medium">{documentData.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className="font-medium">{documentData.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Data:</span>
            <span className="font-medium">{documentData.date}</span>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full">
            Visualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente com preloader baseado em idle time
 */
export function PaginaComIdlePreloading() {
  const { preload, isPreloaded } = usePreloadManager();

  // Estratégia de preloading baseada em idle time
  const { preload: preloadIdle } = useIdlePreloader({
    id: 'PaginaIdle',
    trigger: 'idle',
    delay: 2000,
    dependencies: ['StatsComponente', 'ChartComponent'],
  });

  React.useEffect(() => {
    // Preload componentes após carregamento da página
    preloadIdle();
  }, [preloadIdle]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Página com Idle Preloading</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Componente pré-carregado */}
        <LazyComponentWithPreload
          componentName="StatsComponente"
          preload={() => import('@/components/StatsComponente')}
        >
          <Suspense fallback={<CardSkeleton showHeader={true} contentLines={3} />}>
            <StatsComponente />
          </Suspense>
        </LazyComponentWithPreload>

        {/* Componente com preloader baseado em interação */}
        <InteractionPreloadedComponent />
      </div>
    </div>
  );
}

/**
 * Componente pré-carregado baseado em interação
 */
function InteractionPreloadedComponent() {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  // Preloader baseado em interação do usuário
  useInteractionPreloader(
    buttonRef,
    {
      id: 'InteractionPreload',
      trigger: 'interaction',
      dependencies: ['ModalComponent'],
    }
  );

  const { preload } = usePreloadManager();

  const handleClick = () => {
    if (buttonRef.current) {
      buttonRef.current.disabled = true;
      // Simular carregamento de modal
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.disabled = false;
        }
      }, 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Componente com Preloading de Interação</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Este componente será pré-carregado quando você passar o mouse sobre o botão
        </p>
        <Button 
          ref={buttonRef}
          onClick={handleClick}
          className="w-full"
        >
          Interagir (ativa preloading)
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Página com modais lazy loaded
 */
export function PaginaComModaisLazy() {
  const [showModal, setShowModal] = React.useState(false);
  const [modalType, setModalType] = React.useState<'ai-task' | 'document-wizard'>('ai-task');

  const openModal = (type: 'ai-task' | 'document-wizard') => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Página com Modais Lazy</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Modais Carregados Sob Demanda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => openModal('ai-task')}
                className="w-full"
              >
                Abrir Modal de IA
              </Button>
              <Button 
                variant="outline"
                onClick={() => openModal('document-wizard')}
                className="w-full"
              >
                Abrir Assistente de Documento
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Modal carregado: {showModal ? '✅' : '⏳'}</div>
              <div>Tipo: {modalType}</div>
              <div>Lazy loading: Ativo</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal lazy loaded */}
      {showModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg">
              <div className="text-center">Carregando modal...</div>
            </div>
          </div>
        }>
          <LazyModal
            type={modalType}
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            props={{
              // Props específicas do modal
              title: modalType === 'ai-task' ? 'Nova Tarefa com IA' : 'Assistente de Documento',
            }}
            size="lg"
          />
        </Suspense>
      )}
    </div>
  );
}