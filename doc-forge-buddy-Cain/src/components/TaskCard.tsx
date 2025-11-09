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
} from '@/types/domain/task';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion?: (task: Task) => void;
}

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={TASK_STATUS_COLORS[task.status] as 'default' | 'warning' | 'success'}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 truncate">
              {task.title}
            </h3>
            {task.subtitle && (
              <p className="text-sm text-neutral-600 mt-1 truncate">
                {task.subtitle}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'not_started' && (
                <DropdownMenuItem
                  onClick={() => onChangeStatus(task.id, 'not_started')}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Marcar como Não Iniciada
                </DropdownMenuItem>
              )}
              {task.status !== 'in_progress' && (
                <DropdownMenuItem
                  onClick={() => onChangeStatus(task.id, 'in_progress')}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem
                  onClick={() =>
                    onRequestCompletion ? onRequestCompletion(task) : onChangeStatus(task.id, 'completed')
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluída
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
          {task.description}
        </p>
        {task.observacao && task.observacao.trim() && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs font-medium text-amber-900 mb-1">
              📝 Observações:
            </p>
            <p className="text-xs text-amber-800 whitespace-pre-wrap break-words">
              {task.observacao}
            </p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Criada: {formatDateTime(task.created_at)}</span>
            </div>
            {task.completed_at && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Concluída: {formatDateTime(task.completed_at)}</span>
              </div>
            )}
          </div>
          {task.conclusion_text && task.conclusion_text.trim() && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs font-medium text-green-900 mb-1">
                ✓ Texto de Conclusão:
              </p>
              <p className="text-xs text-green-800 whitespace-pre-wrap break-words">
                {task.conclusion_text}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
