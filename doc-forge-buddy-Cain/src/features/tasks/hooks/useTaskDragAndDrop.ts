import { DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../types/task';
import { useTasks } from './useTasks';
import { useToast } from '@/components/ui/use-toast';

export const useTaskDragAndDrop = () => {
  const { changeStatus, updateTask, tasks } = useTasks();
  const { toast } = useToast();

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    // Droppable IDs will be status keys: 'not_started', 'in_progress', 'completed', or 'urgent', 'highlight'
    const newStatusId = destination.droppableId;

    try {
      if (newStatusId === 'urgent') {
        // Lógica para marcar como urgente
        const urgentTask = tasks.find(t => t.observacao?.includes('[URGENTE]'));
        if (urgentTask && urgentTask.id === taskId) return;

        // Remove urgência da anterior
        if (urgentTask) {
          await updateTask({
            id: urgentTask.id,
            updates: {
              observacao: urgentTask.observacao.replace('[URGENTE]', '').trim()
            }
          });
        }

        // Adiciona urgência à nova
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const newObs = task.observacao ? `${task.observacao} [URGENTE]` : '[URGENTE]';
          await updateTask({
            id: taskId,
            updates: {
              observacao: newObs
            }
          });
          toast({
            title: 'Tarefa Urgente Definida',
            description: 'A tarefa foi marcada como urgente.',
            duration: 2000,
          });
        }
      } else if (newStatusId === 'highlight') {
        // Lógica para destaque (in_progress e topo)
        // Ao mover para cá, garantimos que ela seja 'in_progress' e atualizamos para ser a mais recente
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await updateTask({
                id: taskId,
                updates: {
                    status: 'in_progress',
                    // Forçar update do updated_at (já acontece no hook, mas garantindo)
                }
            });
        }
      } else {
        // Mudança de status padrão
        // Se mudou de coluna
        if (destination.droppableId !== source.droppableId) {
             await changeStatus({ id: taskId, status: newStatusId as TaskStatus });
        }
      }
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      toast({
        title: 'Erro ao mover tarefa',
        description: 'Não foi possível salvar a alteração.',
        variant: 'destructive',
      });
    }
  };

  return { onDragEnd };
};

