/**
 * Componente de skeleton loading para documentos
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonDocumentProps {
  className?: string;
}

export default function SkeletonDocument({ className }: SkeletonDocumentProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Header com logo e data */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-40 h-32 bg-neutral-200 rounded"></div>
        <div className="w-24 h-4 bg-neutral-200 rounded"></div>
      </div>

      {/* Título do documento */}
      <div className="text-center mb-8">
        <div className="h-8 bg-neutral-200 rounded mb-4 max-w-md mx-auto"></div>
        <div className="h-6 bg-neutral-200 rounded max-w-sm mx-auto"></div>
      </div>

      {/* Conteúdo do documento */}
      <div className="space-y-4">
        {/* Parágrafos */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            {i % 3 === 0 && (
              <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
            )}
          </div>
        ))}

        {/* Espaçamento */}
        <div className="h-6"></div>

        {/* Destaques */}
        <div className="space-y-3">
          <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 rounded w-full"></div>
          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        </div>

        {/* Espaçamento */}
        <div className="h-8"></div>

        {/* Mais parágrafos */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i + 8} className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
          </div>
        ))}

        {/* Espaçamento */}
        <div className="h-12"></div>

        {/* Assinaturas */}
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="w-32 h-8 bg-neutral-200 rounded"></div>
            <div className="w-24 h-4 bg-neutral-200 rounded"></div>
            <div className="w-20 h-3 bg-neutral-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-32 h-8 bg-neutral-200 rounded"></div>
            <div className="w-24 h-4 bg-neutral-200 rounded"></div>
            <div className="w-20 h-3 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
}

/**
 * Skeleton para lista de documentos
 */
export function SkeletonDocumentList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 bg-neutral-200 rounded w-48"></div>
                <div className="h-4 bg-neutral-200 rounded w-32"></div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 bg-neutral-200 rounded w-20"></div>
              <div className="h-8 bg-neutral-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para card de documento
 */
export function SkeletonDocumentCard() {
  return (
    <div className="animate-pulse border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 bg-neutral-200 rounded w-48"></div>
          <div className="h-4 bg-neutral-200 rounded w-32"></div>
        </div>
        <div className="h-4 bg-neutral-200 rounded w-16"></div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-full"></div>
        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-neutral-200 rounded w-20"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-neutral-200 rounded w-16"></div>
          <div className="h-8 bg-neutral-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}
