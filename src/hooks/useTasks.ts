import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  EXP_PER_TASK,
  calculateLevel,
} from '@/types/task';
import { useAuth } from './useAuth';
import { log } from '@/utils/logger';
import { useToast } from './use-toast';

export const useTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all tasks for the current user
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        log.warn('Tentativa de buscar tarefas sem usuário autenticado');
        return [];
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Erro ao buscar tarefas:', error);
        throw error;
      }

      log.debug(`${data?.length || 0} tarefas carregadas`);
      return data as Task[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskInput: CreateTaskInput) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const newTask = {
        user_id: user.id,
        title: taskInput.title,
        subtitle: taskInput.subtitle || '',
        description: taskInput.description,
        observacao: taskInput.observacao || '',
        status: taskInput.status || 'not_started',
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        log.error('Erro ao criar tarefa:', error);
        throw error;
      }

      log.debug('Tarefa criada com sucesso:', data.id);
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Update an existing task
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateTaskInput;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        log.error('Erro ao atualizar tarefa:', error);
        throw error;
      }

      log.debug('Tarefa atualizada com sucesso:', id);
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Delete a task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        log.error('Erro ao excluir tarefa:', error);
        throw error;
      }

      log.debug('Tarefa excluída com sucesso:', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Change task status
  const changeStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      conclusion_text,
    }: {
      id: string;
      status: TaskStatus;
      conclusion_text?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar tarefa atual para verificar status anterior
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const updateData: Record<string, unknown> = { status };
      if (conclusion_text !== undefined) {
        updateData.conclusion_text = conclusion_text;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        log.error('Erro ao mudar status da tarefa:', error);
        throw error;
      }

      // Se a tarefa foi completada agora, adicionar EXP
      if (status === 'completed' && currentTask?.status !== 'completed') {
        await addExpToUser(user.id);
      }

      log.debug(`Status da tarefa ${id} alterado para ${status}`);
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userLevel', user?.id] });
    },
  });

  // Função para adicionar EXP ao usuário
  const addExpToUser = async (userId: string) => {
    // Buscar EXP atual
    const { data: profile } = await supabase
      .from('profiles')
      .select('exp, level')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    const oldLevel = profile.level;
    const newExp = profile.exp + EXP_PER_TASK;
    const newLevel = calculateLevel(newExp);

    // Atualizar EXP (o trigger atualizará o level automaticamente)
    const { error } = await supabase
      .from('profiles')
      .update({ exp: newExp })
      .eq('user_id', userId);

    if (error) {
      log.error('Erro ao adicionar EXP:', error);
      return;
    }

    // Mostrar toast de EXP ganho
    toast({
      title: '🎉 +10 EXP',
      description: 'Você completou uma tarefa!',
      className: 'bg-green-50 border-green-200',
    });

    // Se subiu de nível, mostrar toast especial
    if (newLevel > oldLevel) {
      const _levelInfo = await supabase
        .from('profiles')
        .select('level')
        .eq('user_id', userId)
        .single();

      setTimeout(() => {
        toast({
          title: `🎊 Level Up! Nível ${newLevel}`,
          description: `Parabéns! Você alcançou um novo nível!`,
          className: 'bg-yellow-50 border-yellow-200',
        });
      }, 500);
    }
  };

  // Complete a task (shortcut for changing status to completed)
  const completeTask = async (id: string) => {
    return changeStatusMutation.mutateAsync({ id, status: 'completed' });
  };

  // Get tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  // Get tasks created today
  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      const taskDate = new Date(task.created_at);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  };

  // Get tasks completed today
  const getTodayCompletedTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.completed_at) return false;
      const completedDate = new Date(task.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
  };

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    changeStatus: changeStatusMutation.mutateAsync,
    completeTask,
    getTasksByStatus,
    getTodayTasks,
    getTodayCompletedTasks,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isChangingStatus: changeStatusMutation.isPending,
  };
};
