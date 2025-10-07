import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, Package, FileText, CheckSquare, BarChart3, Users, Wrench, Settings, Menu, X, Shield, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useReservation } from '../context/ReservationContext';
import { useChat } from '../context/ChatContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useUser();
  const { resources, reservations } = useReservation();
  const { unreadCount } = useChat();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Se não há usuário logado, não renderiza a navbar
  if (!user) {
    return null;
  }

  // Calcular contagens dinâmicas
  const availableResourcesCount = resources.filter(r => r.status === 'available').length;
  const userReservations = reservations.filter(r => r.userId === user.id);
  const activeReservationsCount = userReservations.filter(r => r.status === 'approved').length;
  const pendingApprovalsCount = reservations.filter(r => r.status === 'pending').length;
  const upcomingEventsCount = userReservations.filter(r => 
    r.status === 'approved' && new Date(r.startDate) > new Date()
  ).length;

  const navItems = [
    { path: '/', icon: Home, label: 'Painel' },
    { path: '/resources', icon: Package, label: 'Recursos' },
    { path: '/calendar', icon: Calendar, label: 'Calendário' },
    { path: '/request', icon: FileText, label: 'Nova Solicitação' },
    { path: '/packages', icon: Package, label: 'Pacotes', roles: ['admin'] },
    { path: '/approvals', icon: CheckSquare, label: 'Aprovações', roles: ['faculty', 'admin'] },
    { path: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['admin'] },
    { path: '/users', icon: Users, label: 'Usuários', roles: ['admin'] },
    { path: '/admin/resources', icon: Package, label: 'Gerenciar Recursos', roles: ['admin'] },
    { path: '/maintenance', icon: Wrench, label: 'Manutenção', roles: ['admin'] },
    { path: '/ai-insights', icon: Sparkles, label: 'Insights de IA', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Configurações', roles: ['admin'] },
    { path: '/password-reset', icon: Shield, label: 'Redefinir Senhas', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  // Função para obter a contagem do badge para cada item
  const getBadgeCount = (path: string) => {
    switch (path) {
      case '/': return activeReservationsCount;
      case '/resources': return availableResourcesCount;
      case '/calendar': return upcomingEventsCount;
      case '/approvals': return (user.role === 'admin' || user.role === 'faculty') ? pendingApprovalsCount : 0;
      default: return 0;
    }
  };

  // Função para obter a cor do badge
  const getBadgeColor = (path: string) => {
    switch (path) {
      case '/approvals': return 'bg-red-100 text-red-800';
      case '/': return 'bg-green-100 text-green-800';
      case '/calendar': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">CentroRecursos</span>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const badgeCount = getBadgeCount(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex items-center space-x-2">
                      <span>{item.label}</span>
                      {badgeCount > 0 && (
                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${getBadgeColor(item.path)}`}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />
            
            {/* Chat Indicator */}
            <div className="relative">
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                title="Clique para sair"
              >
                <span className="text-white text-sm font-medium">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const badgeCount = getBadgeCount(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex items-center justify-between flex-1">
                      <span>{item.label}</span>
                      {badgeCount > 0 && (
                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${getBadgeColor(item.path)}`}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
              
              {/* User info in mobile menu */}
              <div className="sm:hidden pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <button
                    onClick={handleLogout}
                    className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                  >
                    <span className="text-white text-sm font-medium">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  Sair do Sistema
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;