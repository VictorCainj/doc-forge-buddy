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

      {/* Main Content Area - Com margem para o sidebar e header mobile */}
      <main
        role="main"
        aria-label="Conteúdo principal"
        className="min-h-screen w-full overflow-auto pt-16 md:pt-0 md:pl-[60px] transition-all duration-300"
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
