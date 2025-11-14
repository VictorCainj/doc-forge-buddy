import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Loader2 } from '@/utils/iconMapper';
import { TaskStatus } from '@/types/domain/task';

interface QuickTaskFormProps {
  onSubmit: (taskData: { title: string; description: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultStatus?: TaskStatus;
}

export const QuickTaskForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultStatus,
}: QuickTaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || 'Sem descrição',
    });

    // Reset form
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="space-y-2">
        <Input
          placeholder="Título da tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="h-9 text-sm"
          autoFocus
        />
        <Textarea
          placeholder="Descrição (opcional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="text-sm resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !title.trim()}
          className="flex-1 h-8 text-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8 px-3"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
};

