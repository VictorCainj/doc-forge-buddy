import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Zap,
  Droplets,
  Building2,
  Flame,
  Bell,
  Key,
} from 'lucide-react';
import { BillType, ContractFormData } from '@/types/contract';
import { useContractBills } from '@/hooks/useContractBills';
import { cn } from '@/lib/utils';

interface ContractBillsStatusProps {
  contractId: string;
  formData: ContractFormData;
}

export const ContractBillsStatus: React.FC<ContractBillsStatusProps> = ({
  contractId,
  formData,
}) => {
  const { bills, billStatus, isLoading } = useContractBills({
    contractId,
    formData,
  });

  // Se não há bills configuradas, não renderiza nada
  if (bills.length === 0 && !isLoading) {
    return null;
  }

  const billLabels: Record<BillType, string> = {
    energia: 'Energia',
    agua: 'Água',
    condominio: 'Condomínio',
    gas: 'Gás',
    notificacao_rescisao: 'Notificação de Rescisão',
    entrega_chaves: 'Entrega de Chaves',
  };

  const billIcons: Record<BillType, React.ElementType> = {
    energia: Zap,
    agua: Droplets,
    condominio: Building2,
    gas: Flame,
    notificacao_rescisao: Bell,
    entrega_chaves: Key,
  };

  // Ordenar bills na ordem padrão
  const orderedBillTypes: BillType[] = [
    'energia',
    'agua',
    'condominio',
    'gas',
    'notificacao_rescisao',
    'entrega_chaves',
  ];

  const visibleBills = orderedBillTypes
    .filter((type) => bills.some((bill) => bill.bill_type === type))
    .map((type) => ({
      type,
      delivered: billStatus[type] || false,
    }));

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-neutral-800 uppercase tracking-wide bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
            Contas de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 min-h-[2.5rem]"
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-black w-5 h-5"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-neutral-800 uppercase tracking-wide bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
          Contas de Consumo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {visibleBills.map(({ type, delivered }) => {
            const Icon = billIcons[type];
            return (
              <div
                key={type}
                className={cn(
                  'flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all duration-200',
                  'border min-h-[2.5rem]',
                  delivered
                    ? 'bg-success-50 border-success-200'
                    : 'bg-neutral-50 border-neutral-200'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-black">
                    <Icon className="h-3.5 w-3.5 text-white" color="white" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold transition-colors',
                      delivered ? 'text-success-700' : 'text-neutral-800'
                    )}
                  >
                    {billLabels[type]}
                  </span>
                </div>
                {delivered && (
                  <div className="p-1 rounded-full bg-success-600">
                    <CheckCircle className="h-3 w-3 text-white" color="white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
