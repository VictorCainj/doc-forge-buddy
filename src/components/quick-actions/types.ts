import React from 'react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  shortLabel?: string;
  badge?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export interface ActionSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  actions: QuickAction[];
}

export interface QuickActionsDropdownProps {
  contractId: string;
  contractNumber?: string;
  onGenerateDocument: (
    contractId: string,
    template: string,
    title: string
  ) => void;
}

