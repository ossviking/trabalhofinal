import React, { useState } from 'react';
import { Search, Filter, MapPin, Users, Wifi, Monitor, Camera, Projector, Package } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';

const ResourceCatalog = () => {
  const { resources } = useReservation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos os Recursos', icon: Package },
    { id: 'rooms', name: 'Salas', icon: MapPin },
    { id: 'equipment', name: 'Equipamentos', icon: Monitor },
    { id: 'av', name: 'Audiovisual', icon: Camera }
  ];

  const statusOptions = [
    { id: 'all', name: 'Todos os Status' },
    { id: 'available', name: 'Disponível' },
    { id: 'reserved', name: 'Reservado' },
    { id: 'maintenance', name: 'Manutenção' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || resource.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (category: string) => {
    switch (category) {
      case 'rooms': return MapPin;
      case 'equipment': return Monitor;
      case 'av': return Camera;
      default: return Package;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catálogo de Recursos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Navegue e reserve recursos disponíveis</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredResources.map((resource) => {
          const Icon = getResourceIcon(resource.category);
          return (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={resource.image}
                  alt={resource.name}
                  className="w-full h-32 sm:h-48 object-cover"
                />
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{resource.name}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                    {resource.status}
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
                
                {/* Resource Specifications */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>Quantidade: {resource.quantity}</span>
                  </div>
                  {resource.category === 'rooms' && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Capacidade: {resource.specifications?.capacity} pessoas</span>
                    </div>
                  )}
                  {resource.specifications?.hasWifi && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <Wifi className="h-4 w-4" />
                      <span>WiFi Disponível</span>
                    </div>
                  )}
                  {resource.specifications?.hasProjector && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <Projector className="h-4 w-4" />
                      <span>Projetor Incluído</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    disabled={resource.status !== 'available' || resource.quantity === 0}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      resource.status === 'available' && resource.quantity > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {resource.quantity === 0 ? 'Esgotado' : `Reservar (${resource.quantity} disponível${resource.quantity > 1 ? 'is' : ''})`}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recurso encontrado</h3>
          <p className="text-gray-600">Tente ajustar seus critérios de busca</p>
        </div>
      )}
    </div>
  );
};

export default ResourceCatalog;