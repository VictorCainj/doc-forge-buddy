// Application context providers - Sistema unificado de state management
import { ReactNode, useEffect } from 'react';
import { AppStoreProvider, useAuthState, useNotificationState } from '@/stores';
import { ContractStoreProvider } from '@/stores/contractStore';
import { NotificationStoreProvider } from '@/stores/notificationStore';
import { useImageOptimizationGlobal } from '@/hooks/useImageOptimizationGlobal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient, queryUtils } from '@/lib/queryClient';
import { queryMonitor } from '@/lib/queryMonitor';
import { ErrorMonitoringProvider, ErrorMonitoringStatus } from './ErrorMonitoringProvider';

interface AppProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

// Configuração otimizada do React Query para performance instantânea
// Usar o queryClient configurado otimizadamente
const createOptimizedQueryClient = () => queryClient;

// Componente interno para usar hooks
function AppProvidersContent({ 
  children, 
  queryClient = createOptimizedQueryClient() 
}: { 
  children: ReactNode; 
  queryClient?: QueryClient;
}) {
  // Ativar otimização global de imagens
  useImageOptimizationGlobal();

  // Hook para migração gradual de estado
  const auth = useAuthState();
  const notifications = useNotificationState();

  // Efeito para migração gradual de dados existentes
  useEffect(() => {
    // Se há dados antigos no localStorage, migrar para o novo store
    const migrateLegacyData = () => {
      try {
        // Migração do tema
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && !['light', 'dark', 'system'].includes(savedTheme)) {
          console.warn('Tema legado encontrado, removendo...');
          localStorage.removeItem('theme');
        }

        // Migração de outros dados se necessário
        // Pode ser expandido conforme novos stores forem implementados
      } catch (error) {
        console.warn('Erro durante migração de dados:', error);
      }
    };

    migrateLegacyData();
  }, []);

  // Monitoramento de performance do React Query
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Log de estatísticas de cache periodicamente
      const interval = setInterval(() => {
        const cacheMetrics = queryMonitor.getCacheMetrics();
        console.log('React Query Cache Stats:', {
          totalQueries: cacheMetrics.totalQueries,
          activeQueries: cacheMetrics.activeQueries,
          staleQueries: cacheMetrics.staleQueries,
          errorQueries: cacheMetrics.errorQueries,
          hitRate: `${cacheMetrics.hitRate.toFixed(1)}%`
        });
      }, 30000); // A cada 30 segundos em dev

      return () => clearInterval(interval);
    }
  }, []);

  // Sincronização com estado legado (para migração gradual)
  useEffect(() => {
    // Esta seção pode ser expandida conforme necessário
    // para sincronizar com o estado legado durante a migração
  }, [auth, notifications]);

  return (
    <ErrorMonitoringProvider>
      <QueryClientProvider client={queryClient}>
        <AppStoreProvider>
          <ContractStoreProvider>
            <NotificationStoreProvider>
              {children}
              <ErrorMonitoringStatus />
            </NotificationStoreProvider>
          </ContractStoreProvider>
        </AppStoreProvider>
      </QueryClientProvider>
    </ErrorMonitoringProvider>
  );
}

export function AppProviders({ 
  children, 
  queryClient 
}: AppProvidersProps) {
  return <AppProvidersContent children={children} queryClient={queryClient} />;
}

// Export do QueryClient para uso externo se necessário
export { createOptimizedQueryClient };
