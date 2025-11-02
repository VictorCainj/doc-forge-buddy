import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast-notification';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Layout from '@/components/Layout';
import PageLoader from '@/components/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageTransition from '@/components/PageTransition';
import { prefetchRouteModules } from '@/utils/prefetchRoutes';

// Lazy load de páginas para code splitting
// Páginas críticas (carregadas primeiro)
const Index = lazy(() => import('./pages/Index')); // Aponta para Contratos
const Login = lazy(() => import('./pages/Login'));
const Contratos = lazy(() => import('./pages/Contratos'));

// Páginas secundárias
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const EditTerm = lazy(() => import('./pages/EditTerm'));
const EditarContrato = lazy(() => import('./pages/EditarContrato'));
const CadastrarContrato = lazy(() => import('./pages/CadastrarContrato'));
const ProcessoRescisao = lazy(() => import('./pages/ProcessoRescisao'));
const GerarDocumento = lazy(() => import('./pages/GerarDocumento'));
const TermoLocador = lazy(() => import('./pages/TermoLocador'));
const TermoLocatario = lazy(() => import('./pages/TermoLocatario'));
const TermoRecusaAssinaturaEmail = lazy(
  () => import('./pages/TermoRecusaAssinaturaEmail')
);

const AnaliseVistoria = lazy(() => import('./pages/AnaliseVistoria'));
const Prestadores = lazy(() => import('./pages/Prestadores'));
const DocumentoPublico = lazy(() => import('./pages/DocumentoPublico'));
const Admin = lazy(() => import('./pages/Admin'));
const Tarefas = lazy(() => import('./pages/Tarefas'));

const DashboardDesocupacao = lazy(() => import('./pages/DashboardDesocupacao'));

/**
 * Configuração otimizada do React Query para performance instantânea
 * - staleTime: 2 min (mais agressivo para dados frescos)
 * - gcTime: 5 min (garbage collection mais rápido)
 * - Retry inteligente baseado no tipo de erro
 * - keepPreviousData: true para transições suaves
 * - Configurações podem ser sobrescritas por query específica
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos (dados ficam "frescos")
      gcTime: 5 * 60 * 1000, // 5 minutos (tempo em cache)
      refetchOnWindowFocus: true, // Refetch ao focar janela (útil para dados que mudam)
      refetchOnMount: false, // Não refetch se dados ainda estão frescos
      keepPreviousData: true, // Mantém dados anteriores durante refetch para transições suaves
      retry: (failureCount, error: any) => {
        // Retry inteligente baseado no erro
        if (error?.status === 404) return false; // Não retry para 404
        if (error?.status === 401) return false; // Não retry para 401 (auth)
        return failureCount < 2; // Máximo 2 tentativas
      },
    },
    mutations: {
      // Otimistic updates padrão habilitados
      onMutate: async (variables) => {
        // Permite que mutations individuais implementem optimistic updates
        return variables;
      },
    },
  },
});

const renderPublic = (element: JSX.Element) => (
  <PageTransition>{element}</PageTransition>
);

const renderPublicAuth = (element: JSX.Element) => (
  <PageTransition>
    <ProtectedRoute requireAuth={false}>{element}</ProtectedRoute>
  </PageTransition>
);

const renderProtected = (element: JSX.Element) => (
  <PageTransition>
    <ProtectedRoute>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  </PageTransition>
);

const renderAdmin = (element: JSX.Element) => (
  <PageTransition>
    <ProtectedRoute>
      <AdminRoute>
        <Layout>{element}</Layout>
      </AdminRoute>
    </ProtectedRoute>
  </PageTransition>
);

const AnimatedAppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Rotas públicas */}
        <Route path="/login" element={renderPublicAuth(<Login />)} />
        <Route
          path="/forgot-password"
          element={renderPublicAuth(<ForgotPassword />)}
        />
        <Route
          path="/documento-publico/:id"
          element={renderPublic(<DocumentoPublico />)}
        />

        {/* Rotas protegidas */}
        <Route path="/" element={renderProtected(<Index />)} />
        <Route path="/contratos" element={renderProtected(<Contratos />)} />
        <Route
          path="/cadastrar-contrato"
          element={renderProtected(<CadastrarContrato />)}
        />
        <Route
          path="/editar-contrato/:id"
          element={renderProtected(<EditarContrato />)}
        />
        <Route
          path="/gerar-documento"
          element={renderProtected(<GerarDocumento />)}
        />
        <Route
          path="/termo-locador"
          element={renderProtected(<TermoLocador />)}
        />
        <Route
          path="/termo-locatario"
          element={renderProtected(<TermoLocatario />)}
        />
        <Route
          path="/termo-recusa-assinatura-email"
          element={renderProtected(<TermoRecusaAssinaturaEmail />)}
        />
        <Route
          path="/processo/:contratoId"
          element={renderProtected(<ProcessoRescisao />)}
        />
        <Route
          path="/processo/:contratoId/termo-chaves"
          element={renderProtected(<TermoLocatario />)}
        />
        <Route
          path="/editar-termo/:id"
          element={renderProtected(<EditTerm />)}
        />
        <Route
          path="/analise-vistoria"
          element={renderProtected(<AnaliseVistoria />)}
        />
        <Route path="/prestadores" element={renderProtected(<Prestadores />)} />
        <Route path="/tarefas" element={renderProtected(<Tarefas />)} />
        <Route
          path="/dashboard-desocupacao"
          element={renderProtected(<DashboardDesocupacao />)}
        />
        <Route path="/admin" element={renderAdmin(<Admin />)} />

        {/* Rota 404 */}
        <Route path="*" element={renderPublic(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  useEffect(() => {
    prefetchRouteModules();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AnimatedAppRoutes />
                </Suspense>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
