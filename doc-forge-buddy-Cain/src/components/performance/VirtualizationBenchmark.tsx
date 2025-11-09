import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { VirtualizedTable } from '@/components/ui/virtualized-table';
import { VirtualizedGrid } from '@/components/ui/virtualized-grid';
import { DynamicVirtualizedList } from '@/components/ui/dynamic-virtualized-list';
import { SmartVirtualizedContainer } from '@/components/ui/smart-virtualized-container';
import { Play, Pause, RotateCcw, BarChart3, MemoryStick, Zap } from '@/utils/iconMapper';

// Tipos para os dados de teste
interface TestItem {
  id: number;
  name: string;
  description: string;
  category: string;
  value: number;
  createdAt: string;
  tags: string[];
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  scrollPerformance: number;
  domNodes: number;
  cacheHitRate: number;
  virtualizationEfficiency: number;
}

// Utilitários para geração de dados
const generateTestData = (count: number): TestItem[] => {
  const categories = ['Contratos', 'Documentos', 'Usuários', 'Relatórios', 'Análises'];
  const tags = ['importante', 'urgente', 'revisao', 'aprovado', 'pendente', 'arquivado'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `Descrição detalhada do item ${i + 1}. Este é um texto de exemplo que pode variar em tamanho para testar a renderização de conteúdo de diferentes tamanhos.`,
    category: categories[i % categories.length],
    value: Math.floor(Math.random() * 10000) / 100,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    tags: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => 
      tags[Math.floor(Math.random() * tags.length)]
    ),
    metadata: {
      priority: Math.floor(Math.random() * 5) + 1,
      status: ['ativo', 'inativo', 'pending'][Math.floor(Math.random() * 3)],
      customData: Array.from({ length: 10 }, (_, j) => ({
        key: `key${j}`,
        value: `value${j}-${i}`
      }))
    }
  }));
};

// Componente de renderização para listas
const renderListItem = (item: TestItem, index: number) => (
  <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-neutral-900 mb-1">
            {item.name}
          </h3>
          <p className="text-xs text-neutral-600 mb-2 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
            <span className="text-xs text-neutral-500">
              R$ {item.value.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Colunas para tabelas
const tableColumns = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'name', title: 'Nome', width: 200 },
  { key: 'category', title: 'Categoria', width: 120 },
  { key: 'value', title: 'Valor', width: 100, render: (value: number) => `R$ ${value.toFixed(2)}` },
  { key: 'createdAt', title: 'Criado em', width: 150, render: (date: string) => new Date(date).toLocaleDateString('pt-BR') },
  { key: 'description', title: 'Descrição', width: 300 }
];

// Hook para monitorar performance
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
    scrollPerformance: 100,
    domNodes: 0,
    cacheHitRate: 0,
    virtualizationEfficiency: 0,
  });

  const startTime = useRef<number>();
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());

  const startMeasure = () => {
    startTime.current = performance.now();
  };

  const endMeasure = (elementCount: number) => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        virtualizationEfficiency: elementCount > 0 ? (100 - (elementCount / 1000) * 100) : 100,
      }));
    }
  };

  const measureFPS = () => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCount.current = 0;
      lastFrameTime.current = now;
    }
    
    requestAnimationFrame(measureFPS);
  };

  const updateMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
      }));
    }
    
    requestAnimationFrame(updateMemory);
  };

  useEffect(() => {
    measureFPS();
    updateMemory();
  }, []);

  return { metrics, startMeasure, endMeasure };
};

// Componente principal de teste
export const VirtualizationBenchmark: React.FC = () => {
  const [itemCount, setItemCount] = useState(1000);
  const [listType, setListType] = useState<'list' | 'table' | 'grid' | 'dynamic'>('list');
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState<TestItem[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceMetrics>('renderTime');
  
  const { metrics, startMeasure, endMeasure } = usePerformanceMonitor();
  const containerRef = useRef<HTMLDivElement>(null);

  // Gerar dados de teste
  const generateData = useMemo(() => {
    return () => {
      setTestData(generateTestData(itemCount));
    };
  }, [itemCount]);

  // Iniciar/parar teste
  const toggleTest = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      startMeasure();
      generateData();
      setIsRunning(true);
      
      // Medir após renderização
      setTimeout(() => {
        if (containerRef.current) {
          const domNodes = containerRef.current.querySelectorAll('*').length;
          endMeasure(domNodes);
        }
      }, 100);
    }
  };

  // Resetar teste
  const resetTest = () => {
    setIsRunning(false);
    setTestData([]);
    generateData();
  };

  // Efeito para monitorar mudanças
  useEffect(() => {
    if (isRunning) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const domNodes = containerRef.current.querySelectorAll('*').length;
          endMeasure(domNodes);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [testData, listType, isRunning]);

  // Teste com diferentes tipos de lista
  const renderTestList = () => {
    const commonProps = {
      data: testData,
      loading: false,
      emptyMessage: 'Gerando dados...',
      className: 'w-full',
      virtualizationEnabled: true,
    };

    switch (listType) {
      case 'table':
        return (
          <VirtualizedTable
            {...commonProps}
            columns={tableColumns}
            height={600}
            stickyHeader
          />
        );
      
      case 'grid':
        return (
          <VirtualizedGrid
            {...commonProps}
            renderItem={renderListItem}
            itemWidth={350}
            itemHeight={200}
            containerHeight={600}
          />
        );
      
      case 'dynamic':
        return (
          <DynamicVirtualizedList
            {...commonProps}
            renderItem={renderListItem}
            estimatedItemSize={120}
            height={600}
          />
        );
      
      default:
        return (
          <VirtualizedList
            {...commonProps}
            renderItem={renderListItem}
            itemHeight={120}
            containerHeight={600}
          />
        );
    }
  };

  // Quick tests para diferentes tamanhos
  const quickTests = [
    { name: '100', count: 100 },
    { name: '1K', count: 1000 },
    { name: '5K', count: 5000 },
    { name: '10K', count: 10000 },
    { name: '50K', count: 50000 },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Benchmark de Virtualização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tipo de Lista:</label>
              <select
                value={listType}
                onChange={(e) => setListType(e.target.value as any)}
                className="px-3 py-1 border rounded"
              >
                <option value="list">Lista</option>
                <option value="table">Tabela</option>
                <option value="grid">Grid</option>
                <option value="dynamic">Dinâmica</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Itens:</label>
              <input
                type="number"
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                min="1"
                max="100000"
                className="w-24 px-2 py-1 border rounded"
              />
            </div>

            <Button
              onClick={toggleTest}
              variant={isRunning ? "destructive" : "default"}
              className="gap-2"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Parar' : 'Iniciar'} Teste
            </Button>

            <Button
              onClick={resetTest}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Quick tests */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Testes Rápidos:</span>
            {quickTests.map(({ name, count }) => (
              <Button
                key={count}
                size="sm"
                variant="outline"
                onClick={() => setItemCount(count)}
                disabled={isRunning}
              >
                {name}
              </Button>
            ))}
          </div>

          {/* Métricas de performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">FPS</div>
                <div className="text-lg font-bold">{metrics.fps}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Memória (MB)</div>
                <div className="text-lg font-bold">{metrics.memoryUsage.toFixed(1)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Render (ms)</div>
                <div className="text-lg font-bold">{metrics.renderTime.toFixed(1)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Eficiência</div>
              <div className="text-lg font-bold">
                <Badge variant={metrics.virtualizationEfficiency > 90 ? "default" : "destructive"}>
                  {metrics.virtualizationEfficiency.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de teste */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Teste</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Itens: {testData.length.toLocaleString()}</span>
            <span>Tipo: {listType}</span>
            <span>Status: {isRunning ? 'Executando' : 'Parado'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="w-full">
            {isRunning && testData.length > 0 ? (
              renderTestList()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Play className="h-8 w-8 mb-4" />
                <p>Configure os parâmetros e inicie o teste para ver a performance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparação de performance */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Métricas de Renderização</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tempo de Renderização:</span>
                  <span className="font-mono">{metrics.renderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>FPS Médio:</span>
                  <span className="font-mono">{metrics.fps} fps</span>
                </div>
                <div className="flex justify-between">
                  <span>Eficiência da Virtualização:</span>
                  <span className="font-mono">{metrics.virtualizationEfficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Métricas de Sistema</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Uso de Memória:</span>
                  <span className="font-mono">{metrics.memoryUsage.toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance de Scroll:</span>
                  <span className="font-mono">{metrics.scrollPerformance}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Acerto do Cache:</span>
                  <span className="font-mono">{(metrics.cacheHitRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualizationBenchmark;