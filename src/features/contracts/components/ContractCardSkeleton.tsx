/**
 * Componente de skeleton loading para cards de contratos
 */

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ContractCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton individual para um card de contrato
 * Replica a estrutura visual do ContractListItem
 */
export const ContractCardSkeleton = memo<ContractCardSkeletonProps>(({ className }) => {
  return (
    <Card className={`glass-card-enhanced rounded-2xl overflow-visible min-h-fit ${className || ''}`}>
      <CardContent className="p-6 relative z-10">
        {/* Header do Contrato */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center justify-center flex-1">
            <div className="text-center w-full">
              <Skeleton className="h-7 w-48 mx-auto mb-2" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
        </div>

        {/* Separador */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-white/80 px-3">
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
          </div>
        </div>

        {/* PARTES ENVOLVIDAS */}
        <div className="mb-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
            </div>
          </div>
        </div>

        {/* TERMOS DO CONTRATO */}
        <div className="mb-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* LOCALIZAÇÃO */}
        <div className="mb-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-4 w-full max-w-[250px]" />
            </div>
          </div>
        </div>

        {/* CONTAS DE CONSUMO */}
        <div className="mb-5 pb-2">
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="relative overflow-visible pt-5">
          <div className="absolute inset-x-0 top-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="flex items-center justify-center pt-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContractCardSkeleton.displayName = 'ContractCardSkeleton';

/**
 * Grid de skeletons para lista de contratos
 */
interface ContractCardSkeletonGridProps {
  count?: number;
  className?: string;
}

export const ContractCardSkeletonGrid = memo<ContractCardSkeletonGridProps>(
  ({ count = 6, className }) => {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${className || ''}`}>
        {Array.from({ length: count }).map((_, index) => (
          <ContractCardSkeleton key={index} />
        ))}
      </div>
    );
  }
);

ContractCardSkeletonGrid.displayName = 'ContractCardSkeletonGrid';

