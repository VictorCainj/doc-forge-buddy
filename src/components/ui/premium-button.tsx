import * as React from "react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "info";
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ icon, children, variant = "primary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          relative
          inline-flex
          items-center
          justify-center
          gap-2.5
          px-6
          py-3.5
          text-sm
          font-semibold
          text-white
          rounded-xl
          bg-gradient-to-r
          from-blue-500
          via-purple-500
          to-pink-500
          bg-[length:200%_100%]
          animate-gradient
          shadow-lg
          shadow-purple-500/50
          hover:shadow-xl
          hover:shadow-purple-500/60
          hover:scale-105
          transition-all
          duration-700
          before:absolute
          before:inset-0
          before:bg-gradient-to-r
          before:from-white/20
          before:via-transparent
          before:to-white/20
          before:translate-x-[-100%]
          hover:before:translate-x-[100%]
          before:transition-transform
          before:duration-3000
          backdrop-blur-sm
          border
          border-white/20
          active:scale-100
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:scale-100
          overflow-hidden
          ${className}
        `}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2.5">
          {icon && <span className="w-5 h-5 relative z-10 drop-shadow-sm">{icon}</span>}
          <span className="relative">
            <span className="absolute inset-0 blur-sm opacity-60 bg-white/60 animate-slow-pulse"></span>
            <span className="relative animate-gradient-text-button">{children}</span>
          </span>
        </span>
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

