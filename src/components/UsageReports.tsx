import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';

const UsageReports = () => {
  const { reservations, resources } = useReservation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Calculate usage statistics
  const totalReservations = reservations.length;
  const approvedReservations = reservations.filter(r => r.status === 'approved').length;
  const rejectedReservations = reservations.filter(r => r.status === 'rejected').length;
  const approvalRate = totalReservations > 0 ? (approvedReservations / totalReservations * 100) : 0;

  // Resource utilization
  const resourceUsage = resources.map(resource => {
    const usage = reservations.filter(r => r.resourceId === resource.id && r.status === 'approved').length;
    return {
      resource: resource.name,
      category: resource.category,
      usage,
      utilization: usage > 0 ? Math.min((usage / 30) * 100, 100) : 0 // Assuming 30 is max capacity per month
    };
  }).sort((a, b) => b.usage - a.usage);

  // Monthly trends (mock data for demonstration)
  const monthlyData = [
    { month: 'Jan', reservations: 45, approved: 38, rejected: 7 },
    { month: 'Fev', reservations: 52, approved: 44, rejected: 8 },
    { month: 'Mar', reservations: 48, approved: 42, rejected: 6 },
    { month: 'Abr', reservations: 61, approved: 55, rejected: 6 },
    { month: 'Mai', reservations: 58, approved: 51, rejected: 7 },
    { month: 'Jun', reservations: 67, approved: 59, rejected: 8 }
  ];

  const stats = [
    {
      title: 'Total de Reservas',
      value: totalReservations,
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${approvalRate.toFixed(1)}%`,
      change: '+3.2%',
      trend: 'up'
    },
    {
      title: 'Recursos Ativos',
      value: resources.filter(r => r.status === 'available').length,
      change: '-2%',
      trend: 'down'
    },
    {
      title: 'Uso Médio/Dia',
      value: Math.round(totalReservations / 30),
      change: '+8%',
      trend: 'up'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios de Uso</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Analise a utilização de recursos e desempenho do sistema</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Ano</option>
            </select>
            <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs sm:text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tendências Mensais</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-8 sm:w-12 text-xs sm:text-sm font-medium text-gray-600">{data.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(data.reservations / 70) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8">{data.reservations}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Utilização de Recursos</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {resourceUsage.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate pr-2">{item.resource}</span>
                      <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{item.usage} usos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Relatório Detalhado de Uso</h2>
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrar</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total de Usos
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Utilização
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resourceUsage.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {item.resource}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 capitalize hidden sm:table-cell">
                    {item.category}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {item.usage}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">{item.utilization.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsageReports;