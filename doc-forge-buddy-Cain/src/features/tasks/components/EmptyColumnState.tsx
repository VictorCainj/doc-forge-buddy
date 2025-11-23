import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyColumnStateProps {
  icon: ReactNode;
  statusLabel: string;
  statusKey: string;
}

export const EmptyColumnState = ({
  icon,
  statusLabel,
  statusKey,
}: EmptyColumnStateProps) => {
  const getMessage = () => {
    switch (statusKey) {
      case 'not_started':
        return 'Tudo pronto para começar? Adicione tarefas aqui.';
      case 'in_progress':
        return 'Nada em andamento no momento. Mova uma tarefa para cá!';
      case 'completed':
        return 'Ainda nenhuma tarefa concluída. Continue assim!';
      default:
        return 'Nenhuma tarefa nesta coluna.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[200px]">
      <div className={cn('p-4 rounded-full bg-neutral-50 mb-4')}>
        <div className="opacity-50 grayscale">{icon}</div>
      </div>
      <p className="text-sm font-medium text-neutral-900 mb-1">
        {statusLabel} vazia
      </p>
      <p className="text-xs text-neutral-500 max-w-[200px]">{getMessage()}</p>
    </div>
  );
};

