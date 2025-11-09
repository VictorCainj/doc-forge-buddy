/**
 * Componente de lista de contratos
 */

import React from 'react';
import { Contract } from '@/types/contract';
import { ContractCard } from './ContractCard';
import { ContractCardSkeleton } from './ContractCardSkeleton';
import { Button } from '@/components/ui/button';

interface ContractListProps {
  contracts: Contract[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
  totalCount: number;
  displayedCount: number;
  hasSearched: boolean;
  onGenerateDocument: (contract: Contract, template: string, documentType: string) => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  isLoading,
  hasMore,
  loadMore,
  isLoadingMore,
  totalCount,
  displayedCount,
  hasSearched,
  onGenerateDocument,
}) => {
  if (isLoading && contracts.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <ContractCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {hasSearched ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
        </h3>
        <p className="text-neutral-600 max-w-md">
          {hasSearched 
            ? 'Tente ajustar os termos da busca ou limpar os filtros'
            : 'Comece cadastrando seu primeiro contrato de locação'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <div className="flex items-center gap-4">
          <span>
            Exibindo <strong>{displayedCount}</strong> de <strong>{totalCount}</strong> contratos
          </span>
          {hasSearched && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              Resultados da busca
            </span>
          )}
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid gap-4">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onGenerateDocument={onGenerateDocument}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                Carregando mais contratos...
              </>
            ) : (
              'Carregar mais contratos'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};