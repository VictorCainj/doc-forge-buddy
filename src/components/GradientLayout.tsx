import { ReactNode } from 'react';

interface GradientLayoutProps {
  children: ReactNode;
  className?: string;
}

export const GradientLayout = ({
  children,
  className = '',
}: GradientLayoutProps) => {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-800 relative overflow-hidden ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-white/25 rounded-lg -rotate-45"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GradientLayout;
