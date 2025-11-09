import { useState, useEffect, useRef } from 'react';

/**
 * Hook para throttle de valores
 * 
 * @param value - Valor a ser throttled
 * @param delay - Delay em milliseconds
 * @returns Valor throttled
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutedRef.current;

    // Se ainda estamos no período de throttle, agendar execução
    if (timeSinceLastExecution < delay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        setThrottledValue(value);
      }, delay - timeSinceLastExecution);
    } else {
      // Executar imediatamente
      lastExecutedRef.current = now;
      setThrottledValue(value);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}