// Context
export {
  AnaliseVistoriaProvider,
  useAnaliseVistoriaContext,
} from './context/AnaliseVistoriaContext';

// Hooks
export * from './hooks';
export { useVistoriaState } from './hooks/useVistoriaState';
export { useVistoriaHandlers } from './hooks/useVistoriaHandlers';

// Components
export * from './components';
export { ImageUploadSection } from './components/ImageUploadSection';
export { ApontamentoForm } from './components/ApontamentoForm';
export { VistoriaResults } from './components/VistoriaResults';
export { PrestadorSelector } from './components/PrestadorSelector';
export { VistoriaActions } from './components/VistoriaActions';

// Types
export * from './types';
export * from './types/vistoria';

// Utilidades
export * from './utils/vistoriaUtils';

// Componente principal refatorado
export { default as AnaliseVistoriaRefatorado } from './AnaliseVistoria';
