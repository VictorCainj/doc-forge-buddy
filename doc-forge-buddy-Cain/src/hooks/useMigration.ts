import { useEffect, useState } from 'react';
import { MigrationUtils } from '@/utils/migrationUtils';

interface UseMigrationReturn {
  isRunning: boolean;
  isCompleted: boolean;
  error: string | null;
  runMigration: () => Promise<void>;
}

/**
 * Hook para executar migrações de banco de dados
 * Executa automaticamente na inicialização se necessário
 */
export function useMigration(): UseMigrationReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async (): Promise<void> => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      await MigrationUtils.runMigrationIfNeeded();
      setIsCompleted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na migração';
      setError(errorMessage);
      console.error('Erro na migração:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Executar migração automaticamente na inicialização
  useEffect(() => {
    runMigration();
  }, []);

  return {
    isRunning,
    isCompleted,
    error,
    runMigration,
  };
}