import React, { useState, useEffect } from 'react';
import { Search, Plus, CreditCard as Edit, Trash2, Package, BookOpen, Users, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { packagesService, resourcesService } from '../services/database';
import { useUser } from '../context/UserContext';

interface ResourcePackage {
  id: string;
  name: string;
  description: string;
  subject: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PackageResource {
  id: string;
  package_id: string;
  resource_id: string;
  quantity_needed: number;
  resource?: {
    id: string;
    name: string;
    category: string;
    location: string;
    quantity: number;
  };
}

const PackageManagement = () => {
  const { user } = useUser();
  
  // Ensure only admins and faculty can access this page
  if (user?.role !== 'admin' && user?.role !== 'faculty') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para visualizar esta página.</p>
        </div>
      </div>
    );
  }

  const [packages, setPackages] = useState<ResourcePackage[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    resources: [] as { resourceId: string; quantity: number }[]
  });

  const subjects = [
    'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia',
    'Literatura', 'Inglês', 'Educação Física', 'Arte', 'Música', 'Informática'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, resourcesData] = await Promise.all([
        packagesService.getAll(),
        resourcesService.getAll()
      ]);
      setPackages(packagesData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadPackageResources = async (packageId: string): Promise<PackageResource[]> => {
    try {
      return await packagesService.getPackageResources(packageId);
    } catch (error) {
      console.error('Error loading package resources:', error);
      return [];
    }
  };

  const togglePackageExpansion = async (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      resources: []
    });
    setEditingPackage(null);
    setShowForm(false);
  };

  const handleEdit = async (pkg: ResourcePackage) => {
    try {
      const packageResources = await loadPackageResources(pkg.id);
      setFormData({
        name: pkg.name,
        description: pkg.description,
        subject: pkg.subject,
        resources: packageResources.map(pr => ({
          resourceId: pr.resource_id,
          quantity: pr.quantity_needed
        }))
      });
      setEditingPackage(pkg.id);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading package for editing:', error);
      alert('Erro ao carregar pacote para edição.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        // TODO: Implement update functionality
        alert('Funcionalidade de edição será implementada em breve.');
      } else {
        // Create new package
        const newPackage = await packagesService.create({
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          created_by: user.id
        });

        // Add resources to package
        for (const resource of formData.resources) {
          await packagesService.addResourceToPackage(
            newPackage.id,
            resource.resourceId,
            resource.quantity
          );
        }

        alert('Pacote criado com sucesso!');
        loadData();
      }
      resetForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Erro ao salvar pacote. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o pacote "${name}"?`)) {
      try {
        await packagesService.delete(id);
        alert('Pacote excluído com sucesso!');
        loadData();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Erro ao excluir pacote. Tente novamente.');
      }
    }
  };

  const addResourceToForm = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { resourceId: '', quantity: 1 }]
    }));
  };

  const removeResourceFromForm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const updateResourceInForm = (index: number, field: 'resourceId' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || pkg.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pacotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Pacotes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Crie e gerencie pacotes de recursos por assunto</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Criar Pacote</span>
            <span className="sm:hidden">Criar</span>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Pacotes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{packages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Assuntos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {new Set(packages.map(p => p.subject)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-xl">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Meus Pacotes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {packages.filter(p => p.created_by === user?.id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Recursos Únicos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{resources.length}</p>
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
              placeholder="Buscar pacotes..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Assuntos</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        {filteredPackages.map((pkg) => {
          const isExpanded = expandedPackages.has(pkg.id);
          
          return (
            <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{pkg.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {pkg.subject}
                      </span>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-600 mb-3">{pkg.description}</p>
                    
                    <div className="text-xs sm:text-sm text-gray-500">
                      Criado em {new Date(pkg.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => togglePackageExpansion(pkg.id)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {(user?.role === 'admin' || pkg.created_by === user?.id) && (
                      <>
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <PackageResourcesList packageId={pkg.id} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pacote encontrado</h3>
          <p className="text-gray-600">Tente ajustar seus critérios de busca ou crie um novo pacote</p>
        </div>
      )}

      {/* Create/Edit Package Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPackage ? 'Editar Pacote' : 'Criar Novo Pacote'}
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
                      Nome do Pacote *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um assunto</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Recursos do Pacote
                    </label>
                    <button
                      type="button"
                      onClick={addResourceToForm}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Recurso</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.resources.map((resource, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <select
                          value={resource.resourceId}
                          onChange={(e) => updateResourceInForm(index, 'resourceId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecione um recurso</option>
                          {resources.map((res) => (
                            <option key={res.id} value={res.id}>
                              {res.name} - {res.location} (Qtd: {res.quantity})
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          min="1"
                          value={resource.quantity}
                          onChange={(e) => updateResourceInForm(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Qtd"
                        />
                        
                        <button
                          type="button"
                          onClick={() => removeResourceFromForm(index)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {formData.resources.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Nenhum recurso adicionado. Clique em "Adicionar Recurso" para começar.
                    </p>
                  )}
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
                    disabled={isSubmitting || formData.resources.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? 'Salvando...' : 'Salvar Pacote'}</span>
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

// Component to display package resources
const PackageResourcesList: React.FC<{ packageId: string }> = ({ packageId }) => {
  const [resources, setResources] = useState<PackageResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await packagesService.getPackageResources(packageId);
        setResources(data);
      } catch (error) {
        console.error('Error loading package resources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [packageId]);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Carregando recursos...</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Nenhum recurso encontrado neste pacote.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Recursos incluídos:</h4>
      <div className="space-y-2">
        {resources.map((resource) => (
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
  );
};

export default PackageManagement;