import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { SearchProvider } from '@/contexts/SearchContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SearchProvider>
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Professional Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
};

export default Layout;
