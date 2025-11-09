// Provider and context management hooks

// Consolidated providers
export * from './useAuthProvider';
export * from './useThemeProvider';

// Legacy hooks (for backward compatibility)
export * from './useChatPersistence';
export * from './useCleanupDuplicates';
export * from './useConversationProfiles';

// Note: useAuth has been consolidated into useAuthProvider
// Note: useBudgetAnalysis has been moved to features as useBudgetAnalyzer
