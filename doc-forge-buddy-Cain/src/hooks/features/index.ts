// Feature-specific hooks

// Consolidated business hooks
export * from './useVistoriaAnalyser';
export * from './useBudgetAnalyzer';

// Legacy hooks (for backward compatibility - will be deprecated)
export * from './useDocumentGeneration';
export * from './useDualChat';
export * from './useEditarMotivo';
export * from './useEvictionReasons';
export * from './useEvictionReasonsAdmin';
export * from './useDashboardDesocupacao';

// Note: Contract-related hooks have been consolidated into useContractManager (shared)
// useContractData, useContractAnalysis, useCompleteContractData, useContractBills, 
// useContractBillsSync, useContractsQuery, useContractFavorites, useContractTags, 
// useContractsWithPendingBills have been deprecated in favor of shared hooks
