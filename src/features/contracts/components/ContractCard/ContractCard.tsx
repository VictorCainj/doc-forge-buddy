/**
 * Componente ContractCard otimizado e organizado
 * Localizado na feature de contratos
 */

import React, { memo } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ContractCardProps } from '../../types/components';
import { useContractCardLogic } from './useContractCardLogic';
import { ContractInfo } from './ContractInfo';
import { ContractActions } from './ContractActions';
import { ContractHeader } from './ContractHeader';

export const ContractCard = memo<ContractCardProps>(({
  contract,
  onEdit,
  onDelete,
  onGenerateDocument,
  isGenerating = false,
  generatingDocument,
}) => {
  // ✅ Lógica isolada em hook específico
  const {
    contractInfo,
    handleEdit,
    handleDelete,
    handleGenerateDocument,
  } = useContractCardLogic({
    contract,
    onEdit,
    onDelete,
    onGenerateDocument,
  });

  return (
    <Card className="metric-card glass-card border-border hover:shadow-soft transition-all duration-300">
      <CardContent className="p-6">
        {/* ✅ Header isolado em subcomponente */}
        <ContractHeader
          contractInfo={contractInfo}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* ✅ Separador */}
        <div className="border-t border-border mb-4" />

        {/* ✅ Informações isoladas em subcomponente */}
        <ContractInfo contractInfo={contractInfo} />

        {/* ✅ Ações isoladas em subcomponente */}
        <ContractActions
          contract={contract}
          onGenerateDocument={handleGenerateDocument}
          isGenerating={isGenerating}
          generatingDocument={generatingDocument}
        />
      </CardContent>
    </Card>
  );
});

ContractCard.displayName = 'ContractCard';
