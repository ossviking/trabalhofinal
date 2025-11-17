import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { usersService } from '../services/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: supabaseUser, loading: authLoading, signIn: supabaseSignIn, signOut: supabaseSignOut } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Combined loading state: true if either auth is loading OR profile is loading
  const loading = authLoading || profileLoading;

  // Load user profile when Supabase user changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (authLoading) {
        return;
      }

      setProfileLoading(true);

      if (supabaseUser) {
        try {
          console.log('UserContext: Loading profile for user:', supabaseUser.id, supabaseUser.email);

          let profile = await usersService.getProfile(supabaseUser.id);

          if (profile) {
            console.log('UserContext: Profile found:', profile.email, profile.role);
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              department: profile.department
            });
          } else {
            console.log('UserContext: Profile not found for ID, checking by email');
            const existingProfile = await usersService.getProfileByEmail((supabaseUser.email || '').toLowerCase());

            if (existingProfile) {
              console.log('UserContext: Found profile by email:', existingProfile.email);
              setUser({
                id: existingProfile.id,
                name: existingProfile.name,
                email: existingProfile.email,
                role: existingProfile.role,
                department: existingProfile.department
              });
            } else {
              console.log('UserContext: No profile found - trigger should have created one. Waiting for sync...');
              setUser(null);
            }
          }
        } catch (error: any) {
          console.error('UserContext: Error loading profile:', error);
          setUser(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        console.log('UserContext: No authenticated user');
        setUser(null);
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [supabaseUser, authLoading]);

  const signIn = async (email: string, password: string) => {
    const result = await supabaseSignIn(email, password);
    return result;
  };

  const signOut = async () => {
    const result = await supabaseSignOut();
    if (!result.error) {
      setUser(null);
    }
    return result;
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedProfile = await usersService.updateProfile(user.id, updates);
    setUser({
      id: updatedProfile.id,
      name: updatedProfile.name,
      email: updatedProfile.email,
      role: updatedProfile.role,
      department: updatedProfile.department
    });
  };

  return (
    <UserContext.Provider value={{ user, loading, signIn, signOut, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};