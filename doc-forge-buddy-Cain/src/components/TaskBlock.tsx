import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Circle,
  PlayCircle,
  CheckCircle2,
} from '@/utils/iconMapper';
import { GripVertical } from 'lucide-react';
import { Task, TaskStatus, TASK_STATUS_LABELS } from '@/types/domain/task';
import { TaskCard } from './TaskCard';
import { QuickTaskForm } from './QuickTaskForm';
import { cn } from '@/lib/utils';

interface TaskBlockProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion?: (task: Task) => void;
  onCreateTask: (taskData: { title: string; description: string; status: TaskStatus }) => Promise<void>;
  onTaskClick?: (task: Task) => void;
  onDragStart?: (taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, targetStatus: TaskStatus) => void;
  isDragging?: boolean;
  dragOver?: boolean;
}

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; accentColor: string }> = {
  not_started: {
    icon: <Circle className="h-5 w-5" />,
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-300',
    accentColor: 'text-neutral-500',
  },
  in_progress: {
    icon: <PlayCircle className="h-5 w-5" />,
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-300',
    accentColor: 'text-amber-600',
  },
  completed: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-300',
    accentColor: 'text-emerald-600',
  },
};

export const TaskBlock = ({
  status,
  tasks,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  onCreateTask,
  onTaskClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  dragOver = false,
}: TaskBlockProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  const config = STATUS_CONFIG[status];
  const taskCount = tasks.length;

  const handleCreateTask = async (taskData: { title: string; description: string }) => {
    setIsCreating(true);
    try {
      await onCreateTask({ ...taskData, status });
      setIsAddingTask(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Só chama onDragLeave se realmente saiu do bloco (não apenas de um filho)
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (
        x < rect.left ||
        x > rect.right ||
        y < rect.top ||
        y > rect.bottom
      ) {
        if (onDragLeave) {
          onDragLeave();
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(e, status);
    }
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        'flex flex-col h-full min-h-[400px] lg:min-h-[600px]',
        dragOver && 'ring-2 ring-blue-400 ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={cn(
          'flex flex-col h-full border border-neutral-300 bg-white shadow-sm transition-all duration-200',
          dragOver && 'border-neutral-400 shadow-md ring-2 ring-neutral-200',
          isDragging && 'opacity-60'
        )}
      >
        <CardHeader className={cn('pb-4 border-b border-neutral-200', config.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-md bg-white border border-neutral-200', config.accentColor)}>
                {config.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {TASK_STATUS_LABELS[status]}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-neutral-300 bg-white text-neutral-700 font-medium"
            >
              {taskCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <ScrollArea className="flex-1 pr-2">
            <div className="grid grid-cols-1 gap-3 min-h-[200px]">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center col-span-1">
                  <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200 mb-4">
                    <div className={config.accentColor}>
                      {config.icon}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1 font-medium">
                    Nenhuma tarefa {status === 'not_started' ? 'não iniciada' : status === 'in_progress' ? 'em andamento' : 'finalizada'} ainda.
                  </p>
                  <p className="text-xs text-neutral-500">
                    {status === 'completed' 
                      ? 'Tarefas concluídas aparecerão aqui'
                      : 'Que tal adicionar uma tarefa?'}
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('taskId', task.id);
                      e.dataTransfer.setData('currentStatus', task.status);
                      if (onDragStart) {
                        onDragStart(task.id);
                      }
                    }}
                    className="group cursor-move"
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onChangeStatus={onChangeStatus}
                      onRequestCompletion={onRequestCompletion}
                      onClick={onTaskClick}
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Botão de adicionar tarefa */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            {isAddingTask ? (
              <QuickTaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setIsAddingTask(false)}
                isSubmitting={isCreating}
                defaultStatus={status}
              />
            ) : (
              <Button
                onClick={() => setIsAddingTask(true)}
                variant="outline"
                className="w-full justify-center gap-2 border-dashed border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Adicionar Tarefa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

