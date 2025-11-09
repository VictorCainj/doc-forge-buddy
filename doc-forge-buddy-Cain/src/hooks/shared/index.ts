// Shared utility hooks

// Existing hooks
export * from './use-mobile';
export * from './use-toast';
export * from './useAIMemory';
export * from './useAdaptiveChat';
export * from './useChatHistory';
export * from './useClipboard';
export * from './useDebounce';
export * from './use-form-wizard';

// New consolidated utility hooks
export * from './usePrevious';
export * from './useAsync';
export * from './useErrorBoundary';

// Consolidated business logic hooks
export * from './useContractManager';
export * from './useContractBills';
export * from './useImageOptimizer';
export * from './useAPI';

// Re-export from useLocalStorage (moved from root)
export * from './useLocalStorage';
