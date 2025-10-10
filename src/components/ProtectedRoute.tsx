import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [forceLoad, setForceLoad] = useState(false);

  // Timeout de segurança para evitar loop infinito de loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificação de autenticação - forçando renderização');
        setForceLoad(true);
      }
    }, 8000); // 8 segundos de timeout

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Mostrar loading enquanto verifica autenticação
  if (loading && !forceLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se a rota requer autenticação e o usuário não está logado
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a rota é para usuários não autenticados (como login) e o usuário está logado
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
