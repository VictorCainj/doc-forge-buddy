import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Expansível (fixed) */}
      <Sidebar />

      {/* Main Content Area - Com margem para o sidebar e header mobile */}
      <main
        role="main"
        aria-label="Conteúdo principal"
        className="min-h-screen w-full overflow-y-auto pt-16 md:pt-0 md:pl-[60px] transition-all duration-300 custom-scrollbar smooth-scroll"
        style={{
          contentVisibility: 'auto',
          contain: 'layout paint style',
          containIntrinsicSize: '1200px 800px',
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
