import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModalSkeletonProps {
  type: 'ai-task' | 'task-completion' | 'document-wizard' | 'image-gallery' | 'document-viewer';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

/**
 * Skeleton para modais - diferentes layouts baseados no tipo
 */
export function ModalSkeleton({ 
  type, 
  size = 'md', 
  className 
}: ModalSkeletonProps) {
  
  const getSizeHeight = () => {
    switch (type) {
      case 'ai-task':
        return 'h-96';
      case 'task-completion':
        return 'h-80';
      case 'document-wizard':
        return 'h-[600px]';
      case 'image-gallery':
        return 'h-[70vh]';
      case 'document-viewer':
        return 'h-[80vh]';
      default:
        return 'h-96';
    }
  };

  return (
    <div className={cn('p-6', className)}>
      <div className={cn(
        'animate-pulse space-y-6',
        getSizeHeight()
      )}>
        
        {/* Header do modal */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>

        {/* Conteúdo específico do tipo de modal */}
        {type === 'ai-task' && (
          <AI_TaskSkeleton />
        )}

        {type === 'task-completion' && (
          <TaskCompletionSkeleton />
        )}

        {type === 'document-wizard' && (
          <DocumentWizardSkeleton />
        )}

        {type === 'image-gallery' && (
          <ImageGallerySkeleton />
        )}

        {type === 'document-viewer' && (
          <DocumentViewerSkeleton />
        )}

        {/* Footer - botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <div className="h-10 w-20 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton específico para modal de IA
 */
function AI_TaskSkeleton() {
  return (
    <div className="space-y-4">
      {/* Campo de título */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>

      {/* Campo de descrição */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>

      {/* Opções de IA */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>

      {/* Configurações avançadas */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para modal de conclusão de tarefa
 */
function TaskCompletionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status da tarefa */}
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>

      {/* Anexos */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton para assistente de documento
 */
function DocumentWizardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
            {i < 2 && <div className="h-1 w-16 bg-gray-100 mx-2" />}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        
        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Document Preview */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-100 rounded border" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para galeria de imagens
 */
function ImageGallerySkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Grid de imagens */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded" />
        ))}
      </div>

      {/* Upload area */}
      <div className="h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300" />
    </div>
  );
}

/**
 * Skeleton para visualizador de documento
 */
function DocumentViewerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded" />
      </div>

      {/* Document viewer */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 space-y-4 pr-4">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="h-96 bg-gray-100 rounded border" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}