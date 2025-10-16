import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Loader2, Wand2, Search } from '@/utils/iconMapper';
import { TaskCard } from '@/components/TaskCard';
import { TaskModal } from '@/components/TaskModal';
import { AITaskCreationModal } from '@/components/AITaskCreationModal';
import { DailySummaryModal } from '@/components/DailySummaryModal';
import { UserStatsCard } from '@/components/UserStatsCard';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Task, CreateTaskInput, TaskStatus } from '@/types/task';
import { generateDailySummary } from '@/utils/openai';

const Tarefas = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
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
    getTodayTasks,
  } = useTasks();

  const [selectedTab, setSelectedTab] = useState<string>('in_progress');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      await deleteTask(taskId);
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
    // Simular uma tarefa editável com os dados gerados pela IA
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
    const todayTasks = getTodayTasks();

    if (todayTasks.length === 0) {
      toast({
        title: 'Nenhuma tarefa hoje',
        description: 'Não há tarefas registradas para hoje.',
        variant: 'destructive',
      });
      return;
    }

    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    setDailySummary('');

    try {
      const userName = profile?.full_name || 'Gestor';
      const summary = await generateDailySummary(todayTasks, userName);
      setDailySummary(summary);
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast({
        title: 'Erro ao gerar resumo',
        description: 'Não foi possível gerar o resumo do dia. Tente novamente.',
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
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-sm text-neutral-600">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Tarefas
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Gerencie suas tarefas e acompanhe o progresso das atividades
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleGenerateSummary}>
                <FileText className="h-4 w-4 mr-2" />
                Resumir Dia
              </Button>
              <Button variant="secondary" onClick={handleAITask}>
                <Wand2 className="h-4 w-4 mr-2" />
                Criar com IA
              </Button>
              <Button onClick={handleNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar tarefas por título, descrição, subtítulo ou observação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Card de Progresso e Conquistas */}
        <div className="mb-6">
          <UserStatsCard />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {taskCounts.all}
                  </p>
                </div>
                <Badge variant="default">Todas</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Não Iniciadas</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {taskCounts.not_started}
                  </p>
                </div>
                <Badge variant="default">Pendentes</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Em Andamento</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {taskCounts.in_progress}
                  </p>
                </div>
                <Badge variant="warning">Ativas</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Concluídas</p>
                  <p className="text-2xl font-semibold text-neutral-900">
                    {taskCounts.completed}
                  </p>
                </div>
                <Badge variant="success">Finalizadas</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs e Lista de Tarefas */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({taskCounts.all})</TabsTrigger>
            <TabsTrigger value="not_started">
              Não Iniciadas ({taskCounts.not_started})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Em Andamento ({taskCounts.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({taskCounts.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-neutral-500">
                    {selectedTab === 'all'
                      ? 'Nenhuma tarefa cadastrada ainda.'
                      : 'Nenhuma tarefa encontrada com este status.'}
                  </p>
                  <Button onClick={handleNewTask} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
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
    </div>
  );
};

export default Tarefas;
