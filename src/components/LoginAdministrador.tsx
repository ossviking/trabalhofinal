import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Package } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { passwordResetRequestsService } from '../services/database';

const LoginAdministrador = () => {
  const navigate = useNavigate();
  const { signIn, signOut, user, loading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      console.log('Admin already logged in, redirecting to dashboard');
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting admin login with:', formData.email);
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        console.error('Supabase auth error:', error);
        let errorMessage = 'Erro no login: ';

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado.';
        } else {
          errorMessage += error.message;
        }

        alert(errorMessage);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      alert('Por favor, digite seu email.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await passwordResetRequestsService.createRequest(
        forgotPasswordEmail,
        'Administrador'
      );

      alert('Solicitação de redefinição de senha enviada! Outro administrador processará sua solicitação.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmittingRequest(false);
    }
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
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Esqueceu a senha?
                </button>
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

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Esqueceu a Senha?</h2>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Digite seu email administrativo abaixo. Outro administrador receberá sua solicitação e poderá redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Administrativo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@universidade.edu.br"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingRequest ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginAdministrador;