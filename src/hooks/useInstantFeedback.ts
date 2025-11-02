import { useState, useTransition } from 'react';

/**
 * Hook para feedback visual instantâneo antes de requisições assíncronas
 * 
 * Implementa feedback imediato usando useTransition do React para priorizar
 * atualizações de UI, dando sensação de instantaneidade ao usuário.
 * 
 * @example
 * ```tsx
 * const { isPending, startTransition, feedback } = useInstantFeedback();
 * 
 * const handleClick = async () => {
 *   // Feedback visual imediato
 *   startTransition(() => {
 *     feedback.setPending(true);
 *   });
 *   
 *   try {
 *     await someAsyncOperation();
 *   } finally {
 *     feedback.setPending(false);
 *   }
 * };
 * ```
 */
export function useInstantFeedback() {
  const [isPending, setIsPending] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const feedback = {
    setPending: (pending: boolean) => {
      startTransition(() => {
        setIsPending(pending);
      });
    },
    isPending: isPending || isTransitioning,
  };

  return {
    isPending: feedback.isPending,
    startTransition,
    feedback,
  };
}

/**
 * Hook para optimistic updates com rollback automático
 * 
 * Atualiza UI imediatamente e faz rollback em caso de erro.
 * 
 * @example
 * ```tsx
 * const { optimisticUpdate, rollback } = useOptimisticUpdate();
 * 
 * const handleUpdate = async (newData) => {
 *   const previousData = currentData;
 *   optimisticUpdate(newData);
 *   
 *   try {
 *     await saveData(newData);
 *   } catch (error) {
 *     rollback(previousData);
 *   }
 * };
 * ```
 */
export function useOptimisticUpdate<T>(initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [previousData, setPreviousData] = useState<T | null>(null);
  const [isTransitioning, startTransition] = useTransition();

  const optimisticUpdate = (newData: T) => {
    setPreviousData(data);
    startTransition(() => {
      setData(newData);
    });
  };

  const rollback = () => {
    if (previousData !== null) {
      startTransition(() => {
        setData(previousData);
        setPreviousData(null);
      });
    }
  };

  const commit = () => {
    setPreviousData(null);
  };

  return {
    data,
    optimisticUpdate,
    rollback,
    commit,
    isPending: isTransitioning,
  };
}

