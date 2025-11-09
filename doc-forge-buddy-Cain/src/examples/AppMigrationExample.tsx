/**
 * Exemplo de migração gradual do App.tsx
 * Mostra como integrar o novo sistema de state management
 */

import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast-notification';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ✅ NOVO: Usar o sistema unificado de providers
import { AppProviders } from '@/providers';

// ✅ NOVO: Usar hooks do novo sistema
import { useGlobalState, useAppInitialization, useUserPreferences } from '@/hooks/useAppStore';

// Importações legadas (para migração gradual)
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Layout from '@/components/layout';
import PageLoader from '@/components/common/PageLoader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PageTransition from '@/components/common/PageTransition';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { prefetchRouteModules, getPrefetchMetrics } from '@/utils/prefetchRoutes';
import { setNotificationQueryClient } from '@/features/notifications/utils/notificationAutoCreator';
import { useBehaviorBasedLoading, preloadCriticalLibs } from '@/hooks/useSmartImport';

// Lazy load de páginas para code splitting
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Contratos = lazy(() => import('./pages/Contratos'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
// ... outras páginas

// ✅ NOVO: Configuração do QueryClient agora está no AppProviders
// Removido de cá para evitar duplicação

// Componentes de renderização (mantidos como estavam)
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

// ✅ NOVO: Componente que usa o novo sistema de estado
const AppContent = () => {
  const location = useLocation();
  
  // ✅ NOVO: Usar hooks do novo sistema
  const { app, auth, theme } = useGlobalState();
  const { initialize } = useAppInitialization();
  const { savePreference } = useUserPreferences();

  // ✅ NOVO: Comportamento baseado no estado global
  const { trackPageView, trackScrollDepth } = useBehaviorBasedLoading({
    enableBehaviorTracking: true,
    enablePredictiveLoading: true,
    trackUserPreferences: true,
    preloadThreshold: 0.3,
  });

  // ✅ NOVO: Inicialização da aplicação
  useEffect(() => {
    // Inicializar sistema de prefetch inteligente
    prefetchRouteModules();
    
    // Pré-carregar bibliotecas críticas
    preloadCriticalLibs();
    
    // Tracking de métricas de performance
    const metrics = getPrefetchMetrics();
    if (import.meta.env.DEV) {
      console.log('🚀 Prefetch Metrics:', metrics);
    }
    
    // ✅ NOVO: Inicializar preferências e configurações
    initialize();
  }, [initialize]);

  // ✅ NOVO: Salvar preferências do usuário automaticamente
  useEffect(() => {
    if (auth.user) {
      savePreference('theme', theme.mode);
      // Adicionar mais preferências conforme necessário
    }
  }, [auth.user, theme.mode, savePreference]);

  // Tracking de tempo de página (mantido como estava)
  useEffect(() => {
    const startTime = Date.now();
    const pagePath = window.location.pathname;

    const handlePageUnload = () => {
      const duration = Date.now() - startTime;
      trackPageView(pagePath, duration);
    };

    const handleScroll = () => {
      const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      trackScrollDepth(pagePath, scrollDepth);
    };

    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('scroll', handleScroll);
      handlePageUnload();
    };
  }, [trackPageView, trackScrollDepth]);

  // ✅ NOVO: Aplicar tema globalmente
  useEffect(() => {
    // Aplicar classe dark baseada no tema atual
    document.documentElement.classList.toggle('dark', theme.isDark);
  }, [theme.isDark]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Rotas públicas */}
        <Route path="/login" element={renderPublicAuth(<Login />)} />
        <Route path="/forgot-password" element={renderPublicAuth(<ForgotPassword />)} />
        {/* ... outras rotas */}
        
        {/* Rotas protegidas */}
        <Route path="/" element={renderProtected(<Index />)} />
        <Route path="/contratos" element={renderProtected(<Contratos />)} />
        {/* ... outras rotas protegidas */}
        
        {/* Rota 404 */}
        <Route path="*" element={renderPublic(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
};

// ✅ NOVO: App principal com sistema unificado
const App = () => {
  return (
    <AppProviders>
      <ToastProvider>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <AppContent />
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
      
      {/* Performance Monitor - apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <PerformanceMonitor 
          isDevelopment={true}
          position="top-right"
          size="compact"
        />
      )}
    </AppProviders>
  );
};

export default App;

/**
 * MIGRATION NOTES:
 * 
 * ✅ Antes: QueryClient configurado manualmente
 * ❌ Depois: QueryClient está no AppProviders
 * 
 * ✅ Antes: AuthProvider separado
 * ❌ Depois: Auth integrado no AppStoreProvider
 * 
 * ✅ Antes: Estado disperso em múltiplos contexts
 * ❌ Depois: Estado centralizado no AppStore
 * 
 * ✅ Antes: Tema gerenciado separadamente
 * ❌ Depois: Tema integrado no AppStore
 * 
 * ✅ Antes: Lógica de inicialização inline
 * ❌ Depois: Hooks customizados para inicialização
 * 
 * BENEFÍCIOS:
 * - Menos boilerplate
 * - Estado mais previsível
 * - Type safety melhorado
 * - Performance otimizada
 * - Migração gradual possível
 */