import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'student' | 'faculty' | 'admin'
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'student' | 'faculty' | 'admin'
          department: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'student' | 'faculty' | 'admin'
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          category: 'rooms' | 'equipment' | 'av'
          description: string
          status: 'available' | 'reserved' | 'maintenance'
          location: string
          image: string
          quantity: number
          specifications: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'rooms' | 'equipment' | 'av'
          description: string
          status?: 'available' | 'reserved' | 'maintenance'
          location: string
          image: string
          quantity?: number
          specifications?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'rooms' | 'equipment' | 'av'
          description?: string
          status?: 'available' | 'reserved' | 'maintenance'
          location?: string
          image?: string
          quantity?: number
          specifications?: any
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          start_date: string
          end_date: string
          purpose: string
          description: string | null
          status: 'pending' | 'approved' | 'rejected'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          attendees: number | null
          requirements: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          start_date: string
          end_date: string
          purpose: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          attendees?: number | null
          requirements?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          start_date?: string
          end_date?: string
          purpose?: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          attendees?: number | null
          requirements?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_tasks: {
        Row: {
          id: string
          resource_id: string
          type: 'routine' | 'repair' | 'inspection' | 'upgrade'
          title: string
          description: string
          scheduled_date: string
          estimated_duration: number
          status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to: string | null
          cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          type: 'routine' | 'repair' | 'inspection' | 'upgrade'
          title: string
          description: string
          scheduled_date: string
          estimated_duration: number
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          type?: 'routine' | 'repair' | 'inspection' | 'upgrade'
          title?: string
          description?: string
          scheduled_date?: string
          estimated_duration?: number
          status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          message_text: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          message_text: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          message_text?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}