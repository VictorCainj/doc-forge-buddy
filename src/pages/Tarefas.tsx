import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/premium-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { TaskCard } from '@/components/TaskCard';
import { TaskModal } from '@/components/TaskModal';
import { AITaskCreationModal } from '@/components/AITaskCreationModal';
import { DailySummaryModal } from '@/components/DailySummaryModal';
import { TaskCompletionModal } from '@/components/TaskCompletionModal';
import { UserStatsCard } from '@/components/UserStatsCard';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Task, CreateTaskInput, TaskStatus } from '@/types/task';
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

  const [selectedTab, setSelectedTab] = useState<string>('in_progress');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dailySummary, setDailySummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Garantir que o filtro sempre comece com 'in_progress' selecionado
  useEffect(() => {
    setSelectedTab('in_progress');
  }, []);

  // Filtrar tarefas por status e busca
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filtrar por status
    if (selectedTab !== 'all') {
      filtered = filtered.filter((task) => task.status === selectedTab);
    }

    // Filtrar por busca (título, subtítulo, descrição e observação)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) => {
        return (
          task.title.toLowerCase().includes(query) ||
          task.subtitle?.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.observacao?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [tasks, selectedTab, searchQuery]);

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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-neutral-600">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Moderno */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ClipboardList className="h-7 w-7 text-white" />
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
              className="pl-12 h-12 rounded-xl border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
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
          <div className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-neutral-100 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardList className="h-5 w-5 text-neutral-700" />
                </div>
                <Badge variant="outline" className="border-neutral-300">
                  Todas
                </Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-1">Total</p>
              <p className="text-3xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                {taskCounts.all}
              </p>
            </div>
          </div>

          <div className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neutral-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-neutral-100 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 text-neutral-700" />
                </div>
                <Badge variant="outline" className="border-neutral-300">
                  Pendentes
                </Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-1">Não Iniciadas</p>
              <p className="text-3xl font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                {taskCounts.not_started}
              </p>
            </div>
          </div>

          <div className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-5 w-5 text-blue-700" />
                </div>
                <Badge
                  variant="outline"
                  className="border-blue-300 bg-blue-50 text-blue-700"
                >
                  Ativas
                </Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-1">Em Andamento</p>
              <p className="text-3xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                {taskCounts.in_progress}
              </p>
            </div>
          </div>

          <div className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                </div>
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700"
                >
                  Finalizadas
                </Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-1">Concluídas</p>
              <p className="text-3xl font-bold text-neutral-900 group-hover:text-green-600 transition-colors">
                {taskCounts.completed}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs e Lista de Tarefas */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="bg-white border border-neutral-200 rounded-xl p-2 shadow-sm mb-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-transparent h-auto">
              <TabsTrigger
                value="all"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                Todas ({taskCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="not_started"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                Não Iniciadas ({taskCounts.not_started})
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                Em Andamento ({taskCounts.in_progress})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold hover:bg-neutral-50 transition-all duration-200"
              >
                Concluídas ({taskCounts.completed})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value={selectedTab}
            className="mt-6"
          >
            {filteredTasks.length === 0 ? (
              <Card className="border-neutral-200 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 mb-6">
                    {selectedTab === 'all'
                      ? 'Nenhuma tarefa cadastrada ainda.'
                      : 'Nenhuma tarefa encontrada com este status.'}
                  </p>
                  <Button
                    onClick={handleNewTask}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Primeira Tarefa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onChangeStatus={handleChangeStatus}
                    onRequestCompletion={handleRequestCompletion}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
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
