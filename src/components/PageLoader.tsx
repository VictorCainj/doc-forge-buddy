import React from 'react';

/**
 * Componente de loading para lazy loading de páginas
 */
export const PageLoader: React.FC = () => {
  return (
    <main role="main" aria-label="Carregando página">
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <h1 className="sr-only">Carregando</h1>
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando...
          </p>
        </div>
      </div>
    </main>
  );
};

export default PageLoader;
