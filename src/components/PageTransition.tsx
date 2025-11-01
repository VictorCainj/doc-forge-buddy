import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      className={cn(
        'min-h-screen w-full motion-reduce:transition-none',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ 
        pointerEvents: 'auto',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
      onAnimationComplete={() => {
        // Remove will-change após animação para restaurar nitidez
        const element = document.querySelector('.min-h-screen');
        if (element) {
          (element as HTMLElement).style.willChange = 'auto';
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
