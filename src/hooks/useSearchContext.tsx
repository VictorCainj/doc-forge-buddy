import { useContext } from 'react';
import { SearchContext } from '../contexts/SearchContextDefinition';

// Hook para usar o contexto
export const useSearchContext = () => useContext(SearchContext);
