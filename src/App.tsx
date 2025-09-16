import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Index from './pages/Index';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import EditTerm from './pages/EditTerm';
import Contratos from './pages/Contratos';
import CadastrarContrato from './pages/CadastrarContrato';
import ProcessoDesocupacao from './pages/ProcessoDesocupacao';
import GerarDocumento from './pages/GerarDocumento';
import TermoLocador from './pages/TermoLocador';
import TermoLocatario from './pages/TermoLocatario';
import Configuracoes from './pages/Configuracoes';
import MultaRescisoria from './pages/MultaRescisoria';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
              path="/processo/:contratoId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProcessoDesocupacao />
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
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Configuracoes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/multa-rescisoria"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MultaRescisoria />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
