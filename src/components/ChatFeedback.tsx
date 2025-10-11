import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback, type FeedbackData } from '@/utils/chatMetrics';
import { log } from '@/utils/logger';

interface ChatFeedbackProps {
  messageId: string;
  onFeedbackSubmitted?: () => void;
}

export const ChatFeedback = ({
  messageId,
  onFeedbackSubmitted,
}: ChatFeedbackProps) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRating = async (
    rating: 1 | 5,
    feedbackType: FeedbackData['feedbackType']
  ) => {
    setSelectedRating(rating);

    if (rating <= 2) {
      // Para feedback negativo, pedir mais detalhes
      setShowCommentBox(true);
    } else {
      // Para feedback positivo, enviar imediatamente
      await submitFeedbackData({
        messageId,
        rating,
        feedbackType,
      });
    }
  };

  const submitFeedbackData = async (feedbackData: FeedbackData) => {
    try {
      setIsSubmitting(true);

      const success = await submitFeedback(feedbackData);

      if (success) {
        toast({
          title: 'Obrigado pelo feedback!',
          description: 'Sua avaliação nos ajuda a melhorar.',
        });

        onFeedbackSubmitted?.();
        setShowCommentBox(false);
        setComment('');
      } else {
        throw new Error('Falha ao enviar feedback');
      }
    } catch (error) {
      log.error('Erro ao enviar feedback', error);
      toast({
        title: 'Erro ao enviar feedback',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!selectedRating) return;

    await submitFeedbackData({
      messageId,
      rating: selectedRating as 1 | 2 | 3 | 4 | 5,
      feedbackType: 'unhelpful',
      comment,
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating(5, 'helpful')}
          disabled={selectedRating !== null}
          className={selectedRating === 5 ? 'text-success-600' : ''}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating(1, 'unhelpful')}
          disabled={selectedRating !== null}
          className={selectedRating === 1 ? 'text-error-600' : ''}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>

        {selectedRating && (
          <span className="text-xs text-neutral-500">
            Obrigado pelo feedback!
          </span>
        )}
      </div>

      {showCommentBox && (
        <div className="flex flex-col gap-2 mt-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que poderia ser melhor? (opcional)"
            className="text-sm"
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleCommentSubmit}
            disabled={isSubmitting}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar comentário'}
          </Button>
        </div>
      )}
    </div>
  );
};
