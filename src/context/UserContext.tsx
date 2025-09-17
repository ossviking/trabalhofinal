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
      // Only start loading profile if auth loading is complete
      if (authLoading) return;
      
      setProfileLoading(true);
      if (supabaseUser) {
        try {
          // First check if profile exists, if not create it
          let profile = await usersService.getProfile(supabaseUser.id);
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              department: profile.department
            });
          } else {
            // Check if profile exists by email
            const existingProfile = await usersService.getProfileByEmail((supabaseUser.email || '').toLowerCase());
            if (existingProfile) {
              // Profile exists with different ID - attempt to fix automatically
              console.warn('DATA INCONSISTENCY DETECTED - Attempting automatic fix:');
              console.warn(`User profile exists with email ${existingProfile.email} but different ID:`);
              console.warn(`Database profile ID: ${existingProfile.id}`);
              console.warn(`Supabase Auth user ID: ${supabaseUser.id}`);
              
              try {
                // Try to update the existing profile with the correct ID
                console.log('Attempting to fix user ID inconsistency...');
                const updatedProfile = await usersService.updateProfile(existingProfile.id, {
                  id: supabaseUser.id
                });
                
                console.log('User ID inconsistency fixed successfully:', updatedProfile);
                setUser({
                  id: updatedProfile.id,
                  name: updatedProfile.name,
                  email: updatedProfile.email,
                  role: updatedProfile.role,
                  department: updatedProfile.department
                });
              } catch (updateError) {
                console.error('Failed to fix user ID inconsistency automatically:', updateError);
                console.error('MANUAL FIX REQUIRED:');
                console.error('1. Go to your Supabase dashboard');
                console.error('2. Open Table Editor > users table');
                console.error(`3. Find the row with email: ${existingProfile.email}`);
                console.error(`4. Update the "id" field to: ${supabaseUser.id}`);
                console.error('5. OR delete the row and try logging in again');
                
                // Force complete logout to clean session and prevent further errors
                setUser(null);
                try {
                  await supabaseSignOut();
                  console.log('User signed out due to unfixable data inconsistency');
                } catch (signOutError) {
                  console.error('Error signing out user:', signOutError);
                }
              }
            } else {
              // Create profile if it doesn't exist
              const profileData = {
                id: supabaseUser.id,
                email: (supabaseUser.email || '').toLowerCase(),
                name: supabaseUser.user_metadata?.name || 'Usuário',
                role: (supabaseUser.email?.toLowerCase().includes('miguel.oliveira') ? 'admin' : 'student') as 'student' | 'faculty' | 'admin',
                department: supabaseUser.user_metadata?.department || 'Geral'
              };
              
              console.log('UserContext: Creating new profile with data:', profileData);
              const newProfile = await usersService.createProfile(profileData);
              console.log('UserContext: Profile created successfully:', newProfile);
              setUser({
                id: newProfile.id,
                name: newProfile.name,
                email: newProfile.email,
                role: newProfile.role,
                department: newProfile.department
              });
            }
          }
        } catch (error) {
          console.error('UserContext: Error loading user profile:', error);
          // If there's an error loading/creating profile, set user to null
          setUser(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
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