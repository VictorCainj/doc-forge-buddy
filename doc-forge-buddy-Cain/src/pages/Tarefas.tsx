import { useState } from 'react';
import { Loader2, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { TaskModal } from '@/features/tasks/components/TaskModal';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { AITaskCreationModal } from '@/features/tasks/components/AITaskCreationModal';
import { TaskCompletionModal } from '@/features/tasks/components/TaskCompletionModal';
import { UserStatsCard } from '@/features/tasks/components/UserStatsCard';
import { TaskToolbar } from '@/features/tasks/components/TaskToolbar';
import { TaskBoardView } from '@/features/tasks/components/TaskBoardView';
import { TaskListView } from '@/features/tasks/components/TaskListView';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters';
import { Task, CreateTaskInput, TaskStatus } from '@/features/tasks/types/task';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { TaskBoardSkeleton } from '@/features/tasks/components/TaskBoardSkeleton';

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

  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredTasks,
  } = useTaskFilters(tasks);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Derived state for Board View
  const urgentTask =
    tasks.find((t) => t.observacao?.includes('[URGENTE]')) || null;

  const highlightedTask =
    tasks
      .filter((t) => t.status === 'in_progress' && t.id !== urgentTask?.id)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0] || null;

  const excludedIds = [highlightedTask?.id, urgentTask?.id].filter(
    Boolean
  ) as string[];

  const tasksByStatus = {
    not_started: filteredTasks.filter(
      (t) => t.status === 'not_started' && !excludedIds.includes(t.id)
    ),
    in_progress: filteredTasks.filter(
      (t) => t.status === 'in_progress' && !excludedIds.includes(t.id)
    ),
    completed: filteredTasks.filter(
      (t) => t.status === 'completed' && !excludedIds.includes(t.id)
    ),
  };

  // Handlers
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
        description:
          'A tarefa foi removida localmente, mas não foi excluída no servidor. Tente novamente.',
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
        description:
          'O status foi alterado localmente, mas não foi salvo no servidor. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
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
        const updatedTask = tasks.find((t) => t.id === task.id);
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
        const originalTask = tasks.find((t) => t.id === task.id);
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
      const restoredTask = tasks.find((t) => t.id === taskId);
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
      const task = tasks.find((t) => t.id === taskId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
          <TaskBoardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header & Toolbar */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardList className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Minhas Tarefas
              </h1>
              <p className="text-sm text-neutral-500">
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
        <div className="mb-6">
          <UserStatsCard />
        </div>

        {/* Conteúdo Principal */}
        <AnimatePresence mode="wait">
          {viewMode === 'board' ? (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TaskBoardView
                tasks={tasksByStatus}
                highlightedTask={highlightedTask}
                urgentTask={urgentTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onChangeStatus={handleChangeStatus}
                onRequestCompletion={handleRequestCompletion}
                onCreateTask={handleCreateTaskInBlock}
                onTaskClick={handleTaskClick}
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
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
              <Plus className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Comece a organizar suas tarefas
            </h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              Crie sua primeira tarefa para começar a acompanhar seu progresso e
              aumentar sua produtividade.
            </p>
            <Button onClick={handleNewTask} size="lg" className="shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <TaskDetailModal
        open={isTaskDetailModalOpen}
        onOpenChange={(open) => {
          setIsTaskDetailModalOpen(open);
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        onEdit={handleEditTaskInModal}
        onDelete={handleDeleteTaskInModal}
        onChangeStatus={handleChangeStatus}
        onRequestCompletion={handleRequestCompletion}
        isSubmitting={isCreating || isUpdating || isDeleting}
        onTaskUpdated={(updatedTask) => {
          setSelectedTask(updatedTask);
        }}
      />

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={(open) => {
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
