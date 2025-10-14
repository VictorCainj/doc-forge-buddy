import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Sparkles, Edit, Check } from '@/utils/iconMapper';
import { generateTaskFromSituation } from '@/utils/openai';
import { useToast } from '@/hooks/use-toast';
import {
  AIGeneratedTask,
  TASK_STATUS_LABELS,
  CreateTaskInput,
} from '@/types/task';

interface AITaskCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: CreateTaskInput) => Promise<void>;
  onEditManually: (taskData: CreateTaskInput) => void;
}

export const AITaskCreationModal = ({
  open,
  onOpenChange,
  onCreateTask,
  onEditManually,
}: AITaskCreationModalProps) => {
  const [situation, setSituation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<AIGeneratedTask | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!situation.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Descreva a situação antes de gerar a tarefa.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const task = await generateTaskFromSituation(situation);
      setGeneratedTask(task);
      toast({
        title: 'Tarefa gerada!',
        description: 'Revise os dados e confirme ou edite manualmente.',
      });
    } catch (error) {
      console.error('Erro ao gerar tarefa:', error);
      toast({
        title: 'Erro ao gerar tarefa',
        description: 'Não foi possível gerar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!generatedTask) return;

    setIsCreating(true);
    try {
      const taskData: CreateTaskInput = {
        title: generatedTask.title,
        subtitle: generatedTask.subtitle || undefined,
        description: generatedTask.description,
        status: generatedTask.status,
      };

      await onCreateTask(taskData);

      // Reset modal
      setSituation('');
      setGeneratedTask(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditManually = () => {
    if (!generatedTask) return;

    const taskData: CreateTaskInput = {
      title: generatedTask.title,
      subtitle: generatedTask.subtitle || undefined,
      description: generatedTask.description,
      status: generatedTask.status,
    };

    onEditManually(taskData);

    // Reset modal
    setSituation('');
    setGeneratedTask(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSituation('');
    setGeneratedTask(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Criar Tarefa com IA
          </DialogTitle>
          <DialogDescription>
            Descreva a situação e a IA criará uma tarefa estruturada
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedTask ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="situation">Descreva a situação ou tarefa</Label>
                <Textarea
                  id="situation"
                  placeholder="Ex: O cliente do contrato 12345 está com atraso de pagamento há 3 meses e preciso cobrar urgentemente..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  disabled={isGenerating}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-neutral-500">
                  Seja específico: inclua números de contratos, datas, nomes e
                  detalhes relevantes.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !situation.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando tarefa...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar Tarefa com IA
                  </>
                )}
              </Button>
            </>
          ) : (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-neutral-500">Título</Label>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {generatedTask.title}
                    </h3>
                  </div>
                  <Badge variant="default" className="ml-2">
                    {TASK_STATUS_LABELS[generatedTask.status]}
                  </Badge>
                </div>

                {generatedTask.subtitle && (
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">
                      Subtítulo
                    </Label>
                    <p className="text-sm text-neutral-700">
                      {generatedTask.subtitle}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Descrição</Label>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {generatedTask.description}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedTask(null)}
                    className="flex-1"
                  >
                    Gerar Novamente
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEditManually}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating || isCreating}
          >
            Cancelar
          </Button>

          {generatedTask && (
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Criar Tarefa
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
