import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Package } from 'lucide-react';
import { useUser } from '../context/UserContext';

const LoginAdministrador = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Limpar sessão existente quando componente carrega
  useEffect(() => {
    const clearExistingSession = async () => {
      if (user) {
        console.log('Limpando sessão existente para forçar novo login de admin');
        await signOut();
      }
    };
    clearExistingSession();
  }, []);

  // Navigate to dashboard when user is successfully logged in and profile is loaded
  useEffect(() => {
    if (!loading && user) {
      console.log('Admin user logged in successfully, navigating to dashboard');
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Tentando fazer login como admin com:', formData.email);
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        alert('Erro no login: ' + error.message);
        setIsLoading(false);
      } else {
        console.log('Login de admin bem-sucedido!');
        // Navigation will be handled by useEffect when user state is updated
      }
    } catch (error) {
      console.error('Erro geral no handleSubmit:', error);
      alert('Erro no login. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/login')}
              className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Login do Administrador</h1>
            <p className="text-gray-600">Acesso ao painel administrativo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Administrativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@universidade.edu.br"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Administrativa
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Acesso Seguro</h3>
                <p className="text-xs text-amber-700 mt-1">
                  Este é um ambiente administrativo. Todas as ações são registradas e monitoradas.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Credenciais de Demonstração:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Email:</strong> miguel.oliveira@universidade.edu.br</p>
              <p><strong>Senha:</strong> 123</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">CentroRecursos Admin</span>
            </div>
            <p className="text-xs text-gray-400">
              Painel Administrativo - Versão 1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdministrador;