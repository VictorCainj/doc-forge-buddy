/**
 * Componente de ações de contratos
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Contract } from '@/types/contract';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';

interface ContractActionsProps {
  contract: Contract;
  onGenerateDocument: (contract: Contract, template: string, documentType: string) => void;
}

export const ContractActions: React.FC<ContractActionsProps> = ({
  contract,
  onGenerateDocument,
}) => {
  const handleQuickAction = (documentType: string) => {
    // Placeholder - aqui seria chamado o onGenerateDocument com o template apropriado
    onGenerateDocument(contract, '', documentType);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction('Distrato de Contrato de Locação')}
        className="text-xs"
      >
        Distrato
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction('Notificação de Agendamento')}
        className="text-xs"
      >
        Agendamento
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction('Devolutiva Locatário')}
        className="text-xs"
      >
        Devolutiva
      </Button>
    </div>
  );
};