import React from 'react';
import { Loader2 } from '@/utils/iconMapper';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Componente de overlay fullscreen com loading
 * Otimizado para aparecer instantaneamente
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Gerando relatório...',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.05 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm gpu-accelerate"
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.05 }}
        className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center space-y-4"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        <p className="text-lg font-medium text-neutral-900">{message}</p>
      </motion.div>
    </motion.div>
  );
};
