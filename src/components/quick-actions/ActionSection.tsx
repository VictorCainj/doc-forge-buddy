// @ts-nocheck
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

  // Mapeamento de cores para backgrounds sutis
  const colorBgMap = {
    blue: 'bg-blue-50',
    green: 'bg-success-50',
    purple: 'bg-purple-50',
    orange: 'bg-warning-50',
    red: 'bg-error-50',
  };

  const colorIconMap = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-success-100 text-success-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-warning-100 text-warning-700',
    red: 'bg-error-100 text-error-700',
  };

  return (
    <div className="space-y-2.5">
      {/* Header da seção - Compacto */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg',
          colorBgMap[section.color],
          'border border-neutral-200'
        )}
      >
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', colorIconMap[section.color])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
          {section.title}
        </h3>
      </div>

      {/* Cards de ações */}
      <div className="space-y-2">
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

