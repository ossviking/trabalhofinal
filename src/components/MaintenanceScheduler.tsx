import React, { useState } from 'react';
import { Calendar, Wrench, AlertTriangle, CheckCircle, Clock, Plus, X, Save } from 'lucide-react';
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
  const { resources, maintenanceTasks, updateMaintenanceTaskStatus, addMaintenanceTask } = useReservation();

  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    resourceId: '',
    type: 'routine' as 'routine' | 'repair' | 'inspection' | 'upgrade',
    title: '',
    description: '',
    scheduledDate: '',
    estimatedDuration: 1,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: '',
    cost: '',
    notes: ''
  });

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData = {
        id: crypto.randomUUID(),
        resourceId: newTaskData.resourceId,
        type: newTaskData.type,
        title: newTaskData.title,
        description: newTaskData.description,
        scheduledDate: newTaskData.scheduledDate,
        estimatedDuration: newTaskData.estimatedDuration,
        status: 'scheduled' as const,
        priority: newTaskData.priority,
        assignedTo: newTaskData.assignedTo || undefined,
        cost: newTaskData.cost ? parseFloat(newTaskData.cost) : undefined,
        notes: newTaskData.notes || undefined
      };

      await addMaintenanceTask(taskData);
      
      // Reset form
      setNewTaskData({
        resourceId: '',
        type: 'routine',
        title: '',
        description: '',
        scheduledDate: '',
        estimatedDuration: 1,
        priority: 'medium',
        assignedTo: '',
        cost: '',
        notes: ''
      });
      setShowAddTask(false);
      alert('Tarefa de manutenção agendada com sucesso!');
    } catch (error) {
      console.error('Error adding maintenance task:', error);
      alert('Erro ao agendar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Agendar Nova Tarefa de Manutenção</h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurso *
                    </label>
                    <select
                      value={newTaskData.resourceId}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, resourceId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um recurso</option>
                      {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} - {resource.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Manutenção *
                    </label>
                    <select
                      value={newTaskData.type}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="routine">Rotina</option>
                      <option value="repair">Reparo</option>
                      <option value="inspection">Inspeção</option>
                      <option value="upgrade">Upgrade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Agendada *
                    </label>
                    <input
                      type="datetime-local"
                      value={newTaskData.scheduledDate}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração Estimada (horas) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTaskData.estimatedDuration}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade
                    </label>
                    <select
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Atribuído a
                    </label>
                    <input
                      type="text"
                      value={newTaskData.assignedTo}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custo Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newTaskData.cost}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionais
                  </label>
                  <textarea
                    value={newTaskData.notes}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Agendando...' : 'Agendar Tarefa'}</span>
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

export default MaintenanceScheduler;