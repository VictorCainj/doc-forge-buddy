import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Flame, X } from 'lucide-react';
import { Task, TaskStatus } from '../types/task';
import { TaskCard } from './TaskCard';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '@/components/ui/use-toast';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface TaskHighlightSectionProps {
  highlightedTask: Task | null;
  urgentTask: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

export const TaskHighlightSection = ({
  highlightedTask,
  urgentTask,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  onTaskClick,
}: TaskHighlightSectionProps) => {
  const { updateTask, changeStatus } = useTasks();
  const { toast } = useToast();

  const handleRemoveHighlight = async () => {
    if (!highlightedTask) return;

    try {
      await changeStatus({ id: highlightedTask.id, status: 'not_started' });
      toast({
        title: 'Destaque removido',
        description: 'A tarefa foi removida do foco.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao remover destaque:', error);
      toast({
        title: 'Erro ao remover destaque',
        description: 'Não foi possível remover o destaque da tarefa.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUrgency = async () => {
    if (!urgentTask) return;

    try {
      await updateTask({
        id: urgentTask.id,
        updates: {
          observacao: urgentTask.observacao?.replace('[URGENTE]', '').trim(),
        },
      });
      toast({
        title: 'Urgência removida',
        description: 'A tarefa não está mais marcada como urgente.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao remover urgência:', error);
      toast({
        title: 'Erro ao remover urgência',
        description: 'Não foi possível remover a urgência da tarefa.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
      {/* Tarefa em Andamento (Highlight) */}
      <Droppable droppableId="highlight">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="w-full h-full"
          >
            <Card
              className={`border-2 h-full ${
                highlightedTask
                  ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md hover:shadow-lg'
                  : 'border-amber-200 bg-amber-50/50'
              } transition-all duration-300 ${
                snapshot.isDraggingOver
                  ? 'ring-2 ring-amber-400 ring-offset-1'
                  : ''
              }`}
            >
              <CardHeader className="pb-3 pt-4 px-4 border-b border-amber-200 bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 border-2 border-amber-300 shadow-sm">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        Tarefa em Foco
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {highlightedTask && (
                      <Button
                        onClick={handleRemoveHighlight}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-amber-100 text-neutral-600 hover:text-neutral-900"
                        title="Remover destaque"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-full min-h-[140px] flex items-center justify-center">
                {highlightedTask ? (
                  <Draggable
                    draggableId={highlightedTask.id}
                    index={0}
                    key={highlightedTask.id}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="w-full"
                      >
                        <TaskCard
                          task={highlightedTask}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onChangeStatus={onChangeStatus}
                          onRequestCompletion={onRequestCompletion}
                          onClick={onTaskClick}
                        />
                      </div>
                    )}
                  </Draggable>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 mb-1 font-medium">
                      Nenhuma tarefa em destaque
                    </p>
                    <p className="text-xs text-neutral-500">
                      Arraste uma tarefa "Em Andamento" aqui
                    </p>
                  </div>
                )}
                {provided.placeholder}
              </CardContent>
            </Card>
          </div>
        )}
      </Droppable>

      {/* Tarefas em Urgência */}
      <Droppable droppableId="urgent">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="w-full h-full"
          >
            <Card
              className={`border-2 h-full ${
                urgentTask
                  ? 'border-red-400 bg-gradient-to-br from-red-50 to-rose-50 shadow-md hover:shadow-lg'
                  : 'border-red-200 bg-red-50/50'
              } transition-all duration-300 ${
                snapshot.isDraggingOver
                  ? 'ring-2 ring-red-400 ring-offset-1'
                  : ''
              }`}
            >
              <CardHeader className="pb-3 pt-4 px-4 border-b border-red-200 bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 border-2 border-red-300 shadow-sm">
                      <Flame className="h-4 w-4 text-red-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        Prioridade Máxima
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {urgentTask && (
                      <Button
                        onClick={handleRemoveUrgency}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 text-neutral-600 hover:text-neutral-900"
                        title="Remover urgência"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-full min-h-[140px] flex items-center justify-center">
                {urgentTask ? (
                  <Draggable
                    draggableId={urgentTask.id}
                    index={0}
                    key={urgentTask.id}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="w-full"
                      >
                        <TaskCard
                          task={urgentTask}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onChangeStatus={onChangeStatus}
                          onRequestCompletion={onRequestCompletion}
                          onClick={onTaskClick}
                        />
                      </div>
                    )}
                  </Draggable>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 mb-1 font-medium">
                      Nenhuma tarefa urgente
                    </p>
                    <p className="text-xs text-neutral-500">
                      Arraste uma tarefa aqui para priorizar
                    </p>
                  </div>
                )}
                {provided.placeholder}
              </CardContent>
            </Card>
          </div>
        )}
      </Droppable>
    </div>
  );
};

