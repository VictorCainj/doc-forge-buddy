import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertCircle } from '@/utils/iconMapper';
import { Contract } from '@/types/contract';

interface ContractStatsProps {
  contracts: Contract[];
}

/**
 * Componente de estatísticas de contratos
 * Memoizado e otimizado para cálculos rápidos
 */
export const ContractStats = memo<ContractStatsProps>(({ contracts }) => {
  // Calcular estatísticas uma única vez
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter(c => 
      c.form_data.dataTerminoRescisao && 
      new Date(c.form_data.dataTerminoRescisao) > new Date()
    ).length;
    const pending = contracts.filter(c => 
      !c.form_data.dataInicioRescisao
    ).length;
    const expired = total - active - pending;

    return { total, active, pending, expired };
  }, [contracts]);

  const statCards = useMemo(() => [
    {
      icon: FileText,
      label: 'Total',
      value: stats.total,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-100',
    },
    {
      icon: CheckCircle,
      label: 'Ativos',
      value: stats.active,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      icon: Clock,
      label: 'Pendentes',
      value: stats.pending,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      icon: AlertCircle,
      label: 'Expirados',
      value: stats.expired,
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ], [stats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

ContractStats.displayName = 'ContractStats';
