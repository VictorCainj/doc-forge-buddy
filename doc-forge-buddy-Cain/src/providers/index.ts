// Centralized providers export
export * from './AppProviders';

// Re-export para compatibilidade
export {
  AppStoreProvider,
  useAppStore,
  useAuthState,
  useThemeState,
  useNotificationState as useGlobalNotificationState,
  useAppState,
} from '@/stores';

export {
  ContractStoreProvider,
  useContractStore,
} from '@/stores/contractStore';

export {
  NotificationStoreProvider,
  useNotificationStore,
} from '@/stores/notificationStore';
