import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  FileText,
  Loader2,
  Wand2,
  Search,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
} from '@/utils/iconMapper';
import { TaskBlock } from '@/components/TaskBlock';
import { TaskModal } from '@/components/TaskModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AITaskCreationModal } from '@/components/AITaskCreationModal';
import { DailySummaryModal } from '@/components/modals/DailySummaryModal';
import { TaskCompletionModal } from '@/components/TaskCompletionModal';
import { UserStatsCard } from '@/components/UserStatsCard';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Task, CreateTaskInput, TaskStatus } from '@/types/domain/task';
import { generateDailySummary } from '@/utils/openai';

const Tarefas = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dailySummary, setDailySummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Filtrar tarefas por busca
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }

    const query = searchQuery.toLowerCase();
    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.subtitle?.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.observacao?.toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery]);

  // Agrupar tarefas por status
  const tasksByStatus = useMemo(() => {
    return {
      not_started: filteredTasks.filter((t) => t.status === 'not_started'),
      in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
      completed: filteredTasks.filter((t) => t.status === 'completed'),
    };
  }, [filteredTasks]);

  // Contar tarefas por status
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      not_started: tasks.filter((t) => t.status === 'not_started').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  const handleCreateTask = async (taskData: CreateTaskInput) => {
    try {
      await createTask(taskData);
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi criada com sucesso.',
      });
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: 'Erro ao criar tarefa',
        description: 'Não foi possível criar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskInput) => {
    if (!editingTask) return;

    try {
      await updateTask({ id: editingTask.id, updates: taskData });
      toast({
        title: 'Tarefa atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: 'Erro ao atualizar tarefa',
        description: 'Não foi possível atualizar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: 'Erro ao excluir tarefa',
        description: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleChangeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await changeStatus({ id: taskId, status });
      toast({
        title: 'Status atualizado',
        description: 'O status da tarefa foi alterado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status. Tente novamente.',
        variant: 'destructive',
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
      await handleChangeStatus(taskId, targetStatus);
    }
  };

  const handleCreateTaskInBlock = async (taskData: { title: string; description: string; status: TaskStatus }) => {
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

  const handleEditTaskInModal = async (task: Task, updates: CreateTaskInput) => {
    try {
      await updateTask({ id: task.id, updates });
      toast({
        title: 'Tarefa atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      // Atualizar a tarefa selecionada se for a mesma
      if (selectedTask?.id === task.id) {
        // Buscar a tarefa atualizada da lista
        const updatedTask = tasks.find((t) => t.id === task.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: 'Erro ao atualizar tarefa',
        description: 'Não foi possível atualizar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteTaskInModal = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi excluída com sucesso.',
      });
      if (selectedTask?.id === taskId) {
        setIsTaskDetailModalOpen(false);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: 'Erro ao excluir tarefa',
        description: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'destructive',
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

    try {
      await changeStatus({
        id: completingTask.id,
        status: 'completed',
        conclusion_text: conclusionText,
      });
      toast({
        title: 'Tarefa concluída',
        description: 'A tarefa foi concluída com sucesso.',
      });
      setIsCompletionModalOpen(false);
      setCompletingTask(null);
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      toast({
        title: 'Erro ao concluir tarefa',
        description: 'Não foi possível concluir a tarefa. Tente novamente.',
        variant: 'destructive',
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

  const handleGenerateSummary = async () => {
    const pendingTasks = tasks.filter(
      (task) => task.status === 'not_started' || task.status === 'in_progress'
    );

    if (pendingTasks.length === 0) {
      toast({
        title: 'Nenhuma tarefa pendente',
        description: 'Não há tarefas pendentes para resumir.',
        variant: 'destructive',
      });
      return;
    }

    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    setDailySummary('');

    try {
      const userName = profile?.full_name || 'Gestor';
      const summary = await generateDailySummary(pendingTasks, userName);
      setDailySummary(summary);
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast({
        title: 'Erro ao gerar resumo',
        description:
          'Não foi possível gerar o resumo das tarefas pendentes. Tente novamente.',
        variant: 'destructive',
      });
      setIsSummaryModalOpen(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600 mx-auto mb-4" />
          <p className="text-sm text-neutral-600">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Moderno */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white border border-neutral-300 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardList className="h-7 w-7 text-neutral-700" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                Minhas Tarefas
              </h1>
              <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">
                Organize e acompanhe suas atividades diárias
              </p>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="relative max-w-2xl mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar tarefas por título, descrição, subtítulo ou observação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-lg border-neutral-300 bg-white focus:border-neutral-400 focus:ring-neutral-200 transition-all duration-200"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3">
            <PremiumButton onClick={handleNewTask} icon={<Plus />} variant="secondary">
              Nova Tarefa
            </PremiumButton>
            <Button
              onClick={handleAITask}
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
            >
              <Wand2 className="h-4 w-4" />
              Criar com IA
            </Button>
            <Button
              onClick={handleGenerateSummary}
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-400 transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              Resumir Pendentes
            </Button>
          </div>
        </div>

        {/* Card de Progresso e Conquistas */}
        <div className="mb-6">
          <UserStatsCard />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="group relative bg-white border border-neutral-300 rounded-lg p-6 hover:shadow-md hover:border-neutral-400 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200">
                <ClipboardList className="h-5 w-5 text-neutral-700" />
              </div>
              <Badge variant="outline" className="border-neutral-300 bg-white text-neutral-700">
                Todas
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Total</p>
            <p className="text-3xl font-bold text-neutral-900">
              {taskCounts.all}
            </p>
          </div>

          <div className="group relative bg-white border border-neutral-300 rounded-lg p-6 hover:shadow-md hover:border-neutral-400 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200">
                <Clock className="h-5 w-5 text-neutral-700" />
              </div>
              <Badge variant="outline" className="border-neutral-300 bg-white text-neutral-700">
                Pendentes
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Não Iniciadas</p>
            <p className="text-3xl font-bold text-neutral-900">
              {taskCounts.not_started}
            </p>
          </div>

          <div className="group relative bg-white border border-neutral-300 rounded-lg p-6 hover:shadow-md hover:border-neutral-400 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-700" />
              </div>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                Ativas
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Em Andamento</p>
            <p className="text-3xl font-bold text-neutral-900">
              {taskCounts.in_progress}
            </p>
          </div>

          <div className="group relative bg-white border border-neutral-300 rounded-lg p-6 hover:shadow-md hover:border-neutral-400 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                Finalizadas
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Concluídas</p>
            <p className="text-3xl font-bold text-neutral-900">
              {taskCounts.completed}
            </p>
          </div>
        </div>

        {/* Layout de Blocos */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          onDragEnd={handleDragEnd}
        >
          <TaskBlock
            status="not_started"
            tasks={tasksByStatus.not_started}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverStatus('not_started');
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'not_started')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'not_started'}
          />
          <TaskBlock
            status="in_progress"
            tasks={tasksByStatus.in_progress}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverStatus('in_progress');
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'in_progress')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'in_progress'}
          />
          <TaskBlock
            status="completed"
            tasks={tasksByStatus.completed}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onChangeStatus={handleChangeStatus}
            onRequestCompletion={handleRequestCompletion}
            onCreateTask={handleCreateTaskInBlock}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverStatus('completed');
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'completed')}
            isDragging={draggedTaskId !== null}
            dragOver={dragOverStatus === 'completed'}
          />
        </div>

        {/* Mensagem quando não há tarefas */}
        {filteredTasks.length === 0 && (
          <Card className="border-neutral-300 bg-white shadow-sm mt-6">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 mb-6 font-medium">
                {searchQuery.trim()
                  ? 'Nenhuma tarefa encontrada com os termos de busca.'
                  : 'Nenhuma tarefa cadastrada ainda.'}
              </p>
              <Button
                onClick={handleNewTask}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
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

      <DailySummaryModal
        open={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
        summary={dailySummary}
        isGenerating={isGeneratingSummary}
        userName={profile?.full_name || 'Gestor'}
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
