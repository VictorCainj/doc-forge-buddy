import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast-notification';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import PageLoader from '@/components/PageLoader';

// Lazy load de páginas para code splitting
// Páginas críticas (carregadas primeiro)
const Index = lazy(() => import('./pages/Index'));
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
const TermoRecusaAssinaturaEmail = lazy(() => import('./pages/TermoRecusaAssinaturaEmail'));
const Chat = lazy(() => import('./pages/Chat'));
const AnaliseVistoria = lazy(() => import('./pages/AnaliseVistoria'));
const VistoriaAnalises = lazy(() => import('./pages/VistoriaAnalises'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TooltipProvider delayDuration={0}>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Rotas públicas */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPassword />
                </ProtectedRoute>
              }
            />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Index />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contratos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Contratos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cadastrar-contrato"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CadastrarContrato />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar-contrato/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditarContrato />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gerar-documento"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GerarDocumento />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/termo-locador"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TermoLocador />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/termo-locatario"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TermoLocatario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/termo-recusa-assinatura-email"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TermoRecusaAssinaturaEmail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/processo/:contratoId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProcessoRescisao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/processo/:contratoId/termo-chaves"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TermoLocatario />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/editar-termo/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditTerm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Chat />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analise-vistoria"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnaliseVistoria />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vistoria-analises"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VistoriaAnalises />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;
