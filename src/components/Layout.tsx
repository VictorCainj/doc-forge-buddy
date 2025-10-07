import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex">
        {/* Minimalista Sidebar */}
        <Sidebar />

        {/* Main Content Area - Minimalista */}
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
