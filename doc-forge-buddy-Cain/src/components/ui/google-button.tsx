import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from '@/lib/icons';

interface GoogleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const GoogleButton = React.forwardRef<HTMLButtonElement, GoogleButtonProps>(
  (
    {
      children,
      onClick,
      type = 'button',
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      className,
      disabled = false,
      loading = false,
      fullWidth = false,
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'rounded-full font-medium text-sm',
      'shadow-lg hover:shadow-xl',
      'transform hover:scale-105',
      'transition-all duration-200',
      'focus:outline-none focus:ring-4 focus:ring-opacity-50',
      'border-0',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
      'active:scale-95',
      fullWidth && 'w-full',
    ];

    const variantClasses = {
      primary: [
        'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600',
        'hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500',
        'text-white',
        'focus:ring-blue-200',
      ],
      secondary: [
        'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800',
        'hover:from-gray-500 hover:via-gray-600 hover:to-gray-700',
        'text-white',
        'focus:ring-gray-200',
      ],
      outline: [
        'bg-transparent border-2 border-blue-600 text-blue-600',
        'hover:bg-blue-600 hover:text-white',
        'focus:ring-blue-200',
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-200',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 h-8 text-xs',
      md: 'px-4 py-2 h-10 text-sm',
      lg: 'px-6 py-3 h-12 text-base',
    };

    const classes = [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].filter(Boolean);

    const content = (
      <>
        {loading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </>
    );

    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={cn(classes)}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(classes)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

GoogleButton.displayName = 'GoogleButton';

export { GoogleButton, type GoogleButtonProps };