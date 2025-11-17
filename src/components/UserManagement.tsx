import React, { useState } from 'react';
import { Search, Plus, CreditCard as Edit, Trash2, Shield, User, Mail, Calendar, X, Save } from 'lucide-react';
import { usersService } from '../services/database';
import { supabase } from '../lib/supabase';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'faculty' | 'admin',
    department: ''
  });

  // Load users from database
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('UserManagement: Starting to load users...');
        console.log('UserManagement: Supabase client initialized:', !!supabase);

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('UserManagement: Session error:', sessionError);
          throw new Error(`Erro de autenticação: ${sessionError.message}`);
        }

        if (!session) {
          console.error('UserManagement: No active session found');
          throw new Error('Você precisa estar autenticado para ver os usuários');
        }

        console.log('UserManagement: User authenticated, loading users from database...');

        const usersData = await usersService.getAll();
        console.log('UserManagement: Users loaded successfully:', usersData);

        if (!usersData || usersData.length === 0) {
          console.warn('UserManagement: No users found in database');
          setUsers([]);
          return;
        }

        // Transform database users to match component expectations
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          joinDate: user.created_at.split('T')[0],
          lastLogin: user.updated_at.split('T')[0],
          status: 'active',
          reservations: 0
        }));

        console.log('UserManagement: Users transformed:', transformedUsers);
        setUsers(transformedUsers);
      } catch (error: any) {
        console.error('UserManagement: Error loading users - Full error:', error);
        console.error('UserManagement: Error message:', error?.message);
        console.error('UserManagement: Error details:', error?.details);
        console.error('UserManagement: Error hint:', error?.hint);
        console.error('UserManagement: Error code:', error?.code);
        console.error('UserManagement: Error stack:', error?.stack);

        const errorMessage = error?.message || 'Erro desconhecido ao carregar usuários';
        const detailedError = `${errorMessage}\n\nDetalhes técnicos:\n- Código: ${error?.code || 'N/A'}\n- Dica: ${error?.hint || 'N/A'}\n\nVerifique o console para mais informações.`;

        setErrorInfo(detailedError);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email.toLowerCase(),
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
            role: newUserData.role,
            department: newUserData.department
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Erro ao criar conta: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      const newUser = await usersService.createProfile({
        id: authData.user.id,
        name: newUserData.name,
        role: newUserData.role,
        department: newUserData.department,
        email: newUserData.email.toLowerCase()
      });
      
      // Add to local state
      const transformedUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        joinDate: newUser.created_at.split('T')[0],
        lastLogin: newUser.updated_at.split('T')[0],
        status: 'active',
        reservations: 0
      };
      
      setUsers(prev => [...prev, transformedUser]);
      
      // Reset form
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: ''
      });
      setShowAddUser(false);
      alert('Usuário adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Erro ao adicionar usuário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { id: 'all', name: 'Todos os Papéis' },
    { id: 'student', name: 'Estudantes' },
    { id: 'faculty', name: 'Professores' },
    { id: 'admin', name: 'Administradores' }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'faculty': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'faculty': return User;
      case 'student': return User;
      default: return User;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Gerencie usuários do sistema e suas permissões</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Usuário</span>
            <span className="sm:hidden">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Estudantes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'student').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-xl">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Professores</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'faculty').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 sm:p-3 rounded-xl">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {errorInfo && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Erro ao Carregar Usuários</h3>
              <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{errorInfo}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && !errorInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Papel
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Departamento
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Reservas
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Último Login
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center sm:hidden">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)} mr-2`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center hidden sm:flex">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-xs">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center">
                        <RoleIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                      {user.department}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                      {user.reservations}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && users.length === 0 && (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 mb-4">Não há usuários cadastrados no sistema ainda.</p>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Adicionar Primeiro Usuário
          </button>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && users.length > 0 && (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
          <p className="text-gray-600">Tente ajustar seus critérios de busca</p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Usuário</h2>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Institucional *
                  </label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="usuario@universidade.edu.br"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Temporária *
                  </label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Senha inicial para o usuário"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O usuário poderá alterar esta senha após o primeiro login
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papel *
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="student">Estudante</option>
                    <option value="faculty">Professor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento *
                  </label>
                  <input
                    type="text"
                    value={newUserData.department}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Engenharia de Software"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Salvando...' : 'Adicionar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;