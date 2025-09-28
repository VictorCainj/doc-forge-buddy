import { createContext } from 'react';

// Context para comunicação entre Sidebar e páginas
export const SearchContext = createContext<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}>({
  searchTerm: '',
  setSearchTerm: () => {},
});
