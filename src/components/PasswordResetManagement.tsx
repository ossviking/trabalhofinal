import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, Key, User, Mail, Calendar, Save, X, Eye, EyeOff } from 'lucide-react';
import { passwordResetRequestsService } from '../services/database';
import { useUser } from '../context/UserContext';

interface PasswordResetRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  status: 'pending' | 'completed' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
}

const PasswordResetManagement = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Ensure only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para visualizar esta página.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await passwordResetRequestsService.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading password reset requests:', error);
      alert('Erro ao carregar solicitações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = (request: PasswordResetRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setNotes('');
    
    if (action === 'approve') {
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(true);
    } else {
      processRequest('rejected');
    }
  };

  const processRequest = async (status: 'completed' | 'rejected') => {
    if (!selectedRequest || !user) return;

    if (status === 'completed') {
      if (!newPassword || newPassword !== confirmPassword) {
        alert('As senhas não coincidem ou estão vazias.');
        return;
      }
      if (newPassword.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (status === 'completed') {
        // Reset the user's password
        await passwordResetRequestsService.resetUserPassword(selectedRequest.user_id, newPassword);
      }

      // Update request status
      await passwordResetRequestsService.updateRequestStatus(
        selectedRequest.id,
        status,
        user.id,
        notes || (status === 'completed' ? 'Senha redefinida com sucesso' : 'Solicitação rejeitada')
      );

      alert(status === 'completed' ? 'Senha redefinida com sucesso!' : 'Solicitação rejeitada.');
      
      // Reload requests
      await loadRequests();
      
      // Close modal
      setShowPasswordModal(false);
      setSelectedRequest(null);
      setNewPassword('');
      setConfirmPassword('');
      setNotes('');
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'completed': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Redefinição de Senhas</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Gerencie solicitações de redefinição de senha dos usuários</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-xl">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 sm:p-3 rounded-xl">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Rejeitadas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Solicitações de Redefinição</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {requests.length > 0 ? (
            requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <div key={request.id} className="p-4 sm:p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <div className="bg-gray-100 p-2 sm:p-3 rounded-xl">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.user_name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status === 'pending' ? 'Pendente' : 
                             request.status === 'completed' ? 'Concluída' : 'Rejeitada'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{request.user_email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Solicitado em {new Date(request.requested_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {request.processed_at && (
                          <div className="mt-2 text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Processado em:</span> {new Date(request.processed_at).toLocaleString()}
                          </div>
                        )}

                        {request.notes && (
                          <div className="mt-2 text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Observações:</span> {request.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                        <button
                          onClick={() => handleProcessRequest(request, 'approve')}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 text-sm"
                        >
                          <Key className="h-4 w-4" />
                          <span className="hidden sm:inline">Redefinir Senha</span>
                          <span className="sm:hidden">Aprovar</span>
                        </button>
                        <button
                          onClick={() => handleProcessRequest(request, 'reject')}
                          className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Rejeitar</span>
                          <span className="sm:hidden">Rejeitar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma solicitação de redefinição de senha</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Redefinir Senha</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Usuário:</strong> {selectedRequest.user_name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Email:</strong> {selectedRequest.user_email}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a nova senha"
                      minLength={6}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirme a nova senha"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observações sobre a redefinição (opcional)"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => processRequest('completed')}
                    disabled={isProcessing || !newPassword || newPassword !== confirmPassword}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isProcessing ? 'Processando...' : 'Redefinir Senha'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetManagement;