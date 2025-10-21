import React from 'react';
import { Loader2 } from '@/utils/iconMapper';

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Componente de overlay fullscreen com loading
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Gerando relatório...',
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        <p className="text-lg font-medium text-neutral-900">{message}</p>
      </div>
    </div>
  );
};
