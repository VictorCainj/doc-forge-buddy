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
import { Loader2, Wand2 } from '@/utils/iconMapper';
import { correctTextWithAI } from '@/utils/openai';
import { useToast } from '@/components/ui/use-toast';

interface TaskCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onSubmit: (conclusionText: string) => Promise<void>;
}

export const TaskCompletionModal = ({
  open,
  onOpenChange,
  taskTitle,
  onSubmit,
}: TaskCompletionModalProps) => {
  const [conclusionText, setConclusionText] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCorrectGrammar = async () => {
    if (!conclusionText.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Adicione um texto de conclusão antes de corrigir.',
        variant: 'destructive',
      });
      return;
    }

    setIsCorrecting(true);
    try {
      const correctedText = await correctTextWithAI(conclusionText);
      setConclusionText(correctedText);
      toast({
        title: 'Gramática corrigida',
        description: 'O texto foi corrigido pela IA.',
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

  const handleSubmit = async () => {
    if (!conclusionText.trim()) {
      toast({
        title: 'Texto obrigatório',
        description: 'Por favor, adicione um texto de conclusão.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(conclusionText);
      setConclusionText('');
    } catch (error) {
      console.error('Erro ao confirmar conclusão:', error);
      toast({
        title: 'Erro ao concluir tarefa',
        description: 'Não foi possível concluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConclusionText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Concluir Tarefa</DialogTitle>
          <DialogDescription>
            Adicione um texto de conclusão para a tarefa: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="conclusion-text">Texto de Conclusão</Label>
            <Textarea
              id="conclusion-text"
              placeholder="Descreva como a tarefa foi concluída..."
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCorrectGrammar}
              disabled={!conclusionText.trim() || isCorrecting || isSubmitting}
              className="gap-2"
            >
              {isCorrecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Corrigir Gramática
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!conclusionText.trim() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Concluindo...
              </>
            ) : (
              'Confirmar Conclusão'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

