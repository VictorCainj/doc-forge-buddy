/**
 * Versão corrigida do Index.tsx
 * Elimina chamada condicional de hook
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  BarChart3,
  Settings 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import { useOptimizedData } from '@/hooks/useOptimizedData';

const Index = () => {
  // ✅ Hook sempre chamado - sem condicionais
  const { data: contracts, loading } = useOptimizedData({
    documentType: 'all',
    limit: 100,
  });

  // ✅ Estado derivado com useMemo
  const dashboardData = useMemo(() => {
    if (loading || !contracts.length) {
      return {
        totalContracts: 0,
        contractsThisMonth: 0,
        contractsOver30Days: 0,
        chartData: [],
        useEnhanced: false,
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const contractsThisMonth = contracts.filter(
      contract => new Date(contract.created_at) >= startOfMonth
    ).length;

    const contractsOver30Days = contracts.filter(
      contract => new Date(contract.created_at) < thirtyDaysAgo
    ).length;

    // Dados para o gráfico
    const chartData = contracts.slice(0, 10).map((contract, index) => ({
      name: `Contrato ${index + 1}`,
      value: Math.floor(Math.random() * 100) + 1,
    }));

    // ✅ Decisão baseada em dados, não em hook condicional
    const useEnhanced = contracts.length > 50;

    return {
      totalContracts: contracts.length,
      contractsThisMonth,
      contractsOver30Days,
      chartData,
      useEnhanced,
    };
  }, [contracts, loading]);

  // ✅ Renderização condicional baseada em dados, não em hooks
  if (dashboardData.useEnhanced) {
    return <EnhancedDashboard />;
  }

  // Dashboard simples
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Visão geral dos seus contratos e atividades
            </p>
          </div>
          <Button asChild>
            <Link to="/contratos">
              <FileText className="h-4 w-4 mr-2" />
              Ver Contratos
            </Link>
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.totalContracts}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Este Mês
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.contractsThisMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                Novos contratos
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mais de 30 dias
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.contractsOver30Days}
              </div>
              <p className="text-xs text-muted-foreground">
                Contratos antigos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="h-20">
            <Link to="/cadastrar-contrato" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Novo Contrato</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/analise-vistoria" className="flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Análise Vistoria</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/chat" className="flex flex-col items-center gap-2">
              <Settings className="h-6 w-6" />
              <span>Chat IA</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20">
            <Link to="/vistoria-analises" className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Relatórios</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
