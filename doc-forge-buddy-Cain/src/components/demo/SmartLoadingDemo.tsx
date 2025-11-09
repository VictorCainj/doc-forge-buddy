import React, { useState, useEffect } from 'react';
import { useSmartFeatureLoading } from '@/hooks/useBehaviorBasedLoading';
import { useSmartImport } from '@/hooks/useSmartImport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, BarChart3, FileText, Cpu, Zap } from '@/lib/icons';

/**
 * Componente de demonstração do sistema de Smart Loading
 * Mostra como implementar code splitting inteligente em qualquer página
 */
export default function SmartLoadingDemo() {
  const [activeFeature, setActiveFeature] = useState<string>('docs');

  // Exemplos de uso dos hooks de smart loading
  const docsFeature = useSmartFeatureLoading('docs');
  const pdfFeature = useSmartFeatureLoading('pdf');
  const chartsFeature = useSmartFeatureLoading('charts');
  const adminFeature = useSmartFeatureLoading('admin');
  const aiFeature = useSmartFeatureLoading('ai');
  const animationFeature = useSmartFeatureLoading('animation');

  // Exemplo de uso direto do hook useSmartImport
  const { component: DocumentComponent, loading, error, loadTime } = useSmartImport({
    type: 'docs',
    enabled: true,
    preload: true,
  });

  const features = [
    {
      id: 'docs',
      name: 'Documentos',
      icon: FileText,
      feature: docsFeature,
      description: 'Carregamento de bibliotecas de documentos (docx, exceljs)',
      color: 'bg-blue-500',
    },
    {
      id: 'pdf',
      name: 'PDF',
      icon: Download,
      feature: pdfFeature,
      description: 'Carregamento de bibliotecas PDF (html2pdf, jspdf)',
      color: 'bg-red-500',
    },
    {
      id: 'charts',
      name: 'Gráficos',
      icon: BarChart3,
      feature: chartsFeature,
      description: 'Carregamento de bibliotecas de gráficos (Chart.js, Recharts)',
      color: 'bg-green-500',
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: Cpu,
      feature: adminFeature,
      description: 'Carregamento de funcionalidades administrativas',
      color: 'bg-purple-500',
    },
    {
      id: 'ai',
      name: 'IA',
      icon: Zap,
      feature: aiFeature,
      description: 'Carregamento de bibliotecas de IA (OpenAI)',
      color: 'bg-yellow-500',
    },
    {
      id: 'animation',
      name: 'Animações',
      icon: Loader2,
      feature: animationFeature,
      description: 'Carregamento de bibliotecas de animação (Framer Motion)',
      color: 'bg-pink-500',
    },
  ];

  const handleManualLoad = (featureType: string) => {
    setActiveFeature(featureType);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Smart Loading Demo</h1>
        <p className="text-muted-foreground">
          Demonstração do sistema de code splitting inteligente com carregamento baseado em comportamento
        </p>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real do carregamento inteligente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de Features</span>
                <Badge variant="secondary">{features.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Carregadas</span>
                <Badge variant="default" className="bg-green-500">
                  {features.filter(f => f.feature.component).length}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Em Carregamento</span>
                <Badge variant="outline">
                  {features.filter(f => f.feature.loading).length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit Rate</span>
                <Badge variant="secondary">
                  {Math.round((features.filter(f => f.feature.isCached).length / features.length) * 100)}%
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Score Médio</span>
                <Badge variant="secondary">
                  {Math.round(features.reduce((acc, f) => acc + f.feature.usageScore, 0) / features.length * 100)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Atividade</span>
                <Badge variant={docsFeature.isHighActivityUser ? "default" : "outline"}>
                  {docsFeature.isHighActivityUser ? "Alta" : "Normal"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ id, name, icon: Icon, feature, description, color }) => (
          <Card 
            key={id} 
            className={`cursor-pointer transition-all ${
              activeFeature === id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleManualLoad(id)}
            data-feature={id}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
                  {name}
                </CardTitle>
                {feature.shouldPreload && (
                  <Badge variant="secondary" className="text-xs">
                    Preload
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status e Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <span className="font-medium">
                    {feature.loading ? 'Carregando...' : 
                     feature.component ? 'Carregado' : 
                     feature.error ? 'Erro' : 'Aguardando'}
                  </span>
                </div>
                
                <Progress 
                  value={feature.usageScore * 100} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Score de Uso</span>
                  <span>{Math.round(feature.usageScore * 100)}%</span>
                </div>
              </div>

              {/* Métricas */}
              <div className="space-y-1 text-xs">
                {feature.component && (
                  <div className="flex justify-between">
                    <span>✓ Carregado</span>
                    <span className="text-green-600">Cache {feature.isCached ? 'HIT' : 'MISS'}</span>
                  </div>
                )}
                
                {feature.loading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                )}
                
                {feature.error && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      Erro: {feature.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    feature.loadComponent();
                  }}
                  disabled={feature.loading}
                >
                  {feature.loading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    'Carregar'
                  )}
                </Button>
                
                {feature.hasInteracted && (
                  <Badge variant="secondary" className="text-xs">
                    Usado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demonstração de DocumentComponent */}
      {activeFeature === 'docs' && (
        <Card>
          <CardHeader>
            <CardTitle>Demonstração: Document Component</CardTitle>
            <CardDescription>
              Exemplo de como usar uma biblioteca carregada dinamicamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            ) : error ? (
              <Alert>
                <AlertDescription>
                  Erro ao carregar: {error.message}
                </AlertDescription>
              </Alert>
            ) : DocumentComponent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ✓ Biblioteca carregada com sucesso! ({(loadTime || 0).toFixed(0)}ms)
                </p>
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    Exemplo de uso: A biblioteca {typeof DocumentComponent} está agora disponível para uso.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique em "Carregar" para carregar a biblioteca dinamicamente
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configurações e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Preferências do Usuário</CardTitle>
            <CardDescription>
              Scores de probabilidade de uso por feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {features.map(({ id, name, feature }) => (
                <div key={id} className="flex justify-between items-center">
                  <span className="text-sm">{name}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={feature.usageScore * 100} 
                      className="w-16 h-2"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {Math.round(feature.usageScore * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>
              Parâmetros de comportamento e thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Preload Threshold</span>
                <Badge variant="outline">30%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Max Concurrent Loads</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex justify-between">
                <span>Idle Detection</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span>Behavior Tracking</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span>Predictive Loading</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}