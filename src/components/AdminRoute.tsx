import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from './PageLoader';
import { AlertCircle } from '@/utils/iconMapper';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [forceLoad, setForceLoad] = useState(false);

  // Timeout de segurança para evitar loop infinito de loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificação de admin - forçando renderização');
        setForceLoad(true);
      }
    }, 4000); // 4 segundos de timeout (otimizado)

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Mostrar loader enquanto carrega
  if (loading && !forceLoad) {
    return <PageLoader />;
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se não for admin, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Acesso Negado
          </h1>
          <p className="text-neutral-600 mb-6">
            Você não tem permissão para acessar esta página. Apenas
            administradores podem visualizar esta área.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/contratos')} variant="outline">
              Voltar ao Início
            </Button>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  // Se for admin, renderizar o conteúdo
  return <>{children}</>;
};

export default AdminRoute;
