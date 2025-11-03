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
          gap-2
          px-6
          py-3
          text-sm
          font-semibold
          text-white
          rounded-lg
          bg-primary-600
          hover:bg-primary-700
          shadow-sm
          hover:shadow-md
          transition-all
          duration-200
          active:scale-100
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:shadow-sm
          ${className}
        `}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {icon && <span className="w-5 h-5 relative z-10">{icon}</span>}
          <span className="relative">{children}</span>
        </span>
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

