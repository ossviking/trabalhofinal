import React, { useState } from 'react';
import { Calendar, Clock, FileText, Send, AlertCircle } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';
import { reservationsService } from '../services/database';

const RequestForm = () => {
  const { resources, addReservation } = useReservation();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    resourceId: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    description: '',
    attendees: '',
    priority: 'normal',
    requirements: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.resourceId) newErrors.resourceId = 'Please select a resource';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';

    // Validate date logic
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Validate time logic for same day reservations
    if (formData.startDate === formData.endDate && formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkReservationConflict = async () => {
    if (!formData.resourceId || !formData.startDate || !formData.endDate || 
        !formData.startTime || !formData.endTime) {
      return false;
    }

    const startDateTime = `${formData.startDate}T${formData.startTime}`;
    const endDateTime = `${formData.endDate}T${formData.endTime}`;

    try {
      setIsCheckingConflict(true);
      const hasConflict = await reservationsService.checkConflict(
        formData.resourceId,
        startDateTime,
        endDateTime
      );
      
      if (hasConflict) {
        setErrors(prev => ({
          ...prev,
          resourceId: 'Este recurso já está reservado para o período selecionado. Escolha outro horário ou recurso.'
        }));
        return true;
      }
      
      // Clear any previous conflict error
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.resourceId?.includes('já está reservado')) {
          delete newErrors.resourceId;
        }
        return newErrors;
      });
      
      return false;
    } catch (error) {
      console.error('Error checking reservation conflict:', error);
      setErrors(prev => ({
        ...prev,
        resourceId: 'Erro ao verificar disponibilidade. Tente novamente.'
      }));
      return true;
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Debounced conflict check function
  const debouncedCheckReservationConflict = () => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      if (formData.resourceId && formData.startDate && formData.endDate && 
          formData.startTime && formData.endTime) {
        checkReservationConflict();
      }
    }, 500); // 500ms delay

    setDebounceTimer(timer);
  };

  // Cleanup timer on component unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check for reservation conflicts
    const hasConflict = await checkReservationConflict();
    if (hasConflict) return;

    setIsSubmitting(true);
    
    try {
      const reservation = {
        userId: user.id,
        resourceId: formData.resourceId,
        startDate: `${formData.startDate}T${formData.startTime}`,
        endDate: `${formData.endDate}T${formData.endTime}`,
        purpose: formData.purpose,
        description: formData.description,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        priority: formData.priority,
        attendees: formData.attendees ? parseInt(formData.attendees) : undefined,
        requirements: formData.requirements
      };

      await addReservation(reservation);
      
      // Reset form
      setFormData({
        resourceId: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        description: '',
        attendees: '',
        priority: 'normal',
        requirements: ''
      });
      
      alert('Reservation request submitted successfully!');
    } catch (error) {
      console.error('Error submitting reservation:', error);
      alert('Failed to submit reservation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Auto-check for conflicts when key fields change
    if (['resourceId', 'startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
      debouncedCheckReservationConflict();
    }
  };

  const availableResources = resources.filter(r => r.status === 'available');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nova Solicitação de Reserva</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Envie uma solicitação para reservar recursos para suas necessidades</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Resource Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Seleção de Recurso</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Recurso *
              </label>
              <select
                value={formData.resourceId}
                onChange={(e) => handleInputChange('resourceId', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.resourceId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um recurso</option>
                {availableResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} - {resource.category} (Qtd disponível: {resource.quantity})
                  </option>
                ))}
              </select>
              {errors.resourceId && (
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.resourceId}</span>
                </p>
              )}
              {isCheckingConflict && (
                <p className="text-blue-600 text-sm mt-1 flex items-center space-x-1">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Verificando disponibilidade...</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Nível de Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Prioridade Baixa</option>
                <option value="normal">Prioridade Normal</option>
                <option value="high">Prioridade Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Data e Horário</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Data de Término *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Horário de Início *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Horário de Término *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Detalhes da Solicitação</span>
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Finalidade *
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder="Breve descrição da finalidade"
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.purpose ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.purpose && (
                <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                placeholder="Forneça detalhes adicionais sobre sua solicitação de reserva"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Número de Participantes
                </label>
                <input
                  type="number"
                  value={formData.attendees}
                  onChange={(e) => handleInputChange('attendees', e.target.value)}
                  min="1"
                  placeholder="Número esperado de pessoas"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Requisitos Especiais
                </label>
                <input
                  type="text"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Qualquer configuração especial ou necessidades de equipamento"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            className="px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Salvar como Rascunho
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCheckingConflict}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>
              {isSubmitting ? 'Enviando...' : 
               isCheckingConflict ? 'Verificando...' : 
               'Enviar Solicitação'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;