// @ts-nocheck
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
          'flex items-center justify-center gap-3 px-4 py-3 rounded-lg relative overflow-hidden',
          'bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40',
          'border border-neutral-200'
        )}
      >
        {/* Gradiente animado de fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient opacity-40"></div>
        
        <div className="relative z-10 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient border border-white/50 shadow-lg shadow-purple-500/60 flex items-center justify-center">
            <Icon className="h-4 w-4 text-white" strokeWidth={2.5} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wide relative text-center">
            <span className="relative inline-block">
              <span className="absolute inset-0 blur-sm opacity-60 bg-white/60 animate-slow-pulse"></span>
              <span className="relative animate-gradient-text-button">{section.title}</span>
            </span>
          </h3>
        </div>
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

