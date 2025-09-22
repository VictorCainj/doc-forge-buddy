import { ReactNode, createContext, useContext, useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

// Context para comunicação entre Sidebar e páginas
const SearchContext = createContext<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}>({
  searchTerm: '',
  setSearchTerm: () => {},
});

export const useSearchContext = () => useContext(SearchContext);

const Layout = ({ children }: LayoutProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Professional Sidebar */}
          <Sidebar onSearchChange={setSearchTerm} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SearchContext.Provider>
  );
};

export default Layout;
