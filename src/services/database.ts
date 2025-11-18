import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Tables = Database['public']['Tables']
type Resource = Tables['resources']['Row']
type Reservation = Tables['reservations']['Row']
type MaintenanceTask = Tables['maintenance_tasks']['Row']
type UserProfile = Tables['users']['Row']
type Message = Tables['messages']['Row']
type ResourcePackage = Tables['resource_packages']['Row']
type PackageResource = Tables['package_resources']['Row']
type PasswordResetRequest = Tables['password_reset_requests']['Row']

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
  ): Promise<{
    hasConflict: boolean;
    totalQuantity: number;
    reservedSlots: number;
    availableSlots: number;
  }> {
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
    const availableSlots = Math.max(0, resource.quantity - overlappingReservationsCount);
    const hasConflict = availableSlots <= 0;

    const result = {
      hasConflict,
      totalQuantity: resource.quantity,
      reservedSlots: overlappingReservationsCount,
      availableSlots
    };

    console.log('Availability check result:', result);

    return result;
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
    try {
      console.log('usersService.getProfile: Fetching profile for userId:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('usersService.getProfile: Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === 'PGRST116') {
          console.log('usersService.getProfile: Profile not found (PGRST116) for user:', userId);
          return null;
        }

        if (error.code === 'PGRST301') {
          console.error('usersService.getProfile: RLS policy error (PGRST301) - checking session...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Current session:', session ? 'exists' : 'missing', session?.user?.id);
          return null;
        }

        throw error;
      }

      console.log('usersService.getProfile: Success -', data ? `found profile for ${data.email}` : 'no profile found');
      return data;
    } catch (err: any) {
      console.error('usersService.getProfile: Unexpected error:', {
        name: err?.name,
        message: err?.message,
        code: err?.code
      });
      if (err?.code === 'PGRST116' || err?.code === 'PGRST301') {
        return null;
      }
      throw err;
    }
  },

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      console.log('usersService.getProfileByEmail: Fetching profile for email:', email);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (error) {
        console.error('usersService.getProfileByEmail: Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === 'PGRST116') {
          console.log('usersService.getProfileByEmail: Profile not found (PGRST116) for email:', email);
          return null;
        }

        if (error.code === 'PGRST301') {
          console.error('usersService.getProfileByEmail: RLS policy error (PGRST301)');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Current session:', session ? 'exists' : 'missing', session?.user?.email);
          return null;
        }

        throw error;
      }

      console.log('usersService.getProfileByEmail: Success -', data ? `found profile for ${data.email}` : 'no profile found');
      return data;
    } catch (err: any) {
      console.error('usersService.getProfileByEmail: Unexpected error:', {
        name: err?.name,
        message: err?.message,
        code: err?.code
      });
      if (err?.code === 'PGRST116' || err?.code === 'PGRST301') {
        return null;
      }
      throw err;
    }
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
    try {
      console.log('usersService.getAll: Starting query...');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) {
        console.error('usersService.getAll: Supabase error:', error);
        console.error('usersService.getAll: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        if (error.code === 'PGRST301') {
          console.error('RLS policy blocking access - user may not have permission');
          return [];
        }

        throw error;
      }

      console.log('usersService.getAll: Query successful, rows:', data?.length || 0);
      return data || []
    } catch (err: any) {
      console.error('usersService.getAll: Unexpected error:', err);
      if (err?.code === 'PGRST301' || err?.message?.includes('permission')) {
        console.log('Returning empty array due to permission error');
        return [];
      }
      throw err;
    }
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

// Resource Packages
export const packagesService = {
  async getAll(): Promise<ResourcePackage[]> {
    const { data, error } = await supabase
      .from('resource_packages')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<ResourcePackage | null> {
    const { data, error } = await supabase
      .from('resource_packages')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getPackageResources(packageId: string): Promise<(PackageResource & { resource: Resource })[]> {
    const { data, error } = await supabase
      .from('package_resources')
      .select(`
        *,
        resource:resources(*)
      `)
      .eq('package_id', packageId)
    
    if (error) throw error
    return data || []
  },

  async create(packageData: Tables['resource_packages']['Insert']): Promise<ResourcePackage> {
    const { data, error } = await supabase
      .from('resource_packages')
      .insert(packageData)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to create resource package - no data returned')
    return data
  },

  async addResourceToPackage(
    packageId: string, 
    resourceId: string, 
    quantityNeeded: number = 1
  ): Promise<PackageResource> {
    const { data, error } = await supabase
      .from('package_resources')
      .insert({
        package_id: packageId,
        resource_id: resourceId,
        quantity_needed: quantityNeeded
      })
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to add resource to package - no data returned')
    return data
  },

  async removeResourceFromPackage(packageId: string, resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('package_resources')
      .delete()
      .eq('package_id', packageId)
      .eq('resource_id', resourceId)
    
    if (error) throw error
  },

  async update(id: string, updates: Tables['resource_packages']['Update']): Promise<ResourcePackage> {
    const { data, error } = await supabase
      .from('resource_packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    
    if (error) throw error
    if (!data) throw new Error('Failed to update resource package - no data returned')
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('resource_packages')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async checkPackageAvailability(
    packageId: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; conflicts: string[] }> {
    // Obter recursos do pacote
    const packageResources = await this.getPackageResources(packageId)
    const conflicts: string[] = []
    
    // Verificar disponibilidade de cada recurso
    for (const packageResource of packageResources) {
      const hasConflict = await reservationsService.checkConflict(
        packageResource.resource_id,
        startDate,
        endDate
      )
      
      if (hasConflict) {
        conflicts.push(packageResource.resource.name)
      }
    }
    
    return {
      available: conflicts.length === 0,
      conflicts
    }
  },

  async createPackageReservation(
    packageId: string,
    userId: string,
    startDate: string,
    endDate: string,
    purpose: string,
    description?: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<Reservation[]> {
    // Verificar disponibilidade primeiro
    const availability = await this.checkPackageAvailability(packageId, startDate, endDate)
    
    if (!availability.available) {
      throw new Error(`Recursos não disponíveis: ${availability.conflicts.join(', ')}`)
    }
    
    // Obter recursos do pacote
    const packageResources = await this.getPackageResources(packageId)
    const createdReservations: Reservation[] = []
    
    // Criar reserva para cada recurso do pacote
    for (const packageResource of packageResources) {
      try {
        const reservation = await reservationsService.create({
          user_id: userId,
          resource_id: packageResource.resource_id,
          start_date: startDate,
          end_date: endDate,
          purpose: `${purpose} (Pacote)`,
          description: description || `Reserva automática do pacote de recursos`,
          status: 'pending',
          priority
        })
        
        createdReservations.push({
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
        })
      } catch (error) {
        // Se falhar em criar uma reserva, cancelar todas as anteriores
        for (const createdReservation of createdReservations) {
          await reservationsService.delete(createdReservation.id)
        }
        throw new Error(`Falha ao criar reserva para ${packageResource.resource.name}: ${error}`)
      }
    }
    
    return createdReservations
  }
}

// Password Reset Requests
export const passwordResetRequestsService = {
  async createRequest(userEmail: string, userName: string, userId?: string): Promise<PasswordResetRequest> {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .insert({
        user_id: userId || null,
        user_email: userEmail,
        user_name: userName,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create password reset request - no data returned')
    return data
  },

  async getAllPendingRequests(): Promise<PasswordResetRequest[]> {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getAllRequests(): Promise<PasswordResetRequest[]> {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('requested_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getUserRequests(userId: string): Promise<PasswordResetRequest[]> {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async updateRequestStatus(
    requestId: string, 
    status: 'pending' | 'completed' | 'rejected',
    processedBy?: string,
    notes?: string
  ): Promise<PasswordResetRequest> {
    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (processedBy) {
      updateData.processed_by = processedBy
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from('password_reset_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Failed to update password reset request - no data returned')
    return data
  },

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('No active session')
    }

    const apiUrl = `${supabaseUrl}/functions/v1/reset-password`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        userId,
        newPassword
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to reset password')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to reset password')
    }
  },

  async deleteRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('password_reset_requests')
      .delete()
      .eq('id', requestId)
    
    if (error) throw error
  }
}