import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirecionar para contratos quando autenticado
    if (user) {
      navigate('/contratos');
    }
  }, [user, navigate]);

  // Mostrar loading enquanto verifica autenticação
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-200">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
