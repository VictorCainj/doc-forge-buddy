// @ts-nocheck
import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from '@/utils/iconMapper';
import { QuickAction } from './types';

interface ActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

// Mapeamento de cores para elementos visuais - Design Limpo
const colorClasses = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hover: 'hover:bg-blue-50 hover:border-blue-300',
    text: 'text-neutral-800',
  },
  green: {
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
    hover: 'hover:bg-success-50 hover:border-success-300',
    text: 'text-neutral-800',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hover: 'hover:bg-purple-50 hover:border-purple-300',
    text: 'text-neutral-800',
  },
  orange: {
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    hover: 'hover:bg-warning-50 hover:border-warning-300',
    text: 'text-neutral-800',
  },
  red: {
    iconBg: 'bg-error-50',
    iconColor: 'text-error-600',
    hover: 'hover:bg-error-50 hover:border-error-300',
    text: 'text-neutral-800',
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
        'group w-full flex items-center gap-3 bg-white p-3 rounded-lg',
        'border border-neutral-200 transition-all duration-200',
        'hover:shadow-sm hover:border-neutral-300',
        colors.hover,
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500/30',
        'text-left'
      )}
      aria-label={action.label}
    >
      {/* Ícone compacto */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          'transition-colors duration-200',
          colors.iconBg
        )}
      >
        {action.loading ? (
          <Loader2 className={cn('h-4 w-4 animate-spin', colors.iconColor)} />
        ) : (
          <Icon className={cn('h-4 w-4', colors.iconColor)} strokeWidth={2} />
        )}
      </div>

      {/* Label compacto */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-medium block truncate', colors.text)}>
          {action.shortLabel || action.label}
        </span>
        {action.badge && (
          <span className="text-xs text-neutral-500 mt-0.5 block">
            {action.badge}
          </span>
        )}
      </div>
    </button>
  );
});

ActionCard.displayName = 'ActionCard';

export default ActionCard;

