import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from './common/PageLoader';
import { AlertCircle } from '@/utils/iconMapper';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [forceLoad, setForceLoad] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Aguardar carregamento do perfil antes de verificar admin
  useEffect(() => {
    if (!loading && user) {
      // Se temos usuário mas não temos perfil ainda, aguardar um pouco mais
      if (!profile && user) {
        const timeoutId = setTimeout(() => {
          setProfileLoading(false);
        }, 2000); // Aguardar 2 segundos para perfil carregar
        return () => clearTimeout(timeoutId);
      } else {
        setProfileLoading(false);
      }
    } else if (!loading && !user) {
      setProfileLoading(false);
    }
  }, [loading, user, profile]);

  // Timeout de segurança para evitar loop infinito de loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading || profileLoading) {
        console.warn('Timeout de verificação de admin - forçando renderização');
        setForceLoad(true);
        setProfileLoading(false);
      }
    }, 6000); // 6 segundos de timeout (aumentado para aguardar perfil)

    return () => clearTimeout(timeoutId);
  }, [loading, profileLoading]);

  // Mostrar loader enquanto carrega autenticação ou perfil
  if ((loading || profileLoading) && !forceLoad) {
    return <PageLoader />;
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Aguardar perfil ser carregado antes de verificar admin
  // Se ainda está carregando o perfil, mostrar loader
  if (user && !profile && !forceLoad) {
    return <PageLoader />;
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
