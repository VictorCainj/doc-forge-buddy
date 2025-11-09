// State management stores centralizados
// Sistema implementado com Context API para máxima compatibilidade e performance

// Store principal da aplicação (autenticação, tema, notificações globais)
export * from './appStore';
export {
  AppStoreProvider,
  useAppStore,
  useAuthState,
  useThemeState,
  useNotificationState as useGlobalNotificationState,
  useAppState,
} from './appStore';

// Store específico para contratos
export * from './contractStore';
export {
  ContractStoreProvider,
  useContractStore,
} from './contractStore';

// Store específico para notificações avançadas
export * from './notificationStore';
export {
  NotificationStoreProvider,
  useNotificationStore,
} from './notificationStore';

// Tipos globais
export * from '@/types/global';
