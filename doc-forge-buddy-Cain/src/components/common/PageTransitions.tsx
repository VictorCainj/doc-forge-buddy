import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionsProps {
  children: React.ReactNode;
  pageKey?: string;
  type?: 'fade' | 'slide' | 'scale';
  duration?: number;
}

export const PageTransitions: React.FC<PageTransitionsProps> = ({
  children,
  pageKey,
  type = 'fade',
  duration = 0.3,
}) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 }
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[type]}
        transition={{ duration }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Componente para transições de página simples
export const SimplePageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Hook para animações personalizadas
export const usePageTransition = (type: 'fade' | 'slide' | 'scale' = 'fade') => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 }
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 }
    }
  };

  return {
    variants: variants[type],
    transition: { duration: 0.3 }
  };
};