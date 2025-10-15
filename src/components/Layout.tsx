import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar Expansível (fixed) */}
      <Sidebar />

      {/* Main Content Area - Full Width */}
      <main
        role="main"
        aria-label="Conteúdo principal"
        className="min-h-screen w-full overflow-auto"
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
