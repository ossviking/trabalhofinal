import React from 'react';
import { BarChart3, PieChart, TrendingUp, Package, CheckCircle, XCircle } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';

const UsageReports = () => {
  const { reservations, resources, loading } = useReservation();
  const { user } = useUser();

  // Ensure only admins can view this page, though routing already handles it
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalReservations = reservations.length;
  const approvedReservations = reservations.filter(r => r.status === 'approved').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const rejectedReservations = reservations.filter(r => r.status === 'rejected').length;

  const approvalRate = totalReservations > 0 ? ((approvedReservations / totalReservations) * 100).toFixed(2) : '0.00';

  // Resource utilization (simple example: count unique resources in approved reservations)
  const utilizedResources = new Set(reservations.filter(r => r.status === 'approved').map(r => r.resourceId)).size;
  const totalUniqueResources = resources.length;
  const resourceUtilizationRate = totalUniqueResources > 0 ? ((utilizedResources / totalUniqueResources) * 100).toFixed(2) : '0.00';

  // Calculate monthly trends (last 6 months)
  const monthlyData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
    const monthReservations = reservations.filter(r => {
      const reservationDate = new Date(r.createdAt);
      return reservationDate.getMonth() === monthDate.getMonth() && 
             reservationDate.getFullYear() === monthDate.getFullYear();
    }).length;
    monthlyData.push({ month: monthName, count: monthReservations });
  }

  // Most used resources
  const resourceUsage = resources.map(resource => {
    const usageCount = reservations.filter(r => r.resourceId === resource.id && r.status === 'approved').length;
    return { ...resource, usageCount };
  }).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios de Uso</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Visão geral e estatísticas sobre o uso de recursos e reservas.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Reservas</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{totalReservations}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-xs sm:text-sm text-blue-600 ml-1">
                  {monthlyData[monthlyData.length - 1]?.count || 0} este mês
                </span>
              </div>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Taxa de Aprovação</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{approvalRate}%</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs sm:text-sm text-green-600 ml-1">
                  {approvedReservations} aprovadas
                </span>
              </div>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Reservas Pendentes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{pendingReservations}</p>
              <div className="flex items-center mt-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs sm:text-sm text-red-600 ml-1">
                  {rejectedReservations} rejeitadas
                </span>
              </div>
            </div>
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-xl">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Utilização de Recursos</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{resourceUtilizationRate}%</p>
              <div className="flex items-center mt-2">
                <Package className="h-4 w-4 text-purple-500" />
                <span className="text-xs sm:text-sm text-purple-600 ml-1">
                  {utilizedResources} de {totalUniqueResources} recursos
                </span>
              </div>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Tendência Mensal de Reservas</h2>
          <div className="space-y-3">
            {monthlyData.map((data, index) => {
              const maxCount = Math.max(...monthlyData.map(d => d.count));
              const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-8">{data.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{data.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Used Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recursos Mais Utilizados</h2>
          <div className="space-y-4">
            {resourceUsage.length > 0 ? (
              resourceUsage.map((resource, index) => (
                <div key={resource.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{resource.category} • {resource.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{resource.usageCount}</p>
                    <p className="text-xs text-gray-500">reservas</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum recurso foi utilizado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Distribuição por Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{approvedReservations}</p>
            <p className="text-sm text-green-700">Aprovadas</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{pendingReservations}</p>
            <p className="text-sm text-yellow-700">Pendentes</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{rejectedReservations}</p>
            <p className="text-sm text-red-700">Rejeitadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageReports;