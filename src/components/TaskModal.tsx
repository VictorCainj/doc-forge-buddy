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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, Loader2, CheckCheck } from '@/utils/iconMapper';
import {
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
  CreateTaskInput,
} from '@/types/task';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useToast } from '@/hooks/use-toast';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: CreateTaskInput) => Promise<void>;
  task?: Task | null;
  isSubmitting?: boolean;
}

export const TaskModal = ({
  open,
  onOpenChange,
  onSubmit,
  task,
  isSubmitting = false,
}: TaskModalProps) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [isImproving, setIsImproving] = useState(false);
  const [isImprovingObservacao, setIsImprovingObservacao] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isCorrectingObservacao, setIsCorrectingObservacao] = useState(false);

  const { improveText, correctText } = useOpenAI();
  const { toast } = useToast();

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setSubtitle(task.subtitle);
        setDescription(task.description);
        setObservacao(task.observacao);
        setStatus(task.status);
      } else {
        setTitle('');
        setSubtitle('');
        setDescription('');
        setObservacao('');
        setStatus('not_started');
      }
    }
  }, [open, task]);

  const handleImproveDescription = async () => {
    if (!description.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Adicione uma descrição antes de revisar com IA.',
        variant: 'destructive',
      });
      return;
    }

    setIsImproving(true);
    try {
      const improvedText = await improveText(description);
      setDescription(improvedText);
      toast({
        title: 'Texto revisado',
        description: 'A descrição foi melhorada pela IA.',
      });
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      toast({
        title: 'Erro ao revisar',
        description: 'Não foi possível revisar o texto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleImproveObservacao = async () => {
    if (!observacao.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Adicione uma observação antes de revisar com IA.',
        variant: 'destructive',
      });
      return;
    }

    setIsImprovingObservacao(true);
    try {
      const improvedText = await improveText(observacao);
      setObservacao(improvedText);
      toast({
        title: 'Texto revisado',
        description: 'A observação foi melhorada pela IA.',
      });
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      toast({
        title: 'Erro ao revisar',
        description: 'Não foi possível revisar o texto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsImprovingObservacao(false);
    }
  };

  const handleCorrectDescription = async () => {
    if (!description.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Adicione uma descrição antes de corrigir.',
        variant: 'destructive',
      });
      return;
    }

    setIsCorrecting(true);
    try {
      const correctedText = await correctText(description);
      setDescription(correctedText);
      toast({
        title: 'Gramática corrigida',
        description: 'A descrição foi corrigida pela IA.',
      });
    } catch (error) {
      console.error('Erro ao corrigir texto:', error);
      toast({
        title: 'Erro ao corrigir',
        description: 'Não foi possível corrigir o texto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleCorrectObservacao = async () => {
    if (!observacao.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Adicione uma observação antes de corrigir.',
        variant: 'destructive',
      });
      return;
    }

    setIsCorrectingObservacao(true);
    try {
      const correctedText = await correctText(observacao);
      setObservacao(correctedText);
      toast({
        title: 'Gramática corrigida',
        description: 'A observação foi corrigida pela IA.',
      });
    } catch (error) {
      console.error('Erro ao corrigir texto:', error);
      toast({
        title: 'Erro ao corrigir',
        description: 'Não foi possível corrigir o texto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCorrectingObservacao(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'A descrição é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    const taskData: CreateTaskInput = {
      title: title.trim(),
      ...(subtitle.trim() && { subtitle: subtitle.trim() }),
      description: description.trim(),
      ...(observacao.trim() && { observacao: observacao.trim() }),
      status,
    };

    try {
      await onSubmit(taskData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Edite os detalhes da tarefa abaixo.'
              : 'Preencha os detalhes da nova tarefa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Cobrar conta de consumo do contrato 12342"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                placeholder="Ex: Pendência financeira"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCorrectDescription}
                    disabled={
                      isCorrecting || isSubmitting || !description.trim()
                    }
                    className="h-8 gap-1"
                  >
                    {isCorrecting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Corrigindo...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-3 w-3" />
                        Corrigir Gramática
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleImproveDescription}
                    disabled={
                      isImproving || isSubmitting || !description.trim()
                    }
                    className="h-8 gap-1"
                  >
                    {isImproving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Revisando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3" />
                        Revisar com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Textarea
                id="description"
                placeholder="Descreva os detalhes da tarefa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="observacao">Observação</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCorrectObservacao}
                    disabled={
                      isCorrectingObservacao ||
                      isSubmitting ||
                      !observacao.trim()
                    }
                    className="h-8 gap-1"
                  >
                    {isCorrectingObservacao ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Corrigindo...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-3 w-3" />
                        Corrigir Gramática
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleImproveObservacao}
                    disabled={
                      isImprovingObservacao ||
                      isSubmitting ||
                      !observacao.trim()
                    }
                    className="h-8 gap-1"
                  >
                    {isImprovingObservacao ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Revisando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3" />
                        Revisar com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Textarea
                id="observacao"
                placeholder="Adicione atualizações sobre o progresso desta tarefa..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
              <p className="text-xs text-neutral-500">
                Use este campo para registrar atualizações e progresso da tarefa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
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
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>{task ? 'Salvar Alterações' : 'Criar Tarefa'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
