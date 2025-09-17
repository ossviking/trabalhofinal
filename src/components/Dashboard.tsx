import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, AlertTriangle, Package, Users, TrendingUp } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';

const Dashboard = () => {
  const { reservations, resources, loading } = useReservation();
  const { user } = useUser();
  const navigate = useNavigate();

  const userReservations = reservations.filter(r => r.userId === user.id);
  const activeReservations = userReservations.filter(r => r.status === 'approved');
  const pendingReservations = userReservations.filter(r => r.status === 'pending');
  const upcomingReservations = activeReservations.filter(r => new Date(r.startDate) > new Date());
  const availableResources = resources.filter(r => r.status === 'available');
  
  // Calcular estatísticas globais para admins
  const totalReservations = user.role === 'admin' ? reservations.length : userReservations.length;
  const totalPendingApprovals = user.role === 'admin' ? reservations.filter(r => r.status === 'pending').length : pendingReservations.length;
  const totalActiveReservations = user.role === 'admin' ? reservations.filter(r => r.status === 'approved').length : activeReservations.length;

  // Função para calcular tempo decorrido
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  };

  const stats = [
    {
      title: user.role === 'admin' ? 'Total de Reservas Ativas' : 'Minhas Reservas Ativas',
      value: totalActiveReservations,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: totalActiveReservations > 0 ? `+${Math.round((totalActiveReservations / Math.max(totalReservations, 1)) * 100)}%` : '0%'
    },
    {
      title: user.role === 'admin' ? 'Aprovações Pendentes' : 'Minhas Aprovações Pendentes',
      value: totalPendingApprovals,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: totalPendingApprovals > 0 ? `${totalPendingApprovals} pendente${totalPendingApprovals > 1 ? 's' : ''}` : 'Nenhuma'
    },
    {
      title: 'Recursos Disponíveis',
      value: availableResources.length,
      icon: Package,
      color: 'bg-blue-500',
      trend: `${Math.round((availableResources.length / Math.max(resources.length, 1)) * 100)}% disponível`
    },
    {
      title: user.role === 'admin' ? 'Reservas Futuras' : 'Meus Eventos Próximos',
      value: upcomingReservations.length,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: upcomingReservations.length > 0 ? `${upcomingReservations.length} próximo${upcomingReservations.length > 1 ? 's' : ''}` : 'Nenhum'
    }
  ];

  // Atividade recente baseada em dados reais
  const recentActivity = reservations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((reservation, index) => {
      const resource = resources.find(r => r.id === reservation.resourceId);
      const timeAgo = getTimeAgo(reservation.createdAt);
      
      let action = '';
      let type = 'reservation';
      
      switch (reservation.status) {
        case 'pending':
          action = `${resource?.name || 'Recurso'} - solicitação pendente`;
          type = 'pending';
          break;
        case 'approved':
          action = `${resource?.name || 'Recurso'} - reserva aprovada`;
          type = 'approval';
          break;
        case 'rejected':
          action = `${resource?.name || 'Recurso'} - solicitação rejeitada`;
          type = 'rejection';
          break;
        default:
          action = `${resource?.name || 'Recurso'} - nova solicitação`;
      }
      
      return {
        id: reservation.id,
        action,
        user: user.role === 'admin' ? `Usuário ${reservation.userId.substring(0, 8)}...` : 'Você',
        time: timeAgo,
        type
      };
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel de Controle</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Bem-vindo de volta, {user.name}. Aqui está sua visão geral dos recursos.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs sm:text-sm text-blue-600 ml-1">{stat.trend}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-xl`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Reservations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {user.role === 'admin' ? 'Reservas Futuras do Sistema' : 'Minhas Próximas Reservas'}
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {upcomingReservations.length > 0 ? (
              <div className="space-y-4">
                {upcomingReservations.slice(0, 5).map((reservation) => (
                  <div key={reservation.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {resources.find(r => r.id === reservation.resourceId)?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(reservation.startDate).toLocaleDateString()} - {reservation.purpose}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: {reservation.status === 'approved' ? 'Aprovado' : reservation.status}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {new Date(reservation.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {user.role === 'admin' ? 'Nenhuma reserva futura no sistema' : 'Você não tem reservas próximas'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="p-4 sm:p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${
                        activity.type === 'approval' ? 'bg-green-100' :
                        activity.type === 'pending' ? 'bg-yellow-100' :
                        activity.type === 'rejection' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          activity.type === 'approval' ? 'bg-green-600' :
                          activity.type === 'pending' ? 'bg-yellow-600' :
                          activity.type === 'rejection' ? 'bg-red-600' : 'bg-blue-600'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs sm:text-sm text-gray-600">por {activity.user}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/request')}
            className="bg-blue-600 text-white p-4 sm:p-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 text-left"
          >
            <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-sm sm:text-base font-semibold mb-1">Reservar Equipamento</h3>
            <p className="text-xs sm:text-sm text-blue-100">Reserve câmeras, projetores e mais</p>
          </button>
          <button 
            onClick={() => navigate('/request')}
            className="bg-green-600 text-white p-4 sm:p-6 rounded-xl hover:bg-green-700 transition-colors duration-200 text-left"
          >
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-sm sm:text-base font-semibold mb-1">Reservar Sala</h3>
            <p className="text-xs sm:text-sm text-green-100">Reserve salas de reunião e conferência</p>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="bg-purple-600 text-white p-4 sm:p-6 rounded-xl hover:bg-purple-700 transition-colors duration-200 text-left"
          >
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
            <h3 className="text-sm sm:text-base font-semibold mb-1">Verificar Status</h3>
            <p className="text-xs sm:text-sm text-purple-100">Visualize o status das suas reservas</p>
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => navigate('/settings')}
              className="bg-orange-600 text-white p-4 sm:p-6 rounded-xl hover:bg-orange-700 transition-colors duration-200 text-left sm:col-span-2 lg:col-span-1"
            >
              <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
              <h3 className="text-sm sm:text-base font-semibold mb-1">Configurações do Sistema</h3>
              <p className="text-xs sm:text-sm text-orange-100">Configure as preferências do sistema</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;