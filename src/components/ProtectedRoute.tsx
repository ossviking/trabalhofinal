import React from 'react';
import { Navigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'faculty' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useUser();

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">CentroRecursos</h2>
          <p className="text-gray-600">Carregando...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se há um papel específico requerido e o usuário não tem esse papel
  if (requiredRole && user.role !== requiredRole) {
    // Redireciona para uma página de acesso negado ou dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;