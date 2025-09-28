import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { AdvancedChart } from '@/components/ui/advanced-chart';
import {
  DrillDownModal,
  DrillDownData,
} from '@/components/ui/drill-down-modal';
import { MobileDashboard } from '@/components/ui/mobile-dashboard';
import { useEnhancedDashboard } from '@/hooks/useEnhancedDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const EnhancedDashboard = () => {
  const {
    contracts,
    metrics,
    chartData,
    alerts,
    recommendations,
    loading,
    exportData,
    refetch,
  } = useEnhancedDashboard();

  const isMobile = useIsMobile();

  const [_selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(
    null
  );
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const handleMetricClick = (metricType: string) => {
    setSelectedMetric(metricType);

    // Gerar dados de drill-down baseado no tipo de métrica
    let drillData: DrillDownData;

    switch (metricType) {
      case 'occupancy':
        drillData = {
          id: 'occupancy',
          title: 'Taxa de Ocupação',
          value: contracts.length,
          metadata: { rate: metrics.occupancyRate },
          items: contracts.map((contract) => ({
            id: contract.id,
            name: contract.form_data.nomeLocatario || 'Sem nome',
            value: 1,
            status:
              new Date(contract.form_data.dataTerminoRescisao || '') >
              new Date()
                ? 'ativo'
                : 'expirado',
            date: contract.created_at,
            location: contract.form_data.enderecoImovel,
            type: 'contrato',
            metadata: {
              revenue: contract.form_data.enderecoImovel
                ?.toLowerCase()
                .includes('comercial')
                ? 2000
                : 800,
              daysUntilExpiry: Math.ceil(
                (new Date(
                  contract.form_data.dataTerminoRescisao || ''
                ).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            },
          })),
        };
        break;
      case 'revenue':
        drillData = {
          id: 'revenue',
          title: 'Receita Mensal',
          value: metrics.monthlyRevenue,
          metadata: { total: metrics.monthlyRevenue },
          items: contracts.map((contract) => ({
            id: contract.id,
            name: contract.form_data.nomeLocatario || 'Sem nome',
            value: contract.form_data.enderecoImovel
              ?.toLowerCase()
              .includes('comercial')
              ? 2000
              : 800,
            status: 'ativo',
            date: contract.created_at,
            location: contract.form_data.enderecoImovel,
            type: 'contrato',
            metadata: {
              revenue: contract.form_data.enderecoImovel
                ?.toLowerCase()
                .includes('comercial')
                ? 2000
                : 800,
            },
          })),
        };
        break;
      case 'risk':
        drillData = {
          id: 'risk',
          title: 'Contratos em Risco',
          value:
            metrics.contractsAtRisk.expiring7Days +
            metrics.contractsAtRisk.expiring15Days,
          metadata: {
            expiring7Days: metrics.contractsAtRisk.expiring7Days,
            expiring15Days: metrics.contractsAtRisk.expiring15Days,
          },
          items: contracts
            .filter((contract) => {
              const endDate = new Date(
                contract.form_data.dataTerminoRescisao || ''
              );
              const daysUntilExpiry = Math.ceil(
                (endDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            })
            .map((contract) => {
              const endDate = new Date(
                contract.form_data.dataTerminoRescisao || ''
              );
              const daysUntilExpiry = Math.ceil(
                (endDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return {
                id: contract.id,
                name: contract.form_data.nomeLocatario || 'Sem nome',
                value: daysUntilExpiry,
                status: daysUntilExpiry <= 7 ? 'expirando' : 'ativo',
                date:
                  contract.form_data.dataTerminoRescisao || contract.created_at,
                location: contract.form_data.enderecoImovel,
                type: 'contrato',
                metadata: {
                  daysUntilExpiry,
                  urgent: daysUntilExpiry <= 7,
                },
              };
            }),
        };
        break;
      default:
        return;
    }

    setDrillDownData(drillData);
    setIsDrillDownOpen(true);
  };

  const handleDrillDownExport = (data: DrillDownData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const _getRiskColor = (count: number) => {
    if (count === 0) return 'success';
    if (count <= 2) return 'warning';
    return 'error';
  };

  const getPerformanceStatus = (value: number, target: number) => {
    if (value >= target) return 'success';
    if (value >= target * 0.8) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Renderizar versão mobile se detectado
  if (isMobile) {
    return (
      <MobileDashboard
        metrics={metrics}
        chartData={chartData}
        alerts={alerts}
        recommendations={recommendations}
        loading={loading}
        onRefresh={refetch}
        onExport={exportData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Total de Contratos"
            value={metrics.totalContracts}
            subtitle="Contratos cadastrados"
            icon={Users}
            status="info"
            onClick={() => handleMetricClick('total')}
          />

          <MetricCard
            title="Contratos > 30 dias"
            value={metrics.contractsOver30Days}
            subtitle="Ultrapassaram 30 dias"
            icon={AlertTriangle}
            status="error"
            onClick={() => handleMetricClick('over30')}
          />

          <MetricCard
            title="Próximos 30 dias"
            value={metrics.contractsNear30Days}
            subtitle="Até 1 semana antes"
            icon={Clock}
            status="warning"
            onClick={() => handleMetricClick('near30')}
          />
        </div>

        {/* Gráfico de Contratos por Mês */}
        <div className="grid grid-cols-1 gap-8">
          <AdvancedChart
            title="Contratos por Mês (Data de Início da Desocupação)"
            subtitle="Últimos 12 meses - Baseado na data de início da rescisão"
            data={chartData.monthlyTrends.map((item) => ({
              label: item.month,
              value: item.value,
              metadata: { count: item.value },
            }))}
            type="bar"
            height={300}
            showTrend={false}
            onDataPointClick={(_dataPoint) => {
              // Handle data point click
            }}
            onExport={() => {
              // Handle export
            }}
          />
        </div>

        {/* Modal de Drill-Down */}
        <DrillDownModal
          isOpen={isDrillDownOpen}
          onClose={() => setIsDrillDownOpen(false)}
          data={drillDownData}
          onItemClick={(_item) => {
            // Aqui você pode implementar navegação para detalhes do contrato
          }}
          onExport={handleDrillDownExport}
        />
      </div>
    </div>
  );
};

export default EnhancedDashboard;
