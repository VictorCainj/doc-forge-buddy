import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Loader2,
  Wand2,
  Search,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from '@/utils/iconMapper';
import { TaskBlock } from '@/components/TaskBlock';
import { TaskCard } from '@/components/TaskCard';
import { TaskModal } from '@/components/TaskModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AITaskCreationModal } from '@/components/AITaskCreationModal';
import { TaskCompletionModal } from '@/components/TaskCompletionModal';
import { UserStatsCard } from '@/components/UserStatsCard';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/use-toast';
import { Task, CreateTaskInput, TaskStatus } from '@/types/domain/task';

const Tarefas = () => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    changeStatus,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTasks();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Filtrar tarefas por busca
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }

    const query = searchQuery.toLowerCase();
    return tasks.filter(task => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.subtitle?.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.observacao?.toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery]);

  // Obter a primeira tarefa em andamento para a seção destacada (mais recente)
  const highlightedTask = useMemo(() => {
    const inProgressTasks = filteredTasks
      .filter(t => t.status === 'in_progress')
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    return inProgressTasks[0] || null;
  }, [filteredTasks]);

  // Agrupar tarefas por status (excluindo a tarefa destacada)
  const tasksByStatus = useMemo(() => {
    const highlightedTaskId = highlightedTask?.id;
    return {
      not_started: filteredTasks.filter(t => t.status === 'not_started'),
      in_progress: filteredTasks.filter(
        t => t.status === 'in_progress' && t.id !== highlightedTaskId
      ),
      completed: filteredTasks.filter(t => t.status === 'completed'),
    };
  }, [filteredTasks, highlightedTask]);

  // Contar tarefas por status
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      not_started: tasks.filter(t => t.status === 'not_started').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks]);

  const handleCreateTask = async (taskData: CreateTaskInput) => {
    try {
      // A tarefa já aparece instantaneamente devido ao optimistic update
      // Fechar o modal imediatamente para melhor UX
      setIsTaskModalOpen(false);

      // Enviar para o servidor em background
      await createTask(taskData);

      // Toast de sucesso discreto (a tarefa já está visível)
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi salva com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      // Reabrir o modal em caso de erro para o usuário tentar novamente
      setIsTaskModalOpen(true);
      toast({
        title: 'Erro ao sincronizar tarefa',
        description:
          'A tarefa foi criada localmente, mas não foi salva no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskInput) => {
    if (!editingTask) return;

    try {
      // As alterações já aparecem instantaneamente devido ao optimistic update
      // Fechar o modal imediatamente para melhor UX
      setIsTaskModalOpen(false);
      setEditingTask(null);

      // Enviar para o servidor em background
      await updateTask({ id: editingTask.id, updates: taskData });

      // Toast de sucesso discreto (as alterações já estão visíveis)
      toast({
        title: 'Tarefa atualizada',
        description: 'As alterações foram salvas com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      // Reabrir o modal em caso de erro para o usuário tentar novamente
      setIsTaskModalOpen(true);
      toast({
        title: 'Erro ao sincronizar alterações',
        description:
          'As alterações foram aplicadas localmente, mas não foram salvas no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    // Fechar o diálogo imediatamente (a tarefa já foi removida visualmente)
    setDeleteDialogOpen(false);
    const deletedTaskId = taskToDelete;
    setTaskToDelete(null);

    try {
      // A tarefa já foi removida visualmente devido ao optimistic update
      // Enviar para o servidor em background
      await deleteTask(deletedTaskId);

      // Toast de sucesso discreto
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      // A tarefa será restaurada automaticamente pelo rollback do optimistic update
      toast({
        title: 'Erro ao sincronizar exclusão',
        description:
          'A tarefa foi removida localmente, mas não foi excluída no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleChangeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      // O status já foi alterado visualmente devido ao optimistic update
      // Enviar para o servidor em background
      await changeStatus({ id: taskId, status });

      // Toast de sucesso discreto apenas para mudanças importantes
      if (status === 'completed') {
        toast({
          title: 'Tarefa concluída',
          description: 'Parabéns! A tarefa foi marcada como concluída.',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      // O status será revertido automaticamente pelo rollback do optimistic update
      toast({
        title: 'Erro ao sincronizar status',
        description:
          'O status foi alterado localmente, mas não foi salvo no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus') as TaskStatus;

    setDragOverStatus(null);
    setDraggedTaskId(null);

    if (taskId && currentStatus !== targetStatus) {
      // O status já foi alterado visualmente devido ao optimistic update
      // Enviar para o servidor em background (sem toast para não poluir a UI durante drag & drop)
      try {
        await changeStatus({ id: taskId, status: targetStatus });
      } catch (error) {
        // O status será revertido automaticamente pelo rollback
        console.error('Erro ao sincronizar mudança de status:', error);
        toast({
          title: 'Erro ao sincronizar',
          description:
            'A mudança foi aplicada localmente, mas não foi salva no servidor.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };

  const handleCreateTaskInBlock = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
  }) => {
    const createData: CreateTaskInput = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
    };
    await handleCreateTask(createData);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleEditTaskInModal = async (
    task: Task,
    updates: CreateTaskInput
  ) => {
    try {
      // As alterações já aparecem instantaneamente devido ao optimistic update
      // Atualizar a tarefa selecionada imediatamente
      if (selectedTask?.id === task.id) {
        setSelectedTask({
          ...selectedTask,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      // Enviar para o servidor em background
      await updateTask({ id: task.id, updates });

      // Atualizar com dados do servidor após sincronização
      if (selectedTask?.id === task.id) {
        const updatedTask = tasks.find(t => t.id === task.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }

      toast({
        title: 'Tarefa atualizada',
        description: 'As alterações foram salvas com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      // Reverter a tarefa selecionada em caso de erro
      if (selectedTask?.id === task.id) {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask) {
          setSelectedTask(originalTask);
        }
      }
      toast({
        title: 'Erro ao sincronizar alterações',
        description:
          'As alterações foram aplicadas localmente, mas não foram salvas no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  const handleDeleteTaskInModal = async (taskId: string) => {
    // Fechar o modal imediatamente (a tarefa já foi removida visualmente)
    if (selectedTask?.id === taskId) {
      setIsTaskDetailModalOpen(false);
      setSelectedTask(null);
    }

    try {
      // A tarefa já foi removida visualmente devido ao optimistic update
      // Enviar para o servidor em background
      await deleteTask(taskId);

      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      // A tarefa será restaurada automaticamente pelo rollback do optimistic update
      // Reabrir o modal se necessário
      const restoredTask = tasks.find(t => t.id === taskId);
      if (restoredTask) {
        setSelectedTask(restoredTask);
        setIsTaskDetailModalOpen(true);
      }
      toast({
        title: 'Erro ao sincronizar exclusão',
        description:
          'A tarefa foi removida localmente, mas não foi excluída no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  const handleRequestCompletion = (task: Task) => {
    setCompletingTask(task);
    setIsCompletionModalOpen(true);
  };

  const handleConfirmCompletion = async (conclusionText: string) => {
    if (!completingTask) return;

    // Fechar o modal imediatamente (o status já foi alterado visualmente)
    setIsCompletionModalOpen(false);
    const taskId = completingTask.id;
    setCompletingTask(null);

    try {
      // O status já foi alterado visualmente devido ao optimistic update
      // Enviar para o servidor em background
      await changeStatus({
        id: taskId,
        status: 'completed',
        conclusion_text: conclusionText,
      });

      toast({
        title: 'Tarefa concluída',
        description: 'Parabéns! A tarefa foi marcada como concluída.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      // O status será revertido automaticamente pelo rollback do optimistic update
      // Reabrir o modal em caso de erro
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setCompletingTask(task);
        setIsCompletionModalOpen(true);
      }
      toast({
        title: 'Erro ao sincronizar conclusão',
        description:
          'A tarefa foi marcada como concluída localmente, mas não foi salva no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleAITask = () => {
    setIsAIModalOpen(true);
  };

  const handleEditAITask = (taskData: CreateTaskInput) => {
    const mockTask: Task = {
      id: 'temp',
      user_id: '',
      title: taskData.title,
      subtitle: taskData.subtitle || '',
      description: taskData.description,
      observacao: taskData.observacao || '',
      status: taskData.status || 'not_started',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingTask(mockTask);
    setIsTaskModalOpen(true);
  };

  const handleRemoveHighlight = async () => {
    if (!highlightedTask) return;

    try {
      // Muda o status para "not_started" para remover o destaque
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
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-neutral-600 mx-auto mb-4' />
          <p className='text-sm text-neutral-600'>Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      <div className='max-w-[1400px] mx-auto px-2 py-2 sm:px-3 lg:px-4'>
        {/* Header Moderno */}
        <div className='mb-2'>
          <div className='flex items-center gap-1.5 mb-2'>
            <div className='w-8 h-8 bg-white border border-neutral-300 rounded-lg flex items-center justify-center shadow-sm'>
              <ClipboardList className='h-4 w-4 text-neutral-700' />
            </div>
            <div>
              <h1 className='text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight'>
                Minhas Tarefas
              </h1>
            </div>
          </div>

          {/* Barra de busca */}
          <div className='relative mb-2'>
            <Search className='absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-neutral-400' />
            <Input
              type='text'
              placeholder='Buscar tarefas...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-8 h-8 text-xs rounded-lg border-neutral-300 bg-white focus:border-neutral-400 focus:ring-neutral-200 transition-all duration-200'
            />
          </div>

          {/* Botões de Ação */}
          <div className='flex flex-wrap gap-1.5'>
            <PremiumButton
              onClick={handleNewTask}
              icon={<Plus />}
              variant='secondary'
              className='h-7 text-xs px-2.5'
            >
              Nova Tarefa
            </PremiumButton>
            <Button
              onClick={handleAITask}
              variant='outline'
              className='inline-flex items-center gap-1.5 px-2.5 py-1 h-7 text-xs rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200'
            >
              <Wand2 className='h-3 w-3' />
              Criar com IA
            </Button>
          </div>
        </div>

        {/* Card de Progresso e Conquistas */}
        <div className='mb-2'>
          <UserStatsCard />
        </div>

        {/* Estatísticas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 mb-2.5'>
          <div className='group relative bg-white border border-neutral-300 rounded-lg p-2 hover:shadow-md hover:border-neutral-400 transition-all duration-200'>
            <div className='flex items-center justify-between mb-1.5'>
              <div className='p-1.5 rounded-lg bg-neutral-100 border border-neutral-200'>
                <ClipboardList className='h-3.5 w-3.5 text-neutral-700' />
              </div>
              <Badge
                variant='outline'
                className='border-neutral-300 bg-white text-neutral-700 text-[10px] px-1 py-0'
              >
                Todas
              </Badge>
            </div>
            <p className='text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide'>
              Total
            </p>
            <p className='text-lg font-bold text-neutral-900'>
              {taskCounts.all}
            </p>
          </div>

          <div className='group relative bg-white border border-neutral-300 rounded-lg p-2 hover:shadow-md hover:border-neutral-400 transition-all duration-200'>
            <div className='flex items-center justify-between mb-1.5'>
              <div className='p-1.5 rounded-lg bg-neutral-100 border border-neutral-200'>
                <Clock className='h-3.5 w-3.5 text-neutral-700' />
              </div>
              <Badge
                variant='outline'
                className='border-neutral-300 bg-white text-neutral-700 text-[10px] px-1 py-0'
              >
                Pendentes
              </Badge>
            </div>
            <p className='text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide'>
              Não Iniciadas
            </p>
            <p className='text-lg font-bold text-neutral-900'>
              {taskCounts.not_started}
            </p>
          </div>

          <div className='group relative bg-white border border-neutral-300 rounded-lg p-2 hover:shadow-md hover:border-neutral-400 transition-all duration-200'>
            <div className='flex items-center justify-between mb-1.5'>
              <div className='p-1.5 rounded-lg bg-amber-50 border border-amber-200'>
                <AlertCircle className='h-3.5 w-3.5 text-amber-700' />
              </div>
              <Badge
                variant='outline'
                className='border-amber-300 bg-amber-50 text-amber-700 text-[10px] px-1 py-0'
              >
                Ativas
              </Badge>
            </div>
            <p className='text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide'>
              Em Andamento
            </p>
            <p className='text-lg font-bold text-neutral-900'>
              {taskCounts.in_progress}
            </p>
          </div>

          <div className='group relative bg-white border border-neutral-300 rounded-lg p-2 hover:shadow-md hover:border-neutral-400 transition-all duration-200'>
            <div className='flex items-center justify-between mb-1.5'>
              <div className='p-1.5 rounded-lg bg-emerald-50 border border-emerald-200'>
                <CheckCircle2 className='h-3.5 w-3.5 text-emerald-700' />
              </div>
              <Badge
                variant='outline'
                className='border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] px-1 py-0'
              >
                Finalizadas
              </Badge>
            </div>
            <p className='text-[9px] text-neutral-500 mb-0.5 uppercase tracking-wide'>
              Concluídas
            </p>
            <p className='text-lg font-bold text-neutral-900'>
              {taskCounts.completed}
            </p>
          </div>
        </div>

        {/* Seção Destacada - Tarefa em Andamento */}
        <div className='mb-3 flex justify-center'>
          <div className='w-full max-w-2xl'>
            <Card
              className={`border-2 ${
                highlightedTask
                  ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md hover:shadow-lg'
                  : 'border-amber-200 bg-amber-50/50'
              } transition-all duration-300 ${
                dragOverStatus === 'in_progress' && draggedTaskId
                  ? 'ring-2 ring-amber-400 ring-offset-1'
                  : ''
              }`}
              onDragOver={e => {
                handleDragOver(e);
                setDragOverStatus('in_progress');
              }}
              onDragLeave={handleDragLeave}
              onDrop={async e => {
                e.preventDefault();
                e.stopPropagation();
                const taskId = e.dataTransfer.getData('taskId');
                const currentStatus = e.dataTransfer.getData(
                  'currentStatus'
                ) as TaskStatus;
                setDragOverStatus(null);
                setDraggedTaskId(null);

                if (taskId) {
                  try {
                    // Se a tarefa não está em andamento, muda para in_progress
                    // Se já está em andamento, atualiza para que se torne a tarefa destacada
                    if (currentStatus !== 'in_progress') {
                      await changeStatus({ id: taskId, status: 'in_progress' });
                    } else {
                      // Atualiza a tarefa para que ela se torne a mais recente (e apareça na seção destacada)
                      const task = tasks.find(t => t.id === taskId);
                      if (task) {
                        await updateTask({
                          id: taskId,
                          updates: {
                            title: task.title,
                            description: task.description,
                            status: 'in_progress',
                            subtitle: task.subtitle,
                            observacao: task.observacao,
                          },
                        });
                      }
                    }
                  } catch (error) {
                    console.error(
                      'Erro ao sincronizar mudança de status:',
                      error
                    );
                    toast({
                      title: 'Erro ao sincronizar',
                      description:
                        'A mudança foi aplicada localmente, mas não foi salva no servidor.',
                      variant: 'destructive',
                      duration: 3000,
                    });
                  }
                }
              }}
            >
              <CardHeader className='pb-1.5 pt-2 px-2.5 border-b border-amber-200 bg-white/50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1.5'>
                    <div className='p-1.5 rounded-lg bg-amber-100 border-2 border-amber-300 shadow-sm'>
                      <AlertCircle className='h-3.5 w-3.5 text-amber-700' />
                    </div>
                    <div>
                      <h3 className='text-xs font-bold text-neutral-900'>
                        Tarefa em Andamento
                      </h3>
                      <p className='text-[9px] text-neutral-600 mt-0.5'>
                        {highlightedTask
                          ? 'Foco na tarefa atual'
                          : 'Arraste uma tarefa aqui para destacá-la'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {highlightedTask && (
                      <Button
                        onClick={handleRemoveHighlight}
                        variant='ghost'
                        size='sm'
                        className='h-5 w-5 p-0 hover:bg-amber-100 text-neutral-600 hover:text-neutral-900'
                        title='Remover destaque'
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    )}
                    <Badge
                      variant='outline'
                      className='border-amber-400 bg-amber-100 text-amber-800 font-semibold text-[10px] px-1.5 py-0'
                    >
                      {highlightedTask ? 'Em Foco' : 'Vazio'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-2'>
                {highlightedTask ? (
                  <div
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('taskId', highlightedTask.id);
                      e.dataTransfer.setData(
                        'currentStatus',
                        highlightedTask.status
                      );
                      handleDragStart(highlightedTask.id);
                    }}
                    className='cursor-move'
                  >
                    <TaskCard
                      task={highlightedTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onChangeStatus={handleChangeStatus}
                      onRequestCompletion={handleRequestCompletion}
                      onClick={handleTaskClick}
                    />
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-6 text-center'>
                    <div className='p-2 rounded-lg bg-amber-100 border-2 border-amber-200 mb-2'>
                      <AlertCircle className='h-5 w-5 text-amber-600' />
                    </div>
                    <p className='text-xs text-neutral-600 mb-1 font-medium'>
                      Nenhuma tarefa em destaque
                    </p>
                    <p className='text-[9px] text-neutral-500'>
                      Arraste uma tarefa "Em Andamento" aqui para destacá-la
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Layout de Blocos */}
        <div
          className='grid grid-cols-1 lg:grid-cols-3 gap-2'
          onDragEnd={handleDragEnd}
        >
          <TaskBlock
            status='not_started'
            tasks={tasksByStatus.not_started}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={e => {
              handleDragOver(e);
              setDragOverStatus('not_started');
            }}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'not_started')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'not_started'}
          />
          <TaskBlock
            status='in_progress'
            tasks={tasksByStatus.in_progress}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={e => {
              handleDragOver(e);
              setDragOverStatus('in_progress');
            }}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'in_progress')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'in_progress'}
          />
          <TaskBlock
            status='completed'
            tasks={tasksByStatus.completed}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={e => {
              handleDragOver(e);
              setDragOverStatus('completed');
            }}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'completed')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'completed'}
          />
        </div>

        {/* Mensagem quando não há tarefas */}
        {filteredTasks.length === 0 && (
          <Card className='border-neutral-300 bg-white shadow-sm mt-2'>
            <CardContent className='py-6 text-center'>
              <div className='w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center mx-auto mb-2'>
                <ClipboardList className='h-5 w-5 text-neutral-400' />
              </div>
              <p className='text-neutral-600 mb-3 font-medium text-xs'>
                {searchQuery.trim()
                  ? 'Nenhuma tarefa encontrada com os termos de busca.'
                  : 'Nenhuma tarefa cadastrada ainda.'}
              </p>
              <Button
                onClick={handleNewTask}
                className='inline-flex items-center gap-1.5 px-2.5 py-1 h-7 text-xs rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md transition-all duration-200'
              >
                <Plus className='h-3 w-3' />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <TaskDetailModal
        open={isTaskDetailModalOpen}
        onOpenChange={open => {
          setIsTaskDetailModalOpen(open);
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        onEdit={handleEditTaskInModal}
        onDelete={handleDeleteTaskInModal}
        onChangeStatus={handleChangeStatus}
        onRequestCompletion={handleRequestCompletion}
        isSubmitting={isCreating || isUpdating || isDeleting}
        onTaskUpdated={updatedTask => {
          setSelectedTask(updatedTask);
        }}
      />

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={open => {
          setIsTaskModalOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        isSubmitting={isCreating || isUpdating || isDeleting}
      />

      <AITaskCreationModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        onCreateTask={handleCreateTask}
        onEditManually={handleEditAITask}
      />

      <TaskCompletionModal
        open={isCompletionModalOpen}
        onOpenChange={setIsCompletionModalOpen}
        taskTitle={completingTask?.title || ''}
        onSubmit={handleConfirmCompletion}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tarefas;
