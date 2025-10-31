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
        'min-h-screen w-full will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:transform-none',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      layout
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
