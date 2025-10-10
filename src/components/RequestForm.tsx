import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Send, AlertCircle, Package } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';
import { reservationsService, packagesService } from '../services/database';
import { useNavigate } from 'react-router-dom';
import AISuggestionsCard from './AISuggestionsCard';
import type { AISuggestion } from '../types/ai';
import {
  analyzeClassroomCapacity,
  suggestEquipmentByPurpose,
  suggestAlternativeRooms,
  generateLessonStructure,
} from '../services/aiService';

const RequestForm = () => {
  const { resources, resourcePackages, addReservation, addPackageReservation } = useReservation();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [requestType, setRequestType] = useState<'individual' | 'package'>('individual');
  const [formData, setFormData] = useState({
    resourceId: '',
    packageId: '',
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
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [packageResources, setPackageResources] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiDebounceTimer, setAiDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem(`reservation_draft_${user?.id}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(draftData);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (aiDebounceTimer) {
        clearTimeout(aiDebounceTimer);
      }
    };
  }, [aiDebounceTimer]);

  const saveDraft = async () => {
    if (!user) return;
    
    setIsSavingDraft(true);
    try {
      localStorage.setItem(`reservation_draft_${user.id}`, JSON.stringify(formData));
      alert('Rascunho salvo com sucesso!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Erro ao salvar rascunho.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const clearDraft = () => {
    if (user) {
      localStorage.removeItem(`reservation_draft_${user.id}`);
    }
  };

  // Load package resources when package is selected
  const loadPackageResources = async (packageId: string) => {
    if (!packageId) {
      setPackageResources([]);
      return;
    }
    
    try {
      const resources = await packagesService.getPackageResources(packageId);
      setPackageResources(resources);
    } catch (error) {
      console.error('Error loading package resources:', error);
      setPackageResources([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (requestType === 'individual' && !formData.resourceId) {
      newErrors.resourceId = 'Por favor, selecione um recurso';
    }
    if (requestType === 'package' && !formData.packageId) {
      newErrors.packageId = 'Por favor, selecione um pacote';
    }
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
    if (requestType === 'package') {
      // For packages, we'll check availability during submission
      return false;
    }
    
    if (!formData.resourceId || !formData.startDate || !formData.endDate || 
        !formData.startTime || !formData.endTime) {
      return false;
    }

    const startDateTime = `${formData.startDate}T${formData.startTime}`;
    const endDateTime = `${formData.endDate}T${formData.endTime}`;

    try {
      setIsCheckingConflict(true);
      const conflictInfo = await reservationsService.checkConflict(
        formData.resourceId,
        startDateTime,
        endDateTime
      );

      if (conflictInfo.hasConflict) {
        setErrors(prev => ({
          ...prev,
          resourceId: `Este recurso não está disponível para o período selecionado. Disponíveis: ${conflictInfo.availableSlots}/${conflictInfo.totalQuantity} | Reservados: ${conflictInfo.reservedSlots}`
        }));
        return true;
      }

      // Clear any previous conflict error and show availability info
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.resourceId?.includes('não está disponível') || newErrors.resourceId?.includes('já está reservado')) {
          delete newErrors.resourceId;
        }
        return newErrors;
      });

      // Show availability as positive feedback
      if (conflictInfo.availableSlots < conflictInfo.totalQuantity) {
        setErrors(prev => ({
          ...prev,
          resourceId: `✅ Disponível! ${conflictInfo.availableSlots} de ${conflictInfo.totalQuantity} slots disponíveis neste horário.`
        }));
      }

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
      if (requestType === 'individual' && formData.resourceId && formData.startDate && formData.endDate && 
          formData.startTime && formData.endTime) {
        checkReservationConflict();
      }
    }, 500); // 500ms delay

    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const generateAISuggestions = async () => {
    if (!formData.purpose || formData.purpose.length < 10) {
      return;
    }

    setIsLoadingAI(true);
    const newSuggestions: AISuggestion[] = [];

    try {
      if (requestType === 'individual' && formData.resourceId) {
        const selectedResource = resources.find(r => r.id === formData.resourceId);

        if (selectedResource && formData.attendees) {
          const participants = parseInt(formData.attendees);
          const capacityCheck = await analyzeClassroomCapacity(
            participants,
            selectedResource.name,
            selectedResource.capacity || 0
          );
          if (capacityCheck) newSuggestions.push(capacityCheck);
        }

        const equipmentSuggestion = await suggestEquipmentByPurpose(
          formData.purpose,
          selectedResource?.name || 'recurso selecionado'
        );
        if (equipmentSuggestion) newSuggestions.push(equipmentSuggestion);

        if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
          const startDateTime = `${formData.startDate}T${formData.startTime}`;
          const endDateTime = `${formData.endDate}T${formData.endTime}`;

          const alternativesSuggestion = await suggestAlternativeRooms(
            formData.resourceId,
            parseInt(formData.attendees) || 1,
            startDateTime,
            endDateTime
          );
          if (alternativesSuggestion) newSuggestions.push(alternativesSuggestion);
        }
      }

      if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
        const startDate = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDate = new Date(`${formData.endDate}T${formData.endTime}`);
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

        if (durationMinutes > 30) {
          const lessonStructure = await generateLessonStructure(
            formData.purpose,
            durationMinutes,
            false
          );
          if (lessonStructure) newSuggestions.push(lessonStructure);
        }
      }

      setAiSuggestions(newSuggestions);
    } catch (error) {
      console.error('Erro ao gerar sugestões de IA:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const debouncedGenerateAISuggestions = () => {
    if (aiDebounceTimer) {
      clearTimeout(aiDebounceTimer);
    }

    const timer = setTimeout(() => {
      generateAISuggestions();
    }, 1000);

    setAiDebounceTimer(timer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (requestType === 'individual') {
      // Check for reservation conflicts for individual resources
      const conflictInfo = await reservationsService.checkConflict(
        formData.resourceId,
        `${formData.startDate}T${formData.startTime}`,
        `${formData.endDate}T${formData.endTime}`
      );

      if (conflictInfo.hasConflict) {
        setErrors(prev => ({
          ...prev,
          resourceId: `Este recurso não está disponível. ${conflictInfo.availableSlots} de ${conflictInfo.totalQuantity} disponíveis, ${conflictInfo.reservedSlots} já reservados.`
        }));
        return;
      }
    }

    setIsSubmitting(true);
    
    try {

      if (requestType === 'individual') {
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
      } else {
        // Package reservation
        await addPackageReservation(
          formData.packageId,
          `${formData.startDate}T${formData.startTime}`,
          `${formData.endDate}T${formData.endTime}`,
          formData.purpose,
          formData.description
        );
      }
      
      // Reset form
      clearDraft();
      setFormData({
        resourceId: '',
        packageId: '',
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
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Falha ao enviar solicitação: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (requestType === 'individual' && ['resourceId', 'startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
      debouncedCheckReservationConflict();
    }

    if (field === 'packageId') {
      loadPackageResources(value);
    }

    if (['purpose', 'resourceId', 'attendees', 'startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
      debouncedGenerateAISuggestions();
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (suggestion.suggestion_type === 'alternative_room' && suggestion.metadata?.alternative_resources) {
      const firstAlternative = suggestion.metadata.alternative_resources[0];
      if (firstAlternative) {
        handleInputChange('resourceId', firstAlternative.id);
      }
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
        {/* Request Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Tipo de Solicitação</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRequestType('individual')}
              className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
                requestType === 'individual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Recurso Individual</h3>
                  <p className="text-sm text-gray-600">Reserve um recurso específico</p>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setRequestType('package')}
              className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
                requestType === 'package'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Pacote de Recursos</h3>
                  <p className="text-sm text-gray-600">Reserve um conjunto de recursos por assunto</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Resource Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            {requestType === 'individual' ? <FileText className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            <span>Seleção de Recurso</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {requestType === 'individual' ? (
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
            ) : (
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Pacote de Recursos *
                </label>
                <select
                  value={formData.packageId}
                  onChange={(e) => handleInputChange('packageId', e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.packageId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um pacote</option>
                  {resourcePackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.subject}
                    </option>
                  ))}
                </select>
                {errors.packageId && (
                  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.packageId}</span>
                  </p>
                )}
                
                {/* Show package resources */}
                {packageResources.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recursos incluídos neste pacote:</h4>
                    <div className="space-y-1">
                      {packageResources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {resource.resource?.name} - {resource.resource?.location}
                          </span>
                          <span className="text-gray-600">
                            Qtd: {resource.quantity_needed}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {requestType === 'individual' && (
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
            )}
          </div>
        </div>

        {/* Date and Time - same for both types */}
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
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.startDate}</span>
                </p>
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
                placeholder={requestType === 'package' ? 'Ex: Aula de Física - Experimentos de Óptica' : 'Breve descrição da finalidade'}
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
                placeholder={requestType === 'package' 
                  ? 'Descreva como pretende usar os recursos do pacote na sua aula'
                  : 'Forneça detalhes adicionais sobre sua solicitação de reserva'
                }
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
                  placeholder={requestType === 'package' ? 'Número de alunos na turma' : 'Número esperado de pessoas'}
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
                  placeholder={requestType === 'package' 
                    ? 'Configurações especiais para a aula'
                    : 'Qualquer configuração especial ou necessidades de equipamento'
                  }
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Section */}
        {(aiSuggestions.length > 0 || isLoadingAI) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Sugestões Inteligentes</h2>
            <AISuggestionsCard
              suggestions={aiSuggestions}
              onApplySuggestion={handleApplySuggestion}
              loading={isLoadingAI}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSavingDraft}
            className="px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            {isSavingDraft ? 'Salvando...' : 'Salvar como Rascunho'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (requestType === 'individual' && isCheckingConflict)}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>
              {isSubmitting ? 'Enviando...' : 
               (requestType === 'individual' && isCheckingConflict) ? 'Verificando...' : 
               requestType === 'package' ? 'Solicitar Pacote' : 'Enviar Solicitação'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;