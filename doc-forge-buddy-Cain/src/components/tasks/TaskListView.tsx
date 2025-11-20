import { motion } from 'framer-motion';
import { Task, TaskStatus, TASK_STATUS_LABELS } from '@/types/domain/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Circle, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

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

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'in_progress':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'not_started':
      return 'text-neutral-600 bg-neutral-100 border-neutral-200';
  }
};

export function TaskListView({
  tasks,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  onTaskClick,
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg border border-neutral-200 border-dashed">
        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
          <Circle className="h-6 w-6 text-neutral-300" />
        </div>
        <p className="text-neutral-500 font-medium">Nenhuma tarefa encontrada nesta visualização.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="group flex items-center gap-4 p-3 bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex-shrink-0">
            <div className={cn("p-2 rounded-full border", getStatusColor(task.status))}>
              {getStatusIcon(task.status)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-medium text-neutral-900 truncate">{task.title}</h3>
              {task.observacao?.includes('[URGENTE]') && (
                <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
                  URGENTE
                </Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">
              {task.subtitle || task.description}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1.5" title="Data de criação">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">{formatDateBrazilian(task.created_at)}</span>
            </div>
            <Badge variant="outline" className={cn("font-normal", getStatusColor(task.status))}>
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'not_started' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, 'not_started'); }}>
                  <Circle className="h-4 w-4 mr-2" />
                  Marcar como Não Iniciada
                </DropdownMenuItem>
              )}
              {task.status !== 'in_progress' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, 'in_progress'); }}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRequestCompletion(task); }}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluída
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      ))}
    </div>
  );
}

