import React, { memo, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import OptimizedSidebar from './OptimizedSidebar';

interface OptimizedLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  backgroundColor?: string;
  padding?: string;
}

// Componente interno para memoização
const LayoutContainer = memo<{
  children: ReactNode;
  className?: string;
  maxWidth: string;
  backgroundColor: string;
  padding: string;
}>(({ children, className, maxWidth, backgroundColor, padding }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Otimizado com memoization */}
      <OptimizedSidebar />

      {/* Main Content Area - CSS Optimizations */}
      <main
        role="main"
        aria-label="Conteúdo principal"
        className={`
          min-h-screen w-full overflow-y-auto pt-16 md:pt-0 md:pl-[60px] 
          transition-all duration-300 custom-scrollbar smooth-scroll
          ${className || ''}
        `}
        style={{
          // Content Visibility API - mejora performance significantemente
          contentVisibility: 'auto',
          
          // CSS Containment - previne reflows desnecessários
          contain: 'layout paint style',
          
          // Intrinsic size para prevenir layout shifts
          containIntrinsicSize: '1200px 800px',
          
          // Prevenir layout thrashing
          willChange: 'scroll-position',
          
          // GPU acceleration
          transform: 'translateZ(0)',
          
          // Width constraints
          maxWidth,
          
          // Background color
          backgroundColor,
          
          // Padding
          padding,
        }}
      >
        <div
          style={{
            // Container com max-width para conteúdo
            maxWidth: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
});

LayoutContainer.displayName = 'LayoutContainer';

// Layout principal otimizado
const OptimizedLayout = memo<OptimizedLayoutProps>(
  ({
    children,
    className,
    maxWidth = '1920px',
    backgroundColor = '#ffffff',
    padding = '1rem',
  }) => {
    // Memoização de configurações de layout
    const layoutConfig = useMemo(() => ({
      maxWidth,
      backgroundColor,
      padding,
      gridTemplateColumns: '60px 1fr', // Sidebar + Content
      gridTemplateRows: 'auto 1fr',
    }), [maxWidth, backgroundColor, padding]);

    // Memoização de estilo base
    const baseStyle = useMemo(() => ({
      minHeight: '100vh',
      backgroundColor: layoutConfig.backgroundColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
    }), [layoutConfig.backgroundColor]);

    // Callback para otimizar cliques
    const handleMainClick = useCallback((e: React.MouseEvent) => {
      // Prevent event propagation se necessário
      e.stopPropagation();
    }, []);

    // Memoização de classes CSS
    const layoutClasses = useMemo(() => {
      return [
        'optimized-layout',
        className,
      ].filter(Boolean).join(' ');
    }, [className]);

    return (
      <div 
        className={layoutClasses}
        style={baseStyle}
        onClick={handleMainClick}
      >
        <LayoutContainer
          children={children}
          className={className}
          maxWidth={layoutConfig.maxWidth}
          backgroundColor={layoutConfig.backgroundColor}
          padding={layoutConfig.padding}
        />
      </div>
    );
  }
);

OptimizedLayout.displayName = 'OptimizedLayout';

// Layout especial para páginas de autenticação (sem sidebar)
const AuthLayout = memo<OptimizedLayoutProps>(({ 
  children,
  className,
  maxWidth = '400px',
}) => {
  const authStyle = useMemo(() => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
  }), []);

  const containerStyle = useMemo(() => ({
    width: '100%',
    maxWidth,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  }), [maxWidth]);

  return (
    <div style={authStyle}>
      <div style={containerStyle} className={className}>
        {children}
      </div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

// Layout para dashboards (com sidebar expandida)
const DashboardLayout = memo<OptimizedLayoutProps>(({ 
  children,
  className,
  maxWidth = '1400px',
}) => {
  return (
    <OptimizedLayout
      children={children}
      className={[
        'dashboard-layout',
        'bg-gray-50',
        className,
      ].filter(Boolean).join(' ')}
      maxWidth={maxWidth}
      backgroundColor="#f9fafb"
      padding="1.5rem"
    />
  );
});

DashboardLayout.displayName = 'DashboardLayout';

// Layout para formulários (max-width maior)
const FormLayout = memo<OptimizedLayoutProps>(({ 
  children,
  className,
  maxWidth = '800px',
}) => {
  return (
    <OptimizedLayout
      children={children}
      className={[
        'form-layout',
        'bg-gray-50',
        className,
      ].filter(Boolean).join(' ')}
      maxWidth={maxWidth}
      backgroundColor="#f9fafb"
      padding="2rem"
    />
  );
});

FormLayout.displayName = 'FormLayout';

// HOC para aplicar layout automaticamente
function withLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutType: 'default' | 'auth' | 'dashboard' | 'form' = 'default'
) {
  const WithLayoutComponent = memo((props: P) => {
    let Layout: React.ComponentType<any> = OptimizedLayout;
    
    switch (layoutType) {
      case 'auth':
        Layout = AuthLayout;
        break;
      case 'dashboard':
        Layout = DashboardLayout;
        break;
      case 'form':
        Layout = FormLayout;
        break;
      default:
        Layout = OptimizedLayout;
    }

    return (
      <Layout>
        <Component {...props} />
      </Layout>
    );
  });

  WithLayoutComponent.displayName = `WithLayout(${Component.displayName || Component.name})`;
  
  return WithLayoutComponent;
}

// Hook para detectar tipo de layout baseado na rota
function useLayoutType(): 'default' | 'auth' | 'dashboard' | 'form' {
  // Implemente lógica para detectar tipo baseado na rota
  // Por exemplo, se rota começa com /auth -> 'auth'
  // Se rota contém /dashboard -> 'dashboard'
  // Se rota contém /form -> 'form'
  
  // Placeholder - implemente baseado no router
  return 'default';
}

// Hook para configurações de performance
function usePerformanceConfig() {
  return useMemo(() => ({
    enableContentVisibility: true,
    enableCSSContainment: true,
    enableGPUAcceleration: true,
    enableWillChange: true,
    enablePreload: true,
  }), []);
}

// Export do Layout principal
export { 
  OptimizedLayout, 
  AuthLayout, 
  DashboardLayout, 
  FormLayout, 
  withLayout,
  useLayoutType,
  usePerformanceConfig,
};

export default OptimizedLayout;