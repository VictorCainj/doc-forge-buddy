import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ClipboardList,
  AlertCircle,
  Flame,
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
import { TaskToolbar } from '@/components/tasks/TaskToolbar';
import { TaskListView } from '@/components/tasks/TaskListView';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // New State for Toolbar and Views
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | 'urgent' | null>(null);

  // Filtrar e Ordenar Tarefas
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.subtitle?.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.observacao?.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'urgent') {
        const isAUrgent = a.observacao?.includes('[URGENTE]') ? 1 : 0;
        const isBUrgent = b.observacao?.includes('[URGENTE]') ? 1 : 0;
        if (isAUrgent !== isBUrgent) return isBUrgent - isAUrgent;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
  }, [tasks, searchQuery, statusFilter, sortBy]);

  // Identificar tarefa urgente (marcada com [URGENTE] na observação)
  const urgentTask = useMemo(() => {
    return tasks.find(t => t.observacao?.includes('[URGENTE]')) || null;
  }, [tasks]);

  // Obter a primeira tarefa em andamento para a seção destacada (mais recente), excluindo a urgente
  const highlightedTask = useMemo(() => {
    const inProgressTasks = tasks // Use tasks instead of filteredTasks for global highlight logic
      .filter(t => t.status === 'in_progress' && t.id !== urgentTask?.id)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    return inProgressTasks[0] || null;
  }, [tasks, urgentTask]);

  // Agrupar tarefas por status (excluindo a tarefa destacada e a urgente para o Board)
  const tasksByStatus = useMemo(() => {
    // In board view, we might want to hide highlighted/urgent from the columns if they are shown above
    // But for List view we show everything filtered.
    // Let's keep the board logic consistent with previous behavior
    const highlightedTaskId = highlightedTask?.id;
    const urgentTaskId = urgentTask?.id;
    const excludedIds = [highlightedTaskId, urgentTaskId].filter(Boolean);

    // Apply search filter to board columns too
    return {
      not_started: filteredTasks.filter(t => t.status === 'not_started' && !excludedIds.includes(t.id)),
      in_progress: filteredTasks.filter(
        t => t.status === 'in_progress' && !excludedIds.includes(t.id)
      ),
      completed: filteredTasks.filter(t => t.status === 'completed' && !excludedIds.includes(t.id)),
    };
  }, [filteredTasks, highlightedTask, urgentTask]);

  const handleCreateTask = async (taskData: CreateTaskInput) => {
    try {
      setIsTaskModalOpen(false);
      await createTask(taskData);
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi salva com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      setIsTaskModalOpen(true);
      toast({
        title: 'Erro ao sincronizar tarefa',
        description: 'A tarefa foi criada localmente, mas não foi salva no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskInput) => {
    if (!editingTask) return;

    try {
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await updateTask({ id: editingTask.id, updates: taskData });
      toast({
        title: 'Tarefa atualizada',
        description: 'As alterações foram salvas com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      setIsTaskModalOpen(true);
      toast({
        title: 'Erro ao sincronizar alterações',
        description: 'As alterações foram aplicadas localmente, mas não foram salvas no servidor. Tente novamente.',
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

    setDeleteDialogOpen(false);
    const deletedTaskId = taskToDelete;
    setTaskToDelete(null);

    try {
      await deleteTask(deletedTaskId);
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: 'Erro ao sincronizar exclusão',
        description: 'A tarefa foi removida localmente, mas não foi excluída no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleChangeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await changeStatus({ id: taskId, status });
      if (status === 'completed') {
        toast({
          title: 'Tarefa concluída',
          description: 'Parabéns! A tarefa foi marcada como concluída.',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao sincronizar status',
        description: 'O status foi alterado localmente, mas não foi salvo no servidor. Tente novamente.',
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
      try {
        await changeStatus({ id: taskId, status: targetStatus });
      } catch (error) {
        console.error('Erro ao sincronizar mudança de status:', error);
        toast({
          title: 'Erro ao sincronizar',
          description: 'A mudança foi aplicada localmente, mas não foi salva no servidor.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };

  const handleDropUrgent = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverStatus(null);
    setDraggedTaskId(null);

    if (taskId) {
      // Se já é a tarefa urgente, não faz nada
      if (urgentTask && urgentTask.id === taskId) return;

      try {
        // 1. Remover urgência da tarefa atual (se houver)
        if (urgentTask) {
          await updateTask({
            id: urgentTask.id,
            updates: {
              observacao: urgentTask.observacao.replace('[URGENTE]', '').trim()
            }
          });
        }

        // 2. Adicionar urgência à nova tarefa
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
      } catch (error) {
        console.error('Erro ao atualizar urgência:', error);
        toast({
          title: 'Erro ao atualizar urgência',
          description: 'Não foi possível marcar a tarefa como urgente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveUrgency = async () => {
    if (!urgentTask) return;

    try {
      await updateTask({
        id: urgentTask.id,
        updates: {
          observacao: urgentTask.observacao.replace('[URGENTE]', '').trim()
        }
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
        duration: 3000,
      });
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
      if (selectedTask?.id === task.id) {
        setSelectedTask({
          ...selectedTask,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      await updateTask({ id: task.id, updates });

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
      if (selectedTask?.id === task.id) {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask) {
          setSelectedTask(originalTask);
        }
      }
      toast({
        title: 'Erro ao sincronizar alterações',
        description: 'As alterações foram aplicadas localmente, mas não foram salvas no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  const handleDeleteTaskInModal = async (taskId: string) => {
    if (selectedTask?.id === taskId) {
      setIsTaskDetailModalOpen(false);
      setSelectedTask(null);
    }

    try {
      await deleteTask(taskId);
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      const restoredTask = tasks.find(t => t.id === taskId);
      if (restoredTask) {
        setSelectedTask(restoredTask);
        setIsTaskDetailModalOpen(true);
      }
      toast({
        title: 'Erro ao sincronizar exclusão',
        description: 'A tarefa foi removida localmente, mas não foi excluída no servidor. Tente novamente.',
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

    setIsCompletionModalOpen(false);
    const taskId = completingTask.id;
    setCompletingTask(null);

    try {
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
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setCompletingTask(task);
        setIsCompletionModalOpen(true);
      }
      toast({
        title: 'Erro ao sincronizar conclusão',
        description: 'A tarefa foi marcada como concluída localmente, mas não foi salva no servidor. Tente novamente.',
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
      <div className='max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header & Toolbar */}
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm'>
              <ClipboardList className='h-5 w-5 text-primary-600' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-neutral-900 tracking-tight'>
                Minhas Tarefas
              </h1>
              <p className='text-sm text-neutral-500'>
                Gerencie suas atividades e acompanhe seu progresso.
              </p>
            </div>
          </div>

          <TaskToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onNewTask={handleNewTask}
            onAITask={handleAITask}
          />
        </div>

        {/* Card de Progresso */}
        <div className='mb-6'>
          <UserStatsCard />
        </div>

        {/* Seções Destacadas (Apenas no Board View por enquanto) */}
        {viewMode === 'board' && (
          <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto'>
            {/* Tarefa em Andamento */}
            <div className='w-full'>
              <Card
                className={`border-2 h-full ${
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
                  const currentStatus = e.dataTransfer.getData('currentStatus') as TaskStatus;
                  setDragOverStatus(null);
                  setDraggedTaskId(null);

                  if (taskId) {
                    try {
                      if (currentStatus !== 'in_progress') {
                        await changeStatus({ id: taskId, status: 'in_progress' });
                      } else {
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
                      console.error('Erro ao sincronizar mudança de status:', error);
                      toast({
                        title: 'Erro ao sincronizar',
                        description: 'A mudança foi aplicada localmente, mas não foi salva no servidor.',
                        variant: 'destructive',
                        duration: 3000,
                      });
                    }
                  }
                }}
              >
                <CardHeader className='pb-3 pt-4 px-4 border-b border-amber-200 bg-white/50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1.5 rounded-lg bg-amber-100 border-2 border-amber-300 shadow-sm'>
                        <AlertCircle className='h-4 w-4 text-amber-700' />
                      </div>
                      <div>
                        <h3 className='text-sm font-bold text-neutral-900'>
                          Tarefa em Foco
                        </h3>
                      </div>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      {highlightedTask && (
                        <Button
                          onClick={handleRemoveHighlight}
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 hover:bg-amber-100 text-neutral-600 hover:text-neutral-900'
                          title='Remover destaque'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4 h-full min-h-[140px] flex items-center justify-center'>
                  {highlightedTask ? (
                    <div
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('taskId', highlightedTask.id);
                        e.dataTransfer.setData('currentStatus', highlightedTask.status);
                        handleDragStart(highlightedTask.id);
                      }}
                      className='cursor-move w-full'
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
                    <div className='text-center'>
                      <p className='text-sm text-neutral-600 mb-1 font-medium'>
                        Nenhuma tarefa em destaque
                      </p>
                      <p className='text-xs text-neutral-500'>
                        Arraste uma tarefa "Em Andamento" aqui
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tarefas em Urgência */}
            <div className='w-full'>
              <Card
                className={`border-2 h-full ${
                  urgentTask
                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-rose-50 shadow-md hover:shadow-lg'
                    : 'border-red-200 bg-red-50/50'
                } transition-all duration-300 ${
                  dragOverStatus === 'urgent' && draggedTaskId
                    ? 'ring-2 ring-red-400 ring-offset-1'
                    : ''
                }`}
                onDragOver={e => {
                  handleDragOver(e);
                  setDragOverStatus('urgent');
                }}
                onDragLeave={handleDragLeave}
                onDrop={handleDropUrgent}
              >
                <CardHeader className='pb-3 pt-4 px-4 border-b border-red-200 bg-white/50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1.5 rounded-lg bg-red-100 border-2 border-red-300 shadow-sm'>
                        <Flame className='h-4 w-4 text-red-700' />
                      </div>
                      <div>
                        <h3 className='text-sm font-bold text-neutral-900'>
                          Prioridade Máxima
                        </h3>
                      </div>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      {urgentTask && (
                        <Button
                          onClick={handleRemoveUrgency}
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 hover:bg-red-100 text-neutral-600 hover:text-neutral-900'
                          title='Remover urgência'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4 h-full min-h-[140px] flex items-center justify-center'>
                  {urgentTask ? (
                    <div
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('taskId', urgentTask.id);
                        e.dataTransfer.setData('currentStatus', urgentTask.status);
                        handleDragStart(urgentTask.id);
                      }}
                      className='cursor-move w-full'
                    >
                      <TaskCard
                        task={urgentTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onChangeStatus={handleChangeStatus}
                        onRequestCompletion={handleRequestCompletion}
                        onClick={handleTaskClick}
                      />
                    </div>
                  ) : (
                    <div className='text-center'>
                      <p className='text-sm text-neutral-600 mb-1 font-medium'>
                        Nenhuma tarefa urgente
                      </p>
                      <p className='text-xs text-neutral-500'>
                        Arraste uma tarefa aqui para priorizar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <AnimatePresence mode="wait">
          {viewMode === 'board' ? (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='grid grid-cols-1 lg:grid-cols-3 gap-6'
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
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TaskListView
                tasks={filteredTasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onChangeStatus={handleChangeStatus}
                onRequestCompletion={handleRequestCompletion}
                onTaskClick={handleTaskClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem quando não há tarefas (Global) */}
        {tasks.length === 0 && !searchQuery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-8 text-center'
          >
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4'>
              <Plus className='h-8 w-8 text-neutral-400' />
            </div>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
              Comece a organizar suas tarefas
            </h3>
            <p className='text-neutral-500 mb-6 max-w-sm mx-auto'>
              Crie sua primeira tarefa para começar a acompanhar seu progresso e aumentar sua produtividade.
            </p>
            <Button onClick={handleNewTask} size="lg" className="shadow-lg">
              <Plus className='h-5 w-5 mr-2' />
              Criar Primeira Tarefa
            </Button>
          </motion.div>
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
