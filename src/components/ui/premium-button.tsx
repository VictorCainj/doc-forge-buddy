import * as React from "react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "info";
}

const variantStyles = {
  primary: {
    gradient: "from-blue-600 via-blue-500 to-indigo-600",
    hover: "hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700",
    shadow: "shadow-blue-500/50",
    glow: "before:bg-gradient-to-r before:from-blue-400 before:via-indigo-400 before:to-purple-400",
  },
  secondary: {
    gradient: "from-purple-600 via-purple-500 to-pink-600",
    hover: "hover:from-purple-700 hover:via-purple-600 hover:to-pink-700",
    shadow: "shadow-purple-500/50",
    glow: "before:bg-gradient-to-r before:from-purple-400 before:via-pink-400 before:to-rose-400",
  },
  success: {
    gradient: "from-emerald-600 via-green-500 to-teal-600",
    hover: "hover:from-emerald-700 hover:via-green-600 hover:to-teal-700",
    shadow: "shadow-emerald-500/50",
    glow: "before:bg-gradient-to-r before:from-emerald-400 before:via-green-400 before:to-teal-400",
  },
  info: {
    gradient: "from-cyan-600 via-sky-500 to-blue-600",
    hover: "hover:from-cyan-700 hover:via-sky-600 hover:to-blue-700",
    shadow: "shadow-cyan-500/50",
    glow: "before:bg-gradient-to-r before:from-cyan-400 before:via-sky-400 before:to-blue-400",
  },
};

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ icon, children, variant = "primary", className = "", ...props }, ref) => {
    const styles = variantStyles[variant];

    return (
      <>
        <style>{`
          @keyframes rotate {
            100% {
              transform: rotate(1turn);
            }
          }

          .premium-glow::before {
            content: '';
            position: absolute;
            z-index: -2;
            left: -50%;
            top: -50%;
            width: 200%;
            height: 200%;
            background-position: 0 0;
            background-repeat: no-repeat;
            background-size: 50% 50%;
            filter: blur(12px);
            animation: rotate 4s linear infinite;
          }

          .premium-glow::after {
            content: '';
            position: absolute;
            z-index: -1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: inherit;
            border-radius: inherit;
          }
        `}</style>
        <button
          ref={ref}
          className={`
            premium-glow
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
            rounded-lg
            bg-gradient-to-r
            ${styles.gradient}
            ${styles.hover}
            ${styles.glow}
            shadow-lg
            ${styles.shadow}
            transition-all
            duration-300
            hover:scale-105
            hover:shadow-xl
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
            {icon && <span className="w-5 h-5">{icon}</span>}
            <span>{children}</span>
          </span>
        </button>
      </>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

