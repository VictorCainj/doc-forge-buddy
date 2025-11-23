import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Loader2,
} from '@/utils/iconMapper';
import {
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  CreateTaskInput,
} from '../types/task';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit: (task: Task, updates: CreateTaskInput) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onChangeStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onRequestCompletion?: (task: Task) => void;
  isSubmitting?: boolean;
  onTaskUpdated?: (updatedTask: Task) => void;
}

export const TaskDetailModal = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  isSubmitting = false,
  onTaskUpdated,
}: TaskDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<CreateTaskInput | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resetar estado quando o modal abre/fecha ou a tarefa muda
  useEffect(() => {
    if (open && task) {
      setIsEditing(false);
      setEditedTask({
        title: task.title,
        subtitle: task.subtitle,
        description: task.description,
        observacao: task.observacao,
        status: task.status,
      });
    } else if (!open) {
      setIsEditing(false);
      setEditedTask(null);
    }
  }, [open, task]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'not_started':
        return <Circle className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDateBrazilian(dateString)} às ${date.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`;
  };

  const handleSave = async () => {
    if (!task || !editedTask) return;

    setIsSaving(true);
    try {
      await onEdit(task, editedTask);
      setIsEditing(false);
      // Notificar que a tarefa foi atualizada
      if (onTaskUpdated && editedTask) {
        const updatedTask: Task = {
          ...task,
          ...editedTask,
          updated_at: new Date().toISOString(),
        };
        onTaskUpdated(updatedTask);
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    if (newStatus === 'completed' && onRequestCompletion) {
      onRequestCompletion(task);
    } else {
      await onChangeStatus(task.id, newStatus);
      if (editedTask) {
        setEditedTask({ ...editedTask, status: newStatus });
      }
      // Atualizar a tarefa localmente
      if (onTaskUpdated) {
        const updatedTask: Task = {
          ...task,
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' && !task.completed_at
            ? { completed_at: new Date().toISOString() }
            : {}),
        };
        onTaskUpdated(updatedTask);
      }
    }
  };

  if (!task) return null;

  const displayTask = isEditing && editedTask ? editedTask : task;
  const currentStatus = isEditing && editedTask ? editedTask.status : task.status;

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'in_progress':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'not_started':
        return 'bg-neutral-100 border-neutral-300 text-neutral-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-neutral-300 bg-white">
        <DialogHeader className="border-b border-neutral-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedTask?.title || ''}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask!,
                      title: e.target.value,
                    })
                  }
                  className="text-2xl font-semibold border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-neutral-900"
                  placeholder="Título da tarefa"
                />
              ) : (
                <DialogTitle className="text-2xl font-semibold text-neutral-900 pr-8">
                  {task.title}
                </DialogTitle>
              )}
              {task.subtitle && (
                <DialogDescription className="text-base mt-2 text-neutral-600">
                  {isEditing ? (
                    <Input
                      value={editedTask?.subtitle || ''}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask!,
                          subtitle: e.target.value,
                        })
                      }
                      className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-neutral-600"
                      placeholder="Subtítulo (opcional)"
                    />
                  ) : (
                    task.subtitle
                  )}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 border px-3 py-1",
                  getStatusBadgeColor(currentStatus)
                )}
              >
                {getStatusIcon(currentStatus)}
                {isEditing ? (
                  <Select
                    value={currentStatus}
                    onValueChange={(value) => {
                      const newStatus = value as TaskStatus;
                      setEditedTask({
                        ...editedTask!,
                        status: newStatus,
                      });
                    }}
                  >
                    <SelectTrigger className="h-5 border-none bg-transparent p-0 focus:ring-0 text-inherit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">
                        {TASK_STATUS_LABELS.not_started}
                      </SelectItem>
                      <SelectItem value="in_progress">
                        {TASK_STATUS_LABELS.in_progress}
                      </SelectItem>
                      <SelectItem value="completed">
                        {TASK_STATUS_LABELS.completed}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  TASK_STATUS_LABELS[currentStatus]
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">
              Descrição
            </label>
            {isEditing ? (
              <Textarea
                value={editedTask?.description || ''}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask!,
                    description: e.target.value,
                  })
                }
                rows={6}
                className="resize-none border-neutral-300 focus:border-neutral-400"
                placeholder="Descreva os detalhes da tarefa..."
              />
            ) : (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words leading-relaxed">
                  {task.description || 'Sem descrição'}
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          {(task.observacao || isEditing) && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">
                Observações
              </label>
              {isEditing ? (
                <Textarea
                  value={editedTask?.observacao || ''}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask!,
                      observacao: e.target.value,
                    })
                  }
                  rows={4}
                  className="resize-none border-neutral-300 focus:border-neutral-400"
                  placeholder="Adicione observações sobre o progresso desta tarefa..."
                />
              ) : (
                task.observacao && (
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs font-medium text-neutral-700 mb-2">
                      Observações:
                    </p>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap break-words leading-relaxed">
                      {task.observacao}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Texto de Conclusão */}
          {task.conclusion_text && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">
                Texto de Conclusão
              </label>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs font-medium text-emerald-900 mb-2">
                  Conclusão:
                </p>
                <p className="text-sm text-emerald-800 whitespace-pre-wrap break-words leading-relaxed">
                  {task.conclusion_text}
                </p>
              </div>
            </div>
          )}

          {/* Informações de Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Data de Criação
              </label>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Clock className="h-4 w-4 text-neutral-500" />
                <span>{formatDateTime(task.created_at)}</span>
              </div>
            </div>
            {task.completed_at && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Data de Conclusão
                </label>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{formatDateTime(task.completed_at)}</span>
                </div>
              </div>
            )}
            {task.updated_at && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Última Atualização
                </label>
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Clock className="h-4 w-4 text-neutral-500" />
                  <span>{formatDateTime(task.updated_at)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting || isDeleting}
                  className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {task.status !== 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('completed')}
                    disabled={isSubmitting || isDeleting}
                    className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Concluída
                  </Button>
                )}
                {task.status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={isSubmitting || isDeleting}
                    className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Reabrir Tarefa
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask({
                      title: task.title,
                      subtitle: task.subtitle,
                      description: task.description,
                      observacao: task.observacao,
                      status: task.status,
                    });
                  }}
                  disabled={isSaving || isDeleting}
                  className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isDeleting || !editedTask?.title.trim()}
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving || isDeleting || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

