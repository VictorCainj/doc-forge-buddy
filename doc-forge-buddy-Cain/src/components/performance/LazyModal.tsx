import React, { Suspense, lazy, useState, useCallback } from 'react';
import { LazyWrapper } from './LazyWrapper';
import { ModalSkeleton } from './SkeletonComponents';
import { useLazyLoad, useLoadingMetrics } from '@/hooks/useLazyLoad';
import { cn } from '@/lib/utils';
import { X } from '@/lib/icons';

// Lazy modals - componentes pesados em modais
const AITaskCreationModal = lazy(() => import('@/components/AITaskCreationModal'));
const TaskCompletionModal = lazy(() => import('@/components/TaskCompletionModal'));
const DocumentFormWizard = lazy(() => import('@/components/modals/DocumentFormWizard'));
const ImageGalleryModal = lazy(() => import('@/components/ImageGalleryModal'));
const DocumentViewer = lazy(() => import('@/components/modals/DocumentViewer'));

interface LazyModalProps {
  type: 'ai-task' | 'task-completion' | 'document-wizard' | 'image-gallery' | 'document-viewer';
  isOpen: boolean;
  onClose: () => void;
  props?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showOverlay?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

const modalComponents = {
  'ai-task': AITaskCreationModal,
  'task-completion': TaskCompletionModal,
  'document-wizard': DocumentFormWizard,
  'image-gallery': ImageGalleryModal,
  'document-viewer': DocumentViewer,
};

/**
 * Componente de Modal com Lazy Loading
 * Carrega modais grandes e complexos apenas quando necessário
 */
export function LazyModal({
  type,
  isOpen,
  onClose,
  props = {},
  size = 'md',
  showOverlay = true,
  className,
}: LazyModalProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { elementRef, isVisible } = useLazyLoad(0.5);
  const { metrics, startLoad, endLoad } = useLoadingMetrics();

  const Component = modalComponents[type];

  // Carregar modal quando visível
  const handleLoadModal = useCallback(() => {
    if (isLoaded || !isOpen) return;
    
    startLoad();
    setIsLoaded(true);
    endLoad();
  }, [isLoaded, isOpen, startLoad, endLoad]);

  // Carregar modal quando modal estiver aberto e visível
  React.useEffect(() => {
    if (isOpen && isVisible) {
      handleLoadModal();
    }
  }, [isOpen, isVisible, handleLoadModal]);

  if (!isOpen) return null;

  return (
    <LazyWrapper>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        ref={elementRef}
      >
        {/* Overlay */}
        {showOverlay && (
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
        )}

        {/* Modal Content */}
        <div 
          className={cn(
            'relative bg-white rounded-lg shadow-2xl border max-h-[90vh] overflow-hidden',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com close button */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              {type === 'ai-task' && 'Criar Tarefa com IA'}
              {type === 'task-completion' && 'Finalizar Tarefa'}
              {type === 'document-wizard' && 'Assistente de Documento'}
              {type === 'image-gallery' && 'Galeria de Imagens'}
              {type === 'document-viewer' && 'Visualizador de Documento'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="relative">
            {!isLoaded ? (
              <div className="p-8">
                <ModalSkeleton 
                  type={type}
                  size={size}
                />
                {metrics.loadDuration > 0 && (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Carregando em {metrics.loadDuration.toFixed(0)}ms...
                  </div>
                )}
              </div>
            ) : (
              <Suspense 
                fallback={
                  <div className="p-8">
                    <ModalSkeleton 
                      type={type}
                      size={size}
                    />
                  </div>
                }
              >
                <Component
                  {...props}
                  onClose={onClose}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </LazyWrapper>
  );
}

/**
 * Hook para gerenciamento de modais lazy
 */
export function useLazyModal<T extends string = string>(defaultSize: T = 'md' as T) {
  const [openModal, setOpenModal] = useState<{
    type: T;
    props?: Record<string, any>;
  } | null>(null);
  const [modalSize, setModalSize] = useState<LazyModalProps['size']>(defaultSize);

  const open = (type: T, props?: Record<string, any>, size?: LazyModalProps['size']) => {
    setOpenModal({ type, props });
    if (size) setModalSize(size);
  };

  const close = () => {
    setOpenModal(null);
  };

  const LazyModalRenderer = () => {
    if (!openModal) return null;

    return (
      <LazyModal
        type={openModal.type}
        isOpen={!!openModal}
        onClose={close}
        props={openModal.props}
        size={modalSize}
      />
    );
  };

  return {
    open,
    close,
    LazyModal: LazyModalRenderer,
  };
}

/**
 * Provider para modais - permite ter múltiplos modais
 */
export function LazyModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Array<{
    id: string;
    type: LazyModalProps['type'];
    props?: Record<string, any>;
    isOpen: boolean;
  }>>([]);

  const openModal = (type: LazyModalProps['type'], props?: Record<string, any>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setModals(prev => [...prev, { id, type, props, isOpen: true }]);
    return id;
  };

  const closeModal = (id: string) => {
    setModals(prev => prev.map(modal => 
      modal.id === id 
        ? { ...modal, isOpen: false }
        : modal
    ));
    
    // Remover modal após animação
    setTimeout(() => {
      setModals(prev => prev.filter(modal => modal.id !== id));
    }, 300);
  };

  const LazyModals = () => (
    <>
      {modals.map(modal => (
        <LazyModal
          key={modal.id}
          type={modal.type}
          isOpen={modal.isOpen}
          onClose={() => closeModal(modal.id)}
          props={modal.props}
        />
      ))}
    </>
  );

  return (
    <LazyWrapper>
      {children}
      <LazyModals />
    </LazyWrapper>
  );
}