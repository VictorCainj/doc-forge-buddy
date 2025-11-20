import { lazy, Suspense, useEffect } from 'react';
import PageLoader from '@/components/common/PageLoader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLocation } from 'react-router-dom';

// Lazy load da feature completa de Vistoria
// Isso remove todo o código da vistoria do bundle principal
const AnaliseVistoriaRefatorado = lazy(() =>
  import('@/features/analise-vistoria').then(module => ({
    default: module.AnaliseVistoriaRefatorado,
  }))
);

/**
 * Página de Análise de Vistoria
 * Atua como um wrapper otimizado com:
 * 1. Code Splitting (Lazy Loading)
 * 2. Tratamento de Erros (Error Boundary)
 * 3. Feedback de Carregamento (Suspense)
 * 4. Gestão de Título da Página
 */
const AnaliseVistoria: React.FC = () => {
  const location = useLocation();

  // Atualiza o título da página para melhor UX
  useEffect(() => {
    document.title = 'Análise de Vistoria | Doc Forge Buddy';

    // Cleanup opcional ao desmontar
    return () => {
      document.title = 'Doc Forge Buddy';
    };
  }, []);

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className='min-h-screen flex flex-col items-center justify-center bg-neutral-50'>
            <PageLoader />
            <p className='mt-4 text-sm text-neutral-500 animate-pulse'>
              Carregando módulo de análise...
            </p>
          </div>
        }
      >
        <AnaliseVistoriaRefatorado />
      </Suspense>
    </ErrorBoundary>
  );
};

export default AnaliseVistoria;
