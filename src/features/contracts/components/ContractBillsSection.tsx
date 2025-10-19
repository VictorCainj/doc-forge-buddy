import React from 'react';
import { 
  Zap, 
  Droplets, 
  Building2, 
  Flame, 
  Bell 
} from 'lucide-react';
import { Check } from 'lucide-react';
import { useContractBills } from '@/hooks/useContractBills';
import { ContractFormData, BillType } from '@/types/contract';
import { cn } from '@/lib/utils';

interface ContractBillsSectionProps {
  contractId: string;
  formData: ContractFormData;
}

/**
 * Componente para exibir e gerenciar as contas de consumo de um contrato
 * - Badges clicáveis que mudam de cor
 * - Cinza quando não entregue, verde quando entregue
 * - Ícone de check quando entregue
 */
export const ContractBillsSection: React.FC<ContractBillsSectionProps> = ({
  contractId,
  formData,
}) => {
  const { bills, billStatus, isLoading, toggleBillDelivery } = useContractBills(
    {
      contractId,
      formData,
    }
  );

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
  };

  const billIcons: Record<BillType, React.ElementType> = {
    energia: Zap,
    agua: Droplets,
    condominio: Building2,
    gas: Flame,
    notificacao_rescisao: Bell,
  };

  // Ordenar bills na ordem padrão
  const orderedBillTypes: BillType[] = [
    'energia',
    'agua',
    'condominio',
    'gas',
    'notificacao_rescisao',
  ];
  const visibleBills = orderedBillTypes
    .filter((type) => bills.some((b) => b.bill_type === type))
    .map((type) => ({
      type,
      delivered: billStatus[type] || false,
    }));

  return (
    <div className="overflow-visible">
      <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-3 bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
        Contas de Consumo
      </h4>
      <div className="grid grid-cols-2 gap-2 overflow-visible">
        {visibleBills.map(({ type, delivered }) => {
          const Icon = billIcons[type];
          return (
            <button
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                toggleBillDelivery(type);
              }}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all duration-200',
                'border cursor-pointer min-h-[2.5rem]',
                'hover:shadow-sm active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'overflow-visible',
                delivered
                  ? 'bg-success-50 border-success-200 hover:bg-success-100'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-black">
                  <Icon
                    className="h-3.5 w-3.5 text-white"
                    color="white"
                  />
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
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shadow-sm"
                  style={{ backgroundColor: '#34A853' }}
                >
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} color="white" />
                </div>
              )}
              {!delivered && (
                <div className="w-5 h-5 rounded-full border-2 border-neutral-300 bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
