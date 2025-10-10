import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, FileText, User, Calendar } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';

const ApprovalWorkflow = () => {
  const { reservations, resources, updateReservationStatus } = useReservation();
  const { user } = useUser();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || reservation.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleApproval = (reservationId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      updateReservationStatus(reservationId, status, comments);
      setSelectedRequest(null);
    } catch (error) {
      alert('Erro ao atualizar status da reserva. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const statusOptions = [
    { id: 'all', name: 'Todas as Solicitações' },
    { id: 'pending', name: 'Pendente' },
    { id: 'approved', name: 'Aprovado' },
    { id: 'rejected', name: 'Rejeitado' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fluxo de Aprovação</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Revise e aprove solicitações de reserva de recursos</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitações..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredReservations.map((reservation) => {
          const resource = resources.find(r => r.id === reservation.resourceId);
          const isExpanded = selectedRequest === reservation.id;
          
          return (
            <div key={reservation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{reservation.purpose}</h3>
                      <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(reservation.priority)}`}>
                        {reservation.priority} priority
                      </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="truncate" title={resource?.name}>{resource?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(reservation.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(reservation.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          até {new Date(reservation.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">ID:</span> {reservation.id.substring(0, 8)}...
                      {reservation.attendees && (
                        <span className="ml-3"><span className="font-medium">Participantes:</span> {reservation.attendees}</span>
                      )}
                      <span className="ml-3"><span className="font-medium">Criada em:</span> {new Date(reservation.createdAt).toLocaleDateString('pt-BR')} {new Date(reservation.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproval(reservation.id, 'approved')}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                         <span className="hidden sm:inline">Aprovar</span>
                         <span className="sm:hidden">OK</span>
                        </button>
                        <button
                          onClick={() => handleApproval(reservation.id, 'rejected')}
                          className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                         <span className="hidden sm:inline">Rejeitar</span>
                         <span className="sm:hidden">X</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedRequest(isExpanded ? null : reservation.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm px-2 py-1"
                    >
                     <span className="hidden sm:inline">{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                     <span className="sm:hidden">{isExpanded ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Detalhes da Solicitação</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <p><span className="font-medium">Finalidade:</span> {reservation.purpose}</p>
                          <p><span className="font-medium">Descrição:</span> {reservation.description || 'Nenhum detalhe adicional'}</p>
                          <p><span className="font-medium">Início:</span> {new Date(reservation.startDate).toLocaleString()}</p>
                          <p><span className="font-medium">Fim:</span> {new Date(reservation.endDate).toLocaleString()}</p>
                          {reservation.attendees && (
                            <p><span className="font-medium">Participantes:</span> {reservation.attendees}</p>
                          )}
                          {reservation.requirements && (
                            <p><span className="font-medium">Requisitos:</span> {reservation.requirements}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Informações do Recurso</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <p><span className="font-medium">Recurso:</span> {resource?.name}</p>
                          <p><span className="font-medium">Categoria:</span> {resource?.category}</p>
                          <p><span className="font-medium">Localização:</span> {resource?.location}</p>
                          <p><span className="font-medium">Status:</span> {resource?.status}</p>
                        </div>

                        {reservation.status === 'pending' && (
                          <div className="mt-4">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Adicionar Comentários</h4>
                            <textarea
                              placeholder="Adicionar comentários de aprovação/rejeição..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-600">Nenhuma solicitação de reserva corresponde aos seus filtros atuais</p>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;