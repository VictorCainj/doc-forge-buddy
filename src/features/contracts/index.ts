/**
 * Barrel export para o domínio de Contratos
 * Centraliza todas as exportações da feature
 */

// Components
export { ContractCard } from './components/ContractCard';
export { ContractList } from './components/ContractList';
export { ContractHeader } from './components/ContractHeader';
export { ContractForm } from './components/ContractForm';
export { ContractModals } from './components/ContractModals';

// Hooks
export { useContractList } from './hooks/useContractList';
export { useContractModals } from './hooks/useContractModals';
export { useContractData } from './hooks/useContractData';
export { useContractActions } from './hooks/useContractActions';

// Pages
export { ContractsPage } from './pages/ContractsPage';
export { ContractDetailsPage } from './pages/ContractDetailsPage';
export { CreateContractPage } from './pages/CreateContractPage';

// Services
export { contractsApi } from './services/contractsApi';
export { contractsService } from './services/contractsService';

// Types
export type {
  Contract,
  ContractFormData,
  ContractStatus,
  DocumentType,
  VistoriaType,
  PersonType,
} from './types/contract';

export type {
  ContractListProps,
  ContractCardProps,
  ContractFormProps,
} from './types/components';

// Constants
export { CONTRACT_STATUSES, DOCUMENT_TYPES } from './constants/contractConstants';
