import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Tables = Database['public']['Tables']
type Resource = Tables['resources']['Row']
type Reservation = Tables['reservations']['Row']
type MaintenanceTask = Tables['maintenance_tasks']['Row']
type UserProfile = Tables['users']['Row']
type Message = Tables['messages']['Row']

// Resources
export const resourcesService = {
  async getAll(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(resource: Tables['resources']['Insert']): Promise<Resource> {
    console.log('Creating resource with data:', resource);
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Supabase error creating resource:', error);
      throw error;
    }
    if (!data) throw new Error('Failed to create resource - no data returned')
    console.log('Resource created successfully:', data);
    return data
  },

  async update(id: string, updates: Tables['resources']['Update']): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to update resource - no data returned')
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Reservations
export const reservationsService = {
  async getAll(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(reservation: Tables['reservations']['Insert']): Promise<Reservation> {
    console.log('Database service creating reservation:', reservation);
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Supabase error creating reservation:', error);
      throw error;
    }
    if (!data) throw new Error('Failed to create reservation - no data returned')
    
    console.log('Reservation created in database:', data);
    return data
  },

  async updateStatus(
    id: string, 
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<Reservation> {
    const { data, error, count } = await supabase
      .from('reservations')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Reserva não encontrada ou você não tem permissão para atualizá-la. Verifique se você tem as permissões necessárias.')
      }
      throw error
    }
    if (!data) throw new Error('Falha ao atualizar status da reserva - nenhum dado retornado')
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async checkConflict(
    resourceId: string, 
    startDate: string, 
    endDate: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    console.log('Checking reservation availability for:', { resourceId, startDate, endDate, excludeReservationId });
    
    // First, get the resource to check its quantity
    const resource = await resourcesService.getById(resourceId);
    if (!resource) {
      console.error('Resource not found:', resourceId);
      throw new Error('Recurso não encontrado');
    }
    
    console.log('Resource quantity:', resource.quantity);
    
    // Count existing overlapping reservations
    let query = supabase
      .from('reservations')
      .select('id, start_date, end_date, status', { count: 'exact' })
      .eq('resource_id', resourceId)
      .in('status', ['pending', 'approved']) // Only check active reservations
      .lt('start_date', endDate)
      .gt('end_date', startDate); // Check for overlap: start_date < endDate AND end_date > startDate
    
    // Exclude current reservation if editing
    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error checking reservation conflict:', error);
      throw error;
    }
    
    const overlappingReservationsCount = count || 0;
    const hasConflict = overlappingReservationsCount >= resource.quantity;
    
    console.log('Availability check result:', { 
      overlappingReservationsCount, 
      resourceQuantity: resource.quantity,
      hasConflict,
      availableSlots: resource.quantity - overlappingReservationsCount
    });
    
    return hasConflict;
  }
}

// Maintenance Tasks
export const maintenanceService = {
  async getAll(): Promise<MaintenanceTask[]> {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('scheduled_date')
    
    if (error) throw error
    return data || []
  },

  async create(task: Tables['maintenance_tasks']['Insert']): Promise<MaintenanceTask> {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert(task)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to create maintenance task - no data returned')
    return data
  },

  async updateStatus(
    id: string, 
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<MaintenanceTask> {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to update maintenance task status - no data returned')
    return data
  }
}

// User Profiles
export const usersService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async createProfile(profile: Tables['users']['Insert']): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...profile,
        email: profile.email.toLowerCase()
      })
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to create user profile - no data returned')
    return data
  },

  async updateProfile(userId: string, updates: Tables['users']['Update']): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to update user profile - no data returned')
    return data
  },

  async getAll(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }
}

// Messages
export const messagesService = {
  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, email, role),
        receiver:users!receiver_id(id, name, email, role)
      `)
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async sendMessage(senderId: string, receiverId: string, messageText: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: messageText
      })
      .select(`
        *,
        sender:users!sender_id(id, name, email, role),
        receiver:users!receiver_id(id, name, email, role)
      `)
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Failed to send message - no data returned')
    return data
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getChatParticipantsForUser(userId: string): Promise<UserProfile[]> {
    // Get all users that have exchanged messages with the current user
    const { data, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        receiver_id,
        sender:users!sender_id(id, name, email, role),
        receiver:users!receiver_id(id, name, email, role)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    if (error) throw error
    
    // Extract unique participants (excluding the current user)
    const participants = new Map<string, UserProfile>()
    
    data?.forEach(message => {
      if (message.sender_id !== userId && message.sender) {
        participants.set(message.sender_id, message.sender as UserProfile)
      }
      if (message.receiver_id !== userId && message.receiver) {
        participants.set(message.receiver_id, message.receiver as UserProfile)
      }
    })
    
    return Array.from(participants.values()).sort((a, b) => a.name.localeCompare(b.name))
  },

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        callback
      )
      .subscribe()
  },

  async getLastMessageBetweenUsers(user1Id: string, user2Id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, email, role),
        receiver:users!receiver_id(id, name, email, role)
      `)
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  }
}