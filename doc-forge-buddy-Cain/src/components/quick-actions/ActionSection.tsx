import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import ActionCard from './ActionCard';
import { ActionSection as ActionSectionType } from './types';

interface ActionSectionProps {
  section: ActionSectionType;
  onActionClick: (actionId: string) => void;
}

const ActionSection = memo<ActionSectionProps>(({ section, onActionClick }) => {
  const Icon = section.icon;

  if (section.actions.length === 0) {
    return null;
  }

  // Mapeamento de cores otimizado estilo Google Material 3.0
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      iconShadow: 'shadow-blue-500/20',
      text: 'text-slate-700',
      title: 'text-blue-700'
    },
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-500',
      iconShadow: 'shadow-emerald-500/20',
      text: 'text-slate-700',
      title: 'text-emerald-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500',
      iconShadow: 'shadow-purple-500/20',
      text: 'text-slate-700',
      title: 'text-purple-700'
    },
  };

  const colors = colorStyles[section.color] || colorStyles.blue;

  return (
    <div className="group">
      {/* Header da seção - Design otimizado */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-2xl mb-4',
          colors.bg,
          'border',
          colors.border,
          'shadow-sm hover:shadow-md transition-shadow duration-200',
          'relative'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          'shadow-md',
          colors.iconBg,
          colors.iconShadow
        )}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        
        <div>
          <h3 className={cn('text-sm font-bold tracking-wide', colors.title)}>
            {section.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {section.actions.length} ação{section.actions.length > 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Cards de ações otimizados */}
      <div className="space-y-3">
        {section.actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onClick={() => onActionClick(action.id)}
          />
        ))}
      </div>
    </div>
  );
});

ActionSection.displayName = 'ActionSection';

export default ActionSection;

