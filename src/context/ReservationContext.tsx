import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resourcesService, reservationsService, maintenanceService, packagesService } from '../services/database';
import { useUser } from './UserContext';

interface Resource {
  id: string;
  name: string;
  category: 'rooms' | 'equipment' | 'av';
  description: string;
  status: 'available' | 'reserved' | 'maintenance';
  location: string;
  image: string;
  specifications?: {
    capacity?: number;
    hasWifi?: boolean;
    hasProjector?: boolean;
    [key: string]: any;
  };
}

interface Reservation {
  id: string;
  userId: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attendees?: number;
  requirements?: string;
}

interface MaintenanceTask {
  id: string;
  resourceId: string;
  type: 'routine' | 'repair' | 'inspection' | 'upgrade';
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  cost?: number;
  notes?: string;
}

interface ResourcePackage {
  id: string;
  name: string;
  description: string;
  subject: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ReservationContextType {
  resources: Resource[];
  reservations: Reservation[];
  maintenanceTasks: MaintenanceTask[];
  resourcePackages: ResourcePackage[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addReservation: (reservation: Reservation) => void;
  addPackageReservation: (packageId: string, startDate: string, endDate: string, purpose: string, description?: string) => Promise<void>;
  updateReservationStatus: (id: string, status: 'approved' | 'rejected', comments?: string) => void;
  addResource: (resource: Omit<Resource, 'id'>) => Promise<void>;
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  addMaintenanceTask: (task: MaintenanceTask) => void;
  updateMaintenanceTaskStatus: (id: string, status: MaintenanceTask['status']) => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};

interface ReservationProviderProps {
  children: ReactNode;
}

export const ReservationProvider: React.FC<ReservationProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [resourcePackages, setResourcePackages] = useState<ResourcePackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load resources (available to all authenticated users)
      const resourcesData = await resourcesService.getAll();
      const formattedResources = resourcesData.map(resource => ({
        id: resource.id,
        name: resource.name,
        category: resource.category,
        description: resource.description,
        status: resource.status,
        location: resource.location,
        image: resource.image,
        quantity: resource.quantity,
        specifications: resource.specifications
      })); 
      setResources(formattedResources);
      
      // Load reservations (user's own or all if admin)
      const reservationsData = (user?.role === 'admin' || user?.role === 'faculty')
        ? await reservationsService.getAll()
        : user
          ? await reservationsService.getByUserId(user.id)
          : [];
      
      const formattedReservations = reservationsData.map(reservation => ({
        id: reservation.id,
        userId: reservation.user_id,
        resourceId: reservation.resource_id,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        purpose: reservation.purpose,
        description: reservation.description || undefined,
        status: reservation.status,
        createdAt: reservation.created_at,
        priority: reservation.priority,
        attendees: reservation.attendees || undefined,
        requirements: reservation.requirements || undefined
      }));
      
      setReservations(formattedReservations);

      // Load maintenance tasks (admin only)
      if (user?.role === 'admin') {
        const maintenanceData = await maintenanceService.getAll();
        const formattedMaintenance = maintenanceData.map(task => ({
          id: task.id,
          resourceId: task.resource_id,
          type: task.type,
          title: task.title,
          description: task.description,
          scheduledDate: task.scheduled_date,
          estimatedDuration: task.estimated_duration,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_to || undefined,
          cost: task.cost ? Number(task.cost) : undefined,
          notes: task.notes || undefined
        }));
        setMaintenanceTasks(formattedMaintenance);
      }

      // Load resource packages (available to all authenticated users)
      const packagesData = await packagesService.getAll();
      setResourcePackages(packagesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setResources([]);
      setReservations([]);
      setMaintenanceTasks([]);
      setResourcePackages([]);
      setLoading(false);
    }
  }, [user]);

  const addReservation = async (reservation: Reservation) => {
    if (!user) return;
    
    try {
      const newReservation = await reservationsService.create({
        user_id: user.id,
        resource_id: reservation.resourceId,
        start_date: reservation.startDate,
        end_date: reservation.endDate,
        purpose: reservation.purpose,
        description: reservation.description || null,
        status: 'pending',
        priority: reservation.priority,
        attendees: reservation.attendees || null,
        requirements: reservation.requirements || null
      });
      
      const formattedReservation = {
        id: newReservation.id,
        userId: newReservation.user_id,
        resourceId: newReservation.resource_id,
        startDate: newReservation.start_date,
        endDate: newReservation.end_date,
        purpose: newReservation.purpose,
        description: newReservation.description || undefined,
        status: newReservation.status,
        createdAt: newReservation.created_at,
        priority: newReservation.priority,
        attendees: newReservation.attendees || undefined,
        requirements: newReservation.requirements || undefined
      };
      
      setReservations(prev => [...prev, formattedReservation]);
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  };

  const addPackageReservation = async (
    packageId: string, 
    startDate: string, 
    endDate: string, 
    purpose: string, 
    description?: string
  ) => {
    if (!user) return;
    
    try {
      const reservations = await packagesService.createPackageReservation(
        packageId,
        user.id,
        startDate,
        endDate,
        purpose,
        description
      );
      
      // Add all created reservations to local state
      const formattedReservations = reservations.map(reservation => ({
        id: reservation.id,
        userId: reservation.user_id,
        resourceId: reservation.resource_id,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        purpose: reservation.purpose,
        description: reservation.description || undefined,
        status: reservation.status,
        createdAt: reservation.created_at,
        priority: reservation.priority,
        attendees: reservation.attendees || undefined,
        requirements: reservation.requirements || undefined
      }));
      
      setReservations(prev => [...prev, ...formattedReservations]);
    } catch (error) {
      console.error('Error creating package reservation:', error);
      throw error;
    }
  };

  const updateReservationStatus = async (id: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      await reservationsService.updateStatus(id, status);
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id 
            ? { ...reservation, status }
            : reservation
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar reserva';
      alert(`Erro: ${errorMessage}`);
      throw error;
    }
  };

  const addMaintenanceTask = async (task: MaintenanceTask) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const newTask = await maintenanceService.create({
        resource_id: task.resourceId,
        type: task.type,
        title: task.title,
        description: task.description,
        scheduled_date: task.scheduledDate,
        estimated_duration: task.estimatedDuration,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assignedTo || null,
        cost: task.cost || null,
        notes: task.notes || null
      });
      
      const formattedTask = {
        id: newTask.id,
        resourceId: newTask.resource_id,
        type: newTask.type,
        title: newTask.title,
        description: newTask.description,
        scheduledDate: newTask.scheduled_date,
        estimatedDuration: newTask.estimated_duration,
        status: newTask.status,
        priority: newTask.priority,
        assignedTo: newTask.assigned_to || undefined,
        cost: newTask.cost ? Number(newTask.cost) : undefined,
        notes: newTask.notes || undefined
      };
      
      setMaintenanceTasks(prev => [...prev, formattedTask]);
    } catch (error) {
      console.error('Error adding maintenance task:', error);
      throw error;
    }
  };

  const updateMaintenanceTaskStatus = async (id: string, status: MaintenanceTask['status']) => {
    try {
      await maintenanceService.updateStatus(id, status);
      setMaintenanceTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, status }
            : task
        )
      );
    } catch (error) {
      console.error('Error updating maintenance task status:', error);
      throw error;
    }
  };

  const addResource = async (resource: Omit<Resource, 'id'>) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Apenas administradores podem adicionar recursos');
    }
    
    try {
      console.log('ReservationContext: Adding resource:', resource);
      const newResource = await resourcesService.create({
        name: resource.name,
        category: resource.category,
        description: resource.description,
        status: resource.status,
        location: resource.location,
        image: resource.image,
        quantity: resource.quantity,
        specifications: resource.specifications
      });
      
      const formattedResource = {
        id: newResource.id,
        name: newResource.name,
        category: newResource.category,
        description: newResource.description,
        status: newResource.status,
        location: newResource.location,
        image: newResource.image,
        quantity: newResource.quantity,
        specifications: newResource.specifications
      };
      
      console.log('ReservationContext: Resource added successfully:', formattedResource);
      setResources(prev => [...prev, formattedResource]);
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Apenas administradores podem atualizar recursos');
    }
    
    try {
      const updatedResource = await resourcesService.update(id, updates);
      
      const formattedResource = {
        id: updatedResource.id,
        name: updatedResource.name,
        category: updatedResource.category,
        description: updatedResource.description,
        status: updatedResource.status,
        location: updatedResource.location,
        image: updatedResource.image,
        quantity: updatedResource.quantity,
        specifications: updatedResource.specifications
      };
      
      setResources(prev => 
        prev.map(resource => 
          resource.id === id ? formattedResource : resource
        )
      );
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  };

  const deleteResource = async (id: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir recursos');
    }
    
    try {
      await resourcesService.delete(id);
      setResources(prev => prev.filter(resource => resource.id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  };
  return (
    <ReservationContext.Provider value={{
      resources,
      reservations,
      maintenanceTasks,
      resourcePackages,
      loading,
      refreshData: loadData,
      addReservation,
      addPackageReservation,
      updateReservationStatus,
      addResource,
      updateResource,
      deleteResource,
      addMaintenanceTask,
      updateMaintenanceTaskStatus
    }}>
      {children}
    </ReservationContext.Provider>
  );
};