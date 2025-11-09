/**
 * Componente de badge de status para contratos
 */

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Contract } from '@/types/contract';
import { getContractStatusInfo } from '@/utils/contractStatus';

interface ContractStatusBadgeProps {
  contract: Contract;
  className?: string;
}

/**
 * Badge de status colorido para exibir o status do contrato
 */
export const ContractStatusBadge = memo<ContractStatusBadgeProps>(
  ({ contract, className }) => {
    const statusInfo = getContractStatusInfo(contract);

    // Não mostrar badge se o status for "Em Rescisão"
    if (statusInfo.status === 'rescisao') {
      return null;
    }

    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Badge
          variant="outline"
          className={`
            ${statusInfo.bgColor} 
            ${statusInfo.color} 
            ${statusInfo.borderColor}
            border-2
            font-semibold
            text-xs
            px-3
            py-1
            hover:opacity-90
            transition-opacity
            duration-200
            shadow-sm
          `}
        >
          {statusInfo.label}
        </Badge>
      </div>
    );
  }
);

ContractStatusBadge.displayName = 'ContractStatusBadge';

