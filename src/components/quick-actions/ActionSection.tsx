import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import ActionCard from './ActionCard';
import { ActionSection as ActionSectionType } from './types';

interface ActionSectionProps {
  section: ActionSectionType;
  onActionClick: (actionId: string) => void;
}

const colorClasses = {
  blue: {
    headerBg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconBg: 'bg-white border border-neutral-200',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  green: {
    headerBg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconBg: 'bg-white border border-neutral-200',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  purple: {
    headerBg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconBg: 'bg-white border border-neutral-200',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  orange: {
    headerBg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconBg: 'bg-white border border-neutral-200',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
  red: {
    headerBg: 'bg-neutral-50',
    border: 'border-neutral-200',
    iconBg: 'bg-white border border-neutral-200',
    text: 'text-neutral-800',
    iconColor: 'text-neutral-700',
  },
};

const ActionSection = memo<ActionSectionProps>(({ section, onActionClick }) => {
  const colors = colorClasses[section.color];
  const Icon = section.icon;

  if (section.actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header da seção */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg',
          colors.headerBg,
          colors.border,
          'border'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            colors.iconBg
          )}
        >
          <Icon className={cn('h-4 w-4', colors.iconColor)} strokeWidth={2} />
        </div>
        <h3
          className={cn(
            'text-sm font-semibold uppercase tracking-wide',
            colors.text
          )}
        >
          {section.title}
        </h3>
      </div>

      {/* Cards de ações */}
      <div className="space-y-2.5">
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

