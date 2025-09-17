import React, { useState } from 'react';
import { Calendar, Wrench, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';

interface MaintenanceTask {
  id: string;
  resourceId: string;
  type: 'routine' | 'repair' | 'inspection' | 'upgrade';
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: number; // in hours
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  cost?: number;
  notes?: string;
}

const MaintenanceScheduler = () => {
  const { resources, maintenanceTasks, updateMaintenanceTaskStatus } = useReservation();

  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'routine': return CheckCircle;
      case 'repair': return Wrench;
      case 'inspection': return AlertTriangle;
      case 'upgrade': return Plus;
      default: return Wrench;
    }
  };

  const filteredTasks = maintenanceTasks.filter(task => 
    selectedStatus === 'all' || task.status === selectedStatus
  );

  const updateTaskStatus = (taskId: string, newStatus: MaintenanceTask['status']) => {
    try {
      updateMaintenanceTaskStatus(taskId, newStatus);
    } catch (error) {
      alert('Erro ao atualizar status da tarefa. Tente novamente.');
    }
  };

  const statusOptions = [
    { id: 'all', name: 'Todas as Tarefas' },
    { id: 'scheduled', name: 'Agendado' },
    { id: 'in-progress', name: 'Em Andamento' },
    { id: 'completed', name: 'Concluído' },
    { id: 'cancelled', name: 'Cancelado' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agendador de Manutenção</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Agende e acompanhe tarefas de manutenção de recursos</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agendar Tarefa</span>
            <span className="sm:hidden">Agendar</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Agendado</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {maintenanceTasks.filter(t => t.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-xl">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {maintenanceTasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Concluído</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {maintenanceTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 sm:p-3 rounded-xl">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Crítico</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {maintenanceTasks.filter(t => t.priority === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Tarefas de Manutenção</h2>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const resource = resources.find(r => r.id === task.resourceId);
          const TypeIcon = getTypeIcon(task.type);
          
          return (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                  <div className="bg-gray-100 p-2 sm:p-3 rounded-xl">
                    <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{task.title}</h3>
                      <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                      </div>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Recurso:</span> <span className="truncate">{resource?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Agendado:</span> {new Date(task.scheduledDate).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Duração:</span> {task.estimatedDuration}h
                      </div>
                      <div>
                        <span className="font-medium">Atribuído:</span> {task.assignedTo || 'Não atribuído'}
                      </div>
                    </div>
                    
                    {task.cost && (
                      <div className="mt-2 text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Custo Estimado:</span> R${task.cost}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                  {task.status === 'scheduled' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in-progress')}
                      className="bg-yellow-600 text-white px-2 sm:px-3 py-1 rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-xs sm:text-sm"
                    >
                      Iniciar
                    </button>
                  )}
                  {task.status === 'in-progress' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs sm:text-sm"
                    >
                      Concluir
                    </button>
                  )}
                  <button className="text-blue-600 hover:text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa de manutenção</h3>
          <p className="text-gray-600">Nenhuma tarefa corresponde ao seu filtro atual</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceScheduler;