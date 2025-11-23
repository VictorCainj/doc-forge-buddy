import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
} from '@/utils/iconMapper';
import {
  Task,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TaskStatus,
} from '../types/task';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion?: (task: Task) => void;
  onClick?: (task: Task) => void;
}

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  onClick,
}: TaskCardProps) => {
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'not_started':
        return <Circle className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDateBrazilian(dateString)} às ${date.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`;
  };

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'in_progress':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'not_started':
        return 'bg-neutral-100 border-neutral-300 text-neutral-600';
    }
  };

  return (
    <Card 
      className={cn(
        "border border-neutral-300 bg-white shadow-sm hover:shadow-md hover:border-neutral-400 transition-all duration-200 rounded-lg",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs font-medium border px-2 py-0.5",
                  getStatusBadgeColor(task.status)
                )}
              >
                <span className="flex items-center gap-1.5">
                  {getStatusIcon(task.status)}
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
              {task.title}
            </h3>
            {task.subtitle && (
              <p className="text-sm text-neutral-600 mt-1.5 line-clamp-1">
                {task.subtitle}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger 
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'not_started' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeStatus(task.id, 'not_started');
                  }}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Marcar como Não Iniciada
                </DropdownMenuItem>
              )}
              {task.status !== 'in_progress' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeStatus(task.id, 'in_progress');
                  }}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestCompletion ? onRequestCompletion(task) : onChangeStatus(task.id, 'completed');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluída
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm text-neutral-700 line-clamp-3 leading-relaxed">
          {task.description}
        </p>
        {task.observacao && task.observacao.trim() && (
          <div className="mt-3 p-2.5 bg-neutral-50 border border-neutral-200 rounded-md">
            <p className="text-xs font-medium text-neutral-700 mb-1">
              Observações:
            </p>
            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
              {task.observacao}
            </p>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">Criada: {formatDateBrazilian(task.created_at)}</span>
            </div>
            {task.completed_at && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                <span className="whitespace-nowrap">Concluída: {formatDateBrazilian(task.completed_at)}</span>
              </div>
            )}
          </div>
          {task.conclusion_text && task.conclusion_text.trim() && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <p className="text-xs font-medium text-emerald-900 mb-1">
                Conclusão:
              </p>
              <p className="text-xs text-emerald-800 line-clamp-2 leading-relaxed">
                {task.conclusion_text}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
