import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useNavigate } from 'react-router-dom';

const ReservationCalendar = () => {
  const { reservations, resources } = useReservation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getReservationsForDate = (date: Date) => {
    if (!date) return [];

    return reservations.filter(reservation => {
      const reservationStartDate = new Date(reservation.startDate);
      const reservationEndDate = new Date(reservation.endDate);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      reservationStartDate.setHours(0, 0, 0, 0);
      reservationEndDate.setHours(0, 0, 0, 0);

      // Check if the date falls within the reservation period
      return checkDate >= reservationStartDate && checkDate <= reservationEndDate;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendário de Reservas</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Visualize e gerencie suas reservas</p>
          </div>
          <button 
            onClick={() => navigate('/request')}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Reserva</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="hidden sm:flex space-x-2">
              {[
                { id: 'month', label: 'Mês' },
                { id: 'week', label: 'Semana' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedView === view.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-600">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className={`grid grid-cols-7 gap-1 ${selectedView === 'week' ? 'grid-rows-1' : ''}`}>
            {days.map((date, index) => {
              const dayReservations = getReservationsForDate(date);
              
              return (
                <div
                  key={index}
                  className={`${selectedView === 'week' ? 'min-h-32 sm:min-h-40' : 'min-h-16 sm:min-h-24'} p-1 sm:p-2 border border-gray-100 rounded-lg transition-colors duration-200 ${
                    date ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${
                        isToday(date) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayReservations.slice(0, selectedView === 'week' ? 4 : (window.innerWidth < 640 ? 1 : 2)).map((reservation) => {
                          const resource = resources.find(r => r.id === reservation.resourceId);
                          const startTime = new Date(reservation.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          const endTime = new Date(reservation.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={reservation.id}
                              className={`text-xs p-1 rounded text-white truncate ${getStatusColor(reservation.status)} cursor-pointer hover:opacity-80`}
                              title={`${resource?.name}\n${reservation.purpose}\n${startTime} - ${endTime}\nStatus: ${reservation.status}`}
                            >
                              <div className="font-medium">
                                <span className="hidden sm:inline">{resource?.name}</span>
                                <span className="sm:hidden">{resource?.name?.substring(0, 8)}...</span>
                              </div>
                              <div className="text-[10px] opacity-90">
                                {startTime} - {endTime}
                              </div>
                            </div>
                          );
                        })}

                        {dayReservations.length > (selectedView === 'week' ? 4 : (window.innerWidth < 640 ? 1 : 2)) && (
                          <div className="text-xs text-gray-600 text-center font-medium">
                            +{dayReservations.length - (selectedView === 'week' ? 4 : (window.innerWidth < 640 ? 1 : 2))} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Legenda</h3>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Aprovado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Pendente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs sm:text-sm text-gray-600">Rejeitado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;