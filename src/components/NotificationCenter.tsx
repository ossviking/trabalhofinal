import React, { useState } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, Info } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';


const NotificationCenter = () => {
  const { reservations, resources } = useReservation();
  const { user } = useUser();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Generate dynamic notifications based on user's reservations
  const generateNotifications = () => {
    if (!user) return [];
    
    const userReservations = reservations.filter(r => r.userId === user.id);
    const notifications: any[] = [];
    
    // Approved reservations
    userReservations
      .filter(r => r.status === 'approved')
      .slice(0, 3)
      .forEach(reservation => {
        const resource = resources.find(r => r.id === reservation.resourceId);
        notifications.push({
          id: `approval-${reservation.id}`,
          type: 'approval',
          title: 'Reserva Aprovada',
          message: `Sua solicitação para ${resource?.name || 'recurso'} foi aprovada`,
          timestamp: reservation.createdAt,
          read: readNotifications.has(`approval-${reservation.id}`),
          actionRequired: false
        });
      });
    
    // Pending reservations
    userReservations
      .filter(r => r.status === 'pending')
      .slice(0, 2)
      .forEach(reservation => {
        const resource = resources.find(r => r.id === reservation.resourceId);
        notifications.push({
          id: `pending-${reservation.id}`,
          type: 'reminder',
          title: 'Reserva Pendente',
          message: `Sua solicitação para ${resource?.name || 'recurso'} está aguardando aprovação`,
          timestamp: reservation.createdAt,
          read: readNotifications.has(`pending-${reservation.id}`),
          actionRequired: false
        });
      });
    
    // Upcoming reservations (next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    userReservations
      .filter(r => {
        const startDate = new Date(r.startDate);
        return r.status === 'approved' && startDate > now && startDate <= tomorrow;
      })
      .slice(0, 2)
      .forEach(reservation => {
        const resource = resources.find(r => r.id === reservation.resourceId);
        const startDate = new Date(reservation.startDate);
        const hoursUntil = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        notifications.push({
          id: `reminder-${reservation.id}`,
          type: 'reminder',
          title: 'Reserva Próxima',
          message: `Sua reserva para ${resource?.name || 'recurso'} começa em ${hoursUntil} hora${hoursUntil !== 1 ? 's' : ''}`,
          timestamp: reservation.createdAt,
          read: readNotifications.has(`reminder-${reservation.id}`),
          actionRequired: true
        });
      });
    
    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };
  const [isOpen, setIsOpen] = useState(false);
  const notifications = generateNotifications();

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const deleteNotification = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return Check;
      case 'reminder': return Clock;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval': return 'text-green-600 bg-green-100';
      case 'reminder': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notificações</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        {notification.actionRequired && (
                          <div className="mt-2">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              Ação Necessária
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs whitespace-nowrap"
                          >
                            <span className="hidden sm:inline">Marcar como Lida</span>
                            <span className="sm:hidden">Lida</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800 text-xs whitespace-nowrap"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;