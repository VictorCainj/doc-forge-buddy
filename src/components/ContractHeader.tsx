/**
 * Componente para o cabeçalho da página de contratos
 * Inclui título, estatísticas e botão de novo contrato
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ContractHeaderProps {
  totalContracts: number;
  hasSearched: boolean;
  searchResultsCount: number;
}

export const ContractHeader: React.FC<ContractHeaderProps> = ({
  totalContracts,
  hasSearched,
  searchResultsCount,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-foreground">
          Contratos Cadastrados
        </h2>
        
        {hasSearched ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {searchResultsCount} resultado{searchResultsCount !== 1 ? 's' : ''} encontrado{searchResultsCount !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {totalContracts} contrato{totalContracts !== 1 ? 's' : ''} total{totalContracts !== 1 ? 'is' : ''}
          </Badge>
        )}
      </div>

      <Button asChild>
        <Link to="/cadastrar-contrato">
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Link>
      </Button>
    </div>
  );
};
