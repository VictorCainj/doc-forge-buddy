import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from '@/utils/iconMapper';
import { QuickAction } from './types';

interface ActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

// Design otimizado estilo Google Material 3.0 (Performance)
const colorStyles = {
  blue: {
    iconBg: 'bg-blue-100',
    iconBorder: 'border-blue-200',
    iconColor: 'text-blue-600',
    hover: 'hover:bg-blue-50',
    border: 'hover:border-blue-300',
    shadow: 'hover:shadow-blue-500/10',
    text: 'text-slate-700',
    badge: 'text-slate-500'
  },
  green: {
    iconBg: 'bg-emerald-100',
    iconBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    hover: 'hover:bg-emerald-50',
    border: 'hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-500/10',
    text: 'text-slate-700',
    badge: 'text-slate-500'
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconBorder: 'border-purple-200',
    iconColor: 'text-purple-600',
    hover: 'hover:bg-purple-50',
    border: 'hover:border-purple-300',
    shadow: 'hover:shadow-purple-500/10',
    text: 'text-slate-700',
    badge: 'text-slate-500'
  },
};

const ActionCard = memo<ActionCardProps>(({ action, onClick }) => {
  const colors = colorStyles[action.color || 'blue'];
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      disabled={action.disabled || action.loading}
      className={cn(
        'group w-full flex items-center gap-4 p-4 rounded-2xl',
        'bg-white border border-slate-200',
        'transition-colors duration-200 ease-out',
        'hover:shadow-md',
        colors.hover,
        colors.border,
        colors.shadow,
        'hover:scale-[1.01] active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-200',
        'text-left'
      )}
      aria-label={action.label}
    >
      {/* Ícone otimizado */}
      <div className={cn(
        'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
        'border transition-colors duration-200',
        colors.iconBg,
        colors.iconBorder
      )}>
        {action.loading ? (
          <Loader2 className={cn('h-5 w-5 animate-spin', colors.iconColor)} />
        ) : (
          <Icon className={cn('h-5 w-5', colors.iconColor)} strokeWidth={2.5} />
        )}
      </div>

      {/* Conteúdo do card */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'text-sm font-semibold leading-tight',
          colors.text,
          'group-hover:text-slate-800 transition-colors duration-200'
        )}>
          {action.shortLabel || action.label}
        </h4>
        {action.badge && (
          <p className={cn('text-xs mt-1 font-medium', colors.badge)}>
            {action.badge}
          </p>
        )}
      </div>
    </button>
  );
});

ActionCard.displayName = 'ActionCard';

export default ActionCard;

