import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Package } from 'lucide-react';
import { useUser } from '../context/UserContext';

const LoginSelection = () => {
  const navigate = useNavigate();
  const { signOut, user } = useUser();

  // Limpar sessão existente quando usuário acessa página de seleção de login
  React.useEffect(() => {
    const clearExistingSession = async () => {
      if (user) {
        console.log('Limpando sessão existente na seleção de login');
        await signOut();
      }
    };
    clearExistingSession();
  }, [user, signOut]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">CentroRecursos</h1>
          </div>
          <p className="text-xl text-gray-600">Sistema Abrangente de Reserva e Empréstimo de Recursos</p>
          <p className="text-lg text-gray-500 mt-2">Selecione seu tipo de acesso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Login do Solicitante */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitante</h2>
              <p className="text-gray-600 mb-8">
                Acesso para estudantes e professores que desejam reservar recursos como salas, equipamentos e materiais audiovisuais.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Visualizar catálogo de recursos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Fazer solicitações de reserva
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Acompanhar status das reservas
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Receber notificações
                </li>
              </ul>
              <button
                onClick={() => navigate('/login/solicitante')}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
              >
                Acessar como Solicitante
              </button>
            </div>
          </div>

          {/* Login do Administrador */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Administrador</h2>
              <p className="text-gray-600 mb-8">
                Acesso para administradores do sistema com permissões para gerenciar recursos, usuários e configurações.
              </p>
              <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Gerenciar recursos e usuários
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Aprovar/rejeitar solicitações
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Agendar manutenções
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Visualizar relatórios e métricas
                </li>
              </ul>
              <button
                onClick={() => navigate('/login/administrador')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
              >
                Acessar como Administrador
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Precisa de ajuda? Entre em contato com o suporte técnico
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;