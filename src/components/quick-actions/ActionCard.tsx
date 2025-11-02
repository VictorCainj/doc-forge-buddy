import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from '@/utils/iconMapper';
import { QuickAction } from './types';

interface ActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-neutral-50 border border-neutral-200',
    hover: 'hover:border-neutral-300 hover:bg-neutral-100',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  green: {
    iconBg: 'bg-neutral-50 border border-neutral-200',
    hover: 'hover:border-neutral-300 hover:bg-neutral-100',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  purple: {
    iconBg: 'bg-neutral-50 border border-neutral-200',
    hover: 'hover:border-neutral-300 hover:bg-neutral-100',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  orange: {
    iconBg: 'bg-neutral-50 border border-neutral-200',
    hover: 'hover:border-neutral-300 hover:bg-neutral-100',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  red: {
    iconBg: 'bg-neutral-50 border border-neutral-200',
    hover: 'hover:border-neutral-300 hover:bg-neutral-100',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
};

const ActionCard = memo<ActionCardProps>(({ action, onClick }) => {
  const colors = colorClasses[action.color || 'blue'];
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      disabled={action.disabled || action.loading}
      className={cn(
        'group relative w-full flex items-center gap-3 bg-white p-4 rounded-xl',
        'border border-neutral-200 transition-all duration-200',
        'hover:shadow-sm hover:border-neutral-300',
        colors.hover,
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400/30'
      )}
      aria-label={action.label}
    >
      {/* Ícone com fundo neutro claro */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          'transition-all duration-200 group-hover:scale-105',
          colors.iconBg
        )}
      >
        {action.loading ? (
          <Loader2 className={cn('h-5 w-5 animate-spin', colors.iconColor)} />
        ) : (
          <Icon className={cn('h-5 w-5', colors.iconColor)} strokeWidth={2} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 text-left min-w-0">
        <span className={cn('text-sm font-medium block', colors.text)}>
          {action.shortLabel || action.label}
        </span>
        {action.badge && (
          <span className="text-xs text-neutral-500 mt-0.5 block">
            {action.badge}
          </span>
        )}
      </div>

      {/* Indicador de hover sutil */}
      <div
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40',
          'transition-opacity duration-200'
        )}
      >
        <svg
          className="h-4 w-4 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
});

ActionCard.displayName = 'ActionCard';

export default ActionCard;

