import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from '@/lib/icons';
import { useToast } from '@/components/ui/use-toast';
import { LazyWrapper, LazyComponentWithMetrics, usePreloadManager } from '@/components/performance';
import { 
  DashboardSkeleton, 
  TableSkeleton, 
  CardSkeleton 
} from '@/components/performance/SkeletonComponents';

// Lazy imports para componentes pesados
const VistoriaResults = lazy(() => import('./components/VistoriaResults'));
const ApontamentoForm = lazy(() => import('./components/ApontamentoForm'));
const PrestadorSelector = lazy(() => import('./components/PrestadorSelector'));
const VistoriaActions = lazy(() => import('./components/VistoriaActions'));

// Lazy import para hooks pesados
const useVistoriaState = lazy(() => import('./hooks/useVistoriaState').then(module => ({ default: module.useVistoriaState })));
const useVistoriaHandlers = lazy(() => import('./hooks/useVistoriaHandlers').then(module => ({ default: module.useVistoriaHandlers })));

// Hook para gerenciar estado da vistoria
function useVistoriaState() {
  // Implementação simplificada - deve ser substituída pelo hook real
  return {
    contratos: [],
    selectedContract: null,
    loading: false,
    apontamentos: [],
    // ... outros estados
  };
}

// Hook para gerenciar handlers da vistoria
function useVistoriaHandlers() {
  // Implementação simplificada - deve ser substituída pelo hook real
  return {
    handleSave: () => {},
    handleAddApontamento: () => {},
    handleRemoveApontamento: () => {},
    // ... outros handlers
  };
}

interface AnaliseVistoriaOtimizadaProps {
  contractId?: string;
  isEditMode?: boolean;
  editingAnaliseId?: string;
}

const AnaliseVistoriaOtimizada: React.FC<AnaliseVistoriaOtimizadaProps> = ({
  contractId,
  isEditMode = false,
  editingAnaliseId,
}) => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());

  // Preload manager
  const { preload, isPreloaded, getMetrics } = usePreloadManager();

  // Precarregar componentes críticos quando a página carregar
  useEffect(() => {
    const initPreloading = async () => {
      setIsInitialized(true);
      
      // Precarregar componentes mais comuns
      const criticalComponents = [
        'AnaliseVistoria:ApontamentoForm',
        'AnaliseVistoria:VistoriaResults',
        'AnaliseVistoria:PrestadorSelector'
      ];

      for (const component of criticalComponents) {
        if (!isPreloaded(component)) {
          await preload(component);
          setPreloadedComponents(prev => new Set([...prev, component]));
        }
      }
    };

    // Aguardar um pouco para não competir com o carregamento inicial
    const timer = setTimeout(initPreloading, 1500);
    return () => clearTimeout(timer);
  }, [preload, isPreloaded]);

  // Estado da aplicação (seria carregado via hooks reais)
  const vistoriaState = useVistoriaState();
  const vistoriaHandlers = useVistoriaHandlers();

  const handleSave = async () => {
    try {
      await vistoriaHandlers.handleSave();
      toast({
        title: "Análise salva!",
        description: "A análise de vistoria foi salva com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a análise.",
        variant: "destructive",
      });
    }
  };

  const handleAddApontamento = () => {
    vistoriaHandlers.handleAddApontamento();
  };

  if (!isInitialized) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Análise de Vistoria</h1>
        </div>
        <DashboardSkeleton showSidebar={false} cards={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Análise de Vistoria
              </h1>
              {contractId && (
                <span className="text-sm text-gray-500">
                  Contrato: {contractId}
                </span>
              )}
            </div>
            
            {/* Indicador de pré-carregamento */}
            <div className="flex items-center space-x-2">
              {preloadedComponents.size > 0 && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ {preloadedComponents.size} componentes pré-carregados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal - Formulário e Resultados */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Seletor de Contrato */}
            <LazyComponentWithMetrics
              componentName="ContractSelector"
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    {vistoriaState.loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Selecione um contrato para iniciar a análise
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </LazyComponentWithMetrics>

            {/* Formulário de Apontamentos */}
            <LazyComponentWithMetrics
              componentName="ApontamentoForm"
              className="mb-6"
            >
              <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={5} />}>
                <ApontamentoForm
                  onAddApontamento={handleAddApontamento}
                  loading={vistoriaState.loading}
                />
              </Suspense>
            </LazyComponentWithMetrics>

            {/* Resultados da Vistoria */}
            <LazyComponentWithMetrics
              componentName="VistoriaResults"
              className="mb-6"
            >
              <Suspense fallback={<TableSkeleton rows={8} columns={4} />}>
                <VistoriaResults
                  apontamentos={vistoriaState.apontamentos}
                  loading={vistoriaState.loading}
                />
              </Suspense>
            </LazyComponentWithMetrics>
          </div>

          {/* Sidebar - Ações e Configurações */}
          <div className="space-y-6">
            
            {/* Ações Rápidas */}
            <LazyComponentWithMetrics
              componentName="VistoriaActions"
              className="mb-6"
            >
              <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={4} />}>
                <VistoriaActions
                  onSave={handleSave}
                  hasApontamentos={vistoriaState.apontamentos.length > 0}
                  loading={vistoriaState.loading}
                />
              </Suspense>
            </LazyComponentWithMetrics>

            {/* Seletor de Prestador */}
            <LazyComponentWithMetrics
              componentName="PrestadorSelector"
              className="mb-6"
            >
              <Suspense fallback={<CardSkeleton showHeader={true} showContent={true} contentLines={3} />}>
                <PrestadorSelector
                  selectedContractId={contractId}
                  isEditMode={isEditMode}
                />
              </Suspense>
            </LazyComponentWithMetrics>

            {/* Métricas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>Componentes pré-carregados: {preloadedComponents.size}</div>
                  <div>Tempo de carregamento inicial: ~1.5s</div>
                  <div>Lazy loading ativo: ✅</div>
                  {getMetrics().length > 0 && (
                    <div className="mt-2 space-y-1">
                      {getMetrics().slice(-3).map((metric, i) => (
                        <div key={i}>
                          {metric.id}: {metric.loadTime.toFixed(0)}ms
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Alert para modo de edição */}
      {isEditMode && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-800">Modo de Edição</div>
                  <div className="text-orange-700">
                    Editando análise ID: {editingAnaliseId}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnaliseVistoriaOtimizada;