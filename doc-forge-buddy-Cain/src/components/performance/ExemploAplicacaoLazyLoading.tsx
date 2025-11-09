import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LazyWrapper, 
  LazyComponentWithMetrics,
  usePreloadManager,
  useLazyLoad,
  TableSkeleton,
  CardSkeleton,
  TextSkeleton
} from '@/components/performance';

/**
 * EXEMPLO PRÁTICO: Como aplicar lazy loading em qualquer componente
 * Este arquivo demonstra diferentes técnicas de lazy loading
 * que podem ser aplicadas em componentes existentes
 */

// =============================================================================
// 1. EXEMPLO BÁSICO: Transformar componente estático em lazy loading
// =============================================================================

// ANTES (componente tradicional)
// import HeavyComponent from './HeavyComponent';
// function MyPage() {
//   return <HeavyComponent />;
// }

// DEPOIS (componente com lazy loading)
const HeavyComponent = lazy(() => import('./HeavyComponent').then(module => ({ 
  default: module.HeavyComponent 
})));

function ExemploBasico() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Exemplo Básico de Lazy Loading</h2>
      
      <LazyWrapper>
        <Suspense fallback={<CardSkeleton showHeader={true} contentLines={3} />}>
          <HeavyComponent />
        </Suspense>
      </LazyWrapper>
    </div>
  );
}

// =============================================================================
// 2. EXEMPLO MÉDIO: Componente com dados e lazy loading
// =============================================================================

// Componente que carrega dados pesados
const DataVisualization = lazy(() => 
  import('./DataVisualization').then(module => ({ 
    default: module.DataVisualization 
  }))
);

const DataTable = lazy(() => 
  import('./DataTable').then(module => ({ 
    default: module.DataTable 
  }))
);

function ExemploComDados() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { elementRef, isVisible } = useLazyLoad(0.2);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  // Carregar dados quando componente visível
  useEffect(() => {
    if (isVisible && !data.length) {
      loadData();
    }
  }, [isVisible, data.length]);

  // Carregar componentes quando visível
  useEffect(() => {
    if (isVisible && !componentsLoaded) {
      // Pré-carregar componentes após dados carregarem
      if (!loading) {
        setComponentsLoaded(true);
      }
    }
  }, [isVisible, loading, componentsLoaded]);

  const loadData = async () => {
    setLoading(true);
    // Simular carregamento de dados pesados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);
    setLoading(false);
  };

  return (
    <div className="p-6" ref={elementRef}>
      <h2 className="text-xl font-bold mb-4">Exemplo com Dados e Lazy Loading</h2>
      
      {!isVisible ? (
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualização de dados */}
          <LazyComponentWithMetrics 
            componentName="DataVisualization"
            className="mb-4"
          >
            <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={4} />}>
              <DataVisualization 
                data={data} 
                loading={loading}
              />
            </Suspense>
          </LazyComponentWithMetrics>

          {/* Tabela de dados */}
          <LazyComponentWithMetrics 
            componentName="DataTable"
            className="mb-4"
          >
            <Suspense fallback={<TableSkeleton rows={5} columns={3} />}>
              <DataTable 
                data={data} 
                loading={loading}
              />
            </Suspense>
          </LazyComponentWithMetrics>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 3. EXEMPLO AVANÇADO: Componente com preloading inteligente
// =============================================================================

const ChartComponent = lazy(() => 
  import('./ChartComponent').then(module => ({ 
    default: module.ChartComponent 
  }))
);

const ReportGenerator = lazy(() => 
  import('./ReportGenerator').then(module => ({ 
    default: module.ReportGenerator 
  }))
);

const ExportButtons = lazy(() => 
  import('./ExportButtons').then(module => ({ 
    default: module.ExportButtons 
  }))
);

function ExemploPreloadingInteligente() {
  const [activeTab, setActiveTab] = useState<'chart' | 'report' | 'export'>('chart');
  const [preloadedTabs, setPreloadedTabs] = useState<Set<string>>(new Set());
  const { preload, isPreloaded } = usePreloadManager();
  const [metrics, setMetrics] = useState<any[]>([]);

  // Preloading baseado em padrões de uso
  useEffect(() => {
    // Preload componentes mais usados após 2 segundos
    const timer = setTimeout(() => {
      preload('ChartComponent');
      preload('ExportButtons');
    }, 2000);

    return () => clearTimeout(timer);
  }, [preload]);

  // Preload tab ao hover
  const handleTabHover = (tab: 'chart' | 'report' | 'export') => {
    if (!preloadedTabs.has(tab)) {
      switch (tab) {
        case 'chart':
          preload('ChartComponent');
          break;
        case 'report':
          preload('ReportGenerator');
          break;
        case 'export':
          preload('ExportButtons');
          break;
      }
      setPreloadedTabs(prev => new Set([...prev, tab]));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Exemplo com Preloading Inteligente</h2>
      
      {/* Indicadores de preloading */}
      <div className="flex gap-2 mb-4">
        {(['chart', 'report', 'export'] as const).map(tab => (
          <div
            key={tab}
            className={`px-3 py-1 rounded text-xs ${
              preloadedTabs.has(tab) 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab}: {preloadedTabs.has(tab) ? '✅ Pré-carregado' : '⏳ Aguardando'}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['chart', 'report', 'export'] as const).map(tab => (
          <button
            key={tab}
            onMouseEnter={() => handleTabHover(tab)}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab === 'chart' && '📊 Gráfico'}
            {tab === 'report' && '📝 Relatório'}
            {tab === 'export' && '📤 Exportar'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        <LazyComponentWithMetrics componentName={activeTab}>
          <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={5} />}>
            {activeTab === 'chart' && <ChartComponent />}
            {activeTab === 'report' && <ReportGenerator />}
            {activeTab === 'export' && <ExportButtons />}
          </Suspense>
        </LazyComponentWithMetrics>
      </div>

      {/* Métricas */}
      <div className="mt-6 text-xs text-gray-500">
        <div>Componentes pré-carregados: {preloadedTabs.size}/3</div>
        <div>Tab ativa: {activeTab}</div>
      </div>
    </div>
  );
}

// =============================================================================
// 4. EXEMPLO DE REFATORAÇÃO: Transformar componente existente
// =============================================================================

// Componente ANTES da refatoração
function PainelAntigo() {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Carrega dados e gráficos de uma vez
    const [dados, grafico] = await Promise.all([
      fetchData(),
      loadChart()
    ]);
    setData(dados);
    setChartData(grafico);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Painel de Controle</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div>
            <div>Total de registros: {data.length}</div>
            <ChartComponent data={chartData} /> {/* Gráfico carregado sempre */}
            <ExportComponent /> {/* Componente de export carregado sempre */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente DEPOIS da refatoração
function PainelOtimizado() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { elementRef, isVisible } = useLazyLoad(0.3);
  const [showChart, setShowChart] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    // Carrega apenas os dados principais primeiro
    const dados = await fetchData();
    setData(dados);
    setLoading(false);
  };

  const loadChart = () => {
    if (!showChart) {
      setShowChart(true);
    }
  };

  const loadExport = () => {
    if (!showExport) {
      setShowExport(true);
    }
  };

  return (
    <Card ref={elementRef}>
      <CardHeader>
        <CardTitle>Painel de Controle Otimizado</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <CardSkeleton showHeader={false} contentLines={4} />
        ) : (
          <div className="space-y-4">
            <div>Total de registros: {data.length}</div>
            
            {/* Botões para carregar componentes pesados sob demanda */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadChart}
                disabled={showChart}
              >
                📊 {showChart ? 'Gráfico Carregado' : 'Carregar Gráfico'}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadExport}
                disabled={showExport}
              >
                📤 {showExport ? 'Export Carregado' : 'Carregar Export'}
              </Button>
            </div>

            {/* Componentes lazy loaded */}
            {showChart && (
              <LazyComponentWithMetrics componentName="ChartComponent">
                <Suspense fallback={<CardSkeleton showHeader={true} contentLines={3} />}>
                  <ChartComponent />
                </Suspense>
              </LazyComponentWithMetrics>
            )}

            {showExport && (
              <LazyComponentWithMetrics componentName="ExportComponent">
                <Suspense fallback={<CardSkeleton showHeader={true} contentLines={2} />}>
                  <ExportButtons />
                </Suspense>
              </LazyComponentWithMetrics>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// 5. EXEMPLO DE MIGRACAO: Lista de componentes para migrar
// =============================================================================

/**
 * CHECKLIST: Componentes que podem se beneficiar de lazy loading
 */

// ✅ JÁ OTIMIZADOS:
// - App.tsx (páginas principais)
// - DocumentoPublico.tsx (html2pdf, docx)
// - utils/exportContractsToExcel.ts (exceljs)
// - utils/docxGenerator.ts (docx)
// - Componentes de performance/*

// 🔄 RECOMENDADOS PARA OTIMIZAÇÃO:
// 
// 1. Componentes de Dashboard com gráficos
// 2. Listas grandes de contratos (> 100 items)
// 3. Modais de edição complexos
// 4. Componentes com upload de imagens
// 5. Wizards multi-step
// 6. Tabelas com paginação
// 7. Componentes de busca avançada
// 8. Mapas e geolocalização
// 9. Editores de texto rico
// 10. Componentes de calendário

// =============================================================================
// FUNÇÕES AUXILIARES (para exemplo)
// =============================================================================

async function fetchData() {
  // Simular fetch de dados
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 100
  }));
}

async function loadChart() {
  // Simular carregamento de gráfico
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    labels: ['Jan', 'Fev', 'Mar'],
    datasets: [{ data: [12, 19, 8] }]
  };
}

// Componentes placeholder para exemplo
const HeavyComponent = ({ children }: { children?: React.ReactNode }) => (
  <div className="p-4 bg-blue-50 rounded">
    <h3 className="font-bold">Componente Pesado Carregado!</h3>
    <p>Este componente é carregado sob demanda.</p>
    {children}
  </div>
);

const DataVisualization = ({ data, loading }: any) => (
  <div className="p-4">
    <h4>Visualização de Dados</h4>
    {loading ? <TextSkeleton lines={3} /> : <div>{data.length} itens</div>}
  </div>
);

const DataTable = ({ data, loading }: any) => (
  <div className="p-4">
    <h4>Tabela de Dados</h4>
    {loading ? <TextSkeleton lines={5} /> : <div>{data.length} registros</div>}
  </div>
);

const ChartComponent = () => <div className="p-4">📊 Gráfico de Barras</div>;
const ReportGenerator = () => <div className="p-4">📝 Gerador de Relatório</div>;
const ExportButtons = () => <div className="p-4">📤 Botões de Export</div>;

// =============================================================================
// COMPONENTE PRINCIPAL DE EXEMPLO
// =============================================================================

export function ExemploAplicacaoCompleta() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 Exemplo de Aplicação de Lazy Loading
        </h1>
        <p className="text-gray-600">
          Demonstrando diferentes técnicas de lazy loading que podem ser aplicadas
          em qualquer componente React
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <ExemploBasico />
        <ExemploComDados />
        <ExemploPreloadingInteligente />
        <PainelOtimizado />
      </div>
    </div>
  );
}

export default ExemploAplicacaoCompleta;