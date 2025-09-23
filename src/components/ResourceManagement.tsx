import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, MapPin, Monitor, Camera, Save, X } from 'lucide-react';
import { useReservation } from '../context/ReservationContext';

interface ResourceFormData {
  name: string;
  category: 'rooms' | 'equipment' | 'av';
  description: string;
  status: 'available' | 'reserved' | 'maintenance';
  location: string;
  image: string;
  quantity: number;
  specifications: {
    capacity?: number;
    hasWifi?: boolean;
    hasProjector?: boolean;
    [key: string]: any;
  };
}

const ResourceManagement = () => {
  const { resources, addResource, updateResource, deleteResource } = useReservation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    category: 'equipment',
    description: '',
    status: 'available',
    location: '',
    image: '',
    quantity: 1,
    specifications: {}
  });

  const categories = [
    { id: 'all', name: 'Todas as Categorias', icon: Package },
    { id: 'rooms', name: 'Salas', icon: MapPin },
    { id: 'equipment', name: 'Equipamentos', icon: Monitor },
    { id: 'av', name: 'Audiovisual', icon: Camera }
  ];

  const statusOptions = [
    { id: 'available', name: 'Disponível' },
    { id: 'reserved', name: 'Reservado' },
    { id: 'maintenance', name: 'Manutenção' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'equipment',
      description: '',
      status: 'available',
      location: '',
      image: '',
      quantity: 1,
      specifications: {}
    });
    setEditingResource(null);
    setShowForm(false);
  };

  const handleEdit = (resource: any) => {
    setFormData({
      name: resource.name,
      category: resource.category,
      description: resource.description,
      status: resource.status,
      location: resource.location,
      image: resource.image,
      quantity: resource.quantity,
      specifications: resource.specifications || {}
    });
    setEditingResource(resource.id);
    setShowForm(true);
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url) return false;
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // Check if it's a valid image URL pattern
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    const validDomains = ['pexels.com', 'unsplash.com', 'pixabay.com', 'images.unsplash.com', 'cdn.pixabay.com'];
    
    // Allow common image hosting domains or direct image URLs
    return imageExtensions.test(url) || validDomains.some(domain => url.includes(domain));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Localização é obrigatória';
    }
    
    if (!validateImageUrl(formData.image)) {
      newErrors.image = 'URL da imagem inválida. Use URLs de imagens válidas (jpg, png, gif, webp, svg) ou de sites como Pexels, Unsplash, Pixabay';
    }
    
    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantidade deve ser pelo menos 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('Submitting resource form with data:', formData);
      if (editingResource) {
        await updateResource(editingResource, formData);
        alert('Recurso atualizado com sucesso!');
      } else {
        await addResource(formData);
        alert('Recurso adicionado com sucesso!');
      }
      resetForm();
    } catch (error) {
      console.error('Error submitting resource:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar recurso: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o recurso "${name}"?`)) {
      try {
        await deleteResource(id);
        alert('Recurso excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Erro ao excluir recurso. Tente novamente.');
      }
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Recursos</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Adicione, edite e gerencie recursos do sistema</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Recurso</span>
            <span className="sm:hidden">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Recursos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{resources.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Salas</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {resources.filter(r => r.category === 'rooms').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-xl">
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Equipamentos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {resources.filter(r => r.category === 'equipment').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-xl">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Audiovisual</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {resources.filter(r => r.category === 'av').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
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
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Localização
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResources.map((resource) => {
                const Icon = getResourceIcon(resource.category);
                return (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Icon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{resource.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs">{resource.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 capitalize hidden sm:table-cell">
                      {resource.category}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                      {resource.location}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {resource.quantity}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id, resource.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recurso encontrado</h3>
          <p className="text-gray-600">Tente ajustar seus critérios de busca</p>
        </div>
      )}

      {/* Add/Edit Resource Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingResource ? 'Editar Recurso' : 'Adicionar Novo Recurso'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Recurso *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="rooms">Salas</option>
                      <option value="equipment">Equipamentos</option>
                      <option value="av">Audiovisual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localização *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, location: e.target.value }));
                        if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.location ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.location && (
                      <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setFormData(prev => ({ ...prev, quantity: value }));
                        if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.quantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem *
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image: e.target.value }));
                        if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.image ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://exemplo.com/imagem.jpg"
                      required
                    />
                    {errors.image && (
                      <p className="text-red-600 text-sm mt-1">{errors.image}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                    }}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {formData.category === 'rooms' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacidade (pessoas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.specifications.capacity || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          capacity: parseInt(e.target.value) || undefined
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specifications.hasWifi || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          hasWifi: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">WiFi Disponível</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specifications.hasProjector || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          hasProjector: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Projetor Incluído</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
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
                    <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
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

export default ResourceManagement;