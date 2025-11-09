import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton básico para textos
 */
export function TextSkeleton({
  className,
  lines = 1,
  width = 'w-full',
  height = 'h-4',
}: {
  className?: string;
  lines?: number;
  width?: string;
  height?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            height,
            index === lines - 1 && lines > 1 ? width : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton para cards
 */
export function CardSkeleton({
  className,
  showHeader = true,
  showContent = true,
  contentLines = 3,
}: {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  contentLines?: number;
}) {
  return (
    <div className={cn('border rounded-lg p-6 bg-white', className)}>
      {showHeader && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-200 h-10 w-10 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      )}
      {showContent && (
        <div className="space-y-3">
          {Array.from({ length: contentLines }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: `${100 - (index * 15)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton para tabelas
 */
export function TableSkeleton({
  className,
  rows = 5,
  columns = 4,
}: {
  className?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    'h-4 bg-gray-100 rounded animate-pulse',
                    colIndex === 0 && 'col-span-2'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para gráficos
 */
export function ChartSkeleton({
  className,
  height = 'h-64',
  showLegend = true,
}: {
  className?: string;
  height?: string;
  showLegend?: boolean;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart Area */}
      <div className={cn('bg-gray-100 rounded-lg flex items-center justify-center', height)}>
        <div className="text-center space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton para listas de itens
 */
export function ListSkeleton({
  className,
  items = 5,
  showAvatar = false,
}: {
  className?: string;
  items?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          {showAvatar && (
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para formulários
 */
export function FormSkeleton({
  className,
  fields = 4,
  showButton = true,
}: {
  className?: string;
  fields?: number;
  showButton?: boolean;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
      {showButton && (
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-10 bg-gray-100 rounded animate-pulse w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton para dashboards
 */
export function DashboardSkeleton({
  className,
  showSidebar = true,
  cards = 4,
}: {
  className?: string;
  showSidebar?: boolean;
  cards?: number;
}) {
  return (
    <div className={cn('flex gap-6', className)}>
      {showSidebar && (
        <div className="w-64 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-6 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}
      <div className="flex-1 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, index) => (
            <CardSkeleton key={index} showHeader={false} contentLines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-80" />
          <TableSkeleton rows={6} columns={3} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para arquivos Excel/PDF/DOCX
 */
export function FileSkeleton({
  className,
  type = 'excel',
}: {
  className?: string;
  type?: 'excel' | 'pdf' | 'docx' | 'chart';
}) {
  const typeConfig = {
    excel: {
      icon: '📊',
      title: 'Carregando planilha...',
      description: 'Processando dados para Excel',
    },
    pdf: {
      icon: '📄',
      title: 'Gerando PDF...',
      description: 'Compilando documento',
    },
    docx: {
      icon: '📝',
      title: 'Criando documento...',
      description: 'Preparando arquivo Word',
    },
    chart: {
      icon: '📈',
      title: 'Carregando gráfico...',
      description: 'Renderizando visualização',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      <div className="text-4xl animate-pulse">{config.icon}</div>
      <div className="text-center space-y-2">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mx-auto" />
      </div>
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}