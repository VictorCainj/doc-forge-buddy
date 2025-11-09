import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from '@/utils/iconMapper';

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
  // Para rotas públicas (login), reduzir o timeout
  useEffect(() => {
    const timeoutDuration = requireAuth ? 4000 : 1000; // 1 segundo para rotas públicas
    const timeoutId = setTimeout(() => {
      if (loading) {
        // Timeout de segurança para evitar loop infinito de loading
        setForceLoad(true);
      }
    }, timeoutDuration);

    return () => clearTimeout(timeoutId);
  }, [loading, requireAuth]);

  // Para rotas públicas (como login), não bloquear com loading
  if (!requireAuth && loading && !forceLoad) {
    // Renderizar children mesmo durante loading para evitar bloqueio
    return <>{children}</>;
  }

  // Mostrar loading enquanto verifica autenticação (apenas para rotas protegidas)
  if (loading && !forceLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center space-y-4 pointer-events-auto">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-neutral-600">Verificando autenticação...</p>
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
