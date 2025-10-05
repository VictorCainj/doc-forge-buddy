import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Contract } from '@/types/contract';

interface ContractStatsProps {
  contracts: Contract[];
  isLoading?: boolean;
}

/**
 * Componente de estatísticas para contratos
 * Calcula métricas em tempo real
 */
export const ContractStats = memo<ContractStatsProps>(({ contracts, isLoading }) => {
  // Calcular estatísticas
  const stats = {
    total: contracts.length,
    active: contracts.filter((c: any) => c.status === 'active' || !c.status).length,
    pending: contracts.filter((c: any) => c.status === 'pending').length,
    expiring: contracts.filter((c: any) => {
      const endDate = c.form_data?.data_fim || c.form_data?.dataFirmamentoContrato;
      if (!endDate) return false;
      const date = new Date(endDate);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return date > now && date <= thirtyDaysFromNow;
    }).length,
  };
  
  const statsData = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Ativos',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
    },
    {
      label: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Vencendo',
      value: stats.expiring,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    {stat.percentage !== undefined && (
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.percentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

ContractStats.displayName = 'ContractStats';
