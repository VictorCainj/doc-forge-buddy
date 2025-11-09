/**
 * Utilitários para otimização de performance
 * Ajuda a evitar long main-thread tasks e melhorar responsividade
 */

/**
 * Executa uma função usando requestIdleCallback quando disponível,
 * ou setTimeout como fallback
 */
export function runWhenIdle(callback: () => void, timeout = 5000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback para navegadores sem suporte
    setTimeout(callback, 0);
  }
}

/**
 * Divide uma tarefa pesada em chunks menores usando requestIdleCallback
 * Útil para processar arrays grandes ou operações pesadas
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T) => void,
  chunkSize = 10,
  onComplete?: () => void
): void {
  let index = 0;

  const processChunk = () => {
    const end = Math.min(index + chunkSize, items.length);

    for (let i = index; i < end; i++) {
      processor(items[i]);
    }

    index = end;

    if (index < items.length) {
      runWhenIdle(processChunk);
    } else if (onComplete) {
      onComplete();
    }
  };

  processChunk();
}

/**
 * Debounce com suporte a requestIdleCallback para tarefas não críticas
 */
export function debounceIdle<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      runWhenIdle(() => {
        func.apply(this, args);
      });
    }, wait);
  };
}

/**
 * Mede o tempo de execução de uma função
 * Útil para identificar long tasks
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}

/**
 * Verifica se uma tarefa está demorando muito e avisa
 */
export function shouldYield(): boolean {
  return performance.now() % 50 === 0; // Yield a cada ~50ms
}
