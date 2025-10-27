import { cn } from '@/lib/utils';

interface AILoadingProps {
  className?: string;
  text?: string;
}

export const AILoading = ({ className, text = 'Processando...' }: AILoadingProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div className="w-5 h-5 border-2 border-blue-200 rounded-full"></div>
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <span className="text-sm text-neutral-600 font-medium">{text}</span>
    </div>
  );
};

interface AIPulseProps {
  className?: string;
}

export const AIPulse = ({ className }: AIPulseProps) => {
  return (
    <div className={cn('flex gap-1', className)}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
