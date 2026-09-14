'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, password?: string, roleHint?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile from user_profiles table
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('auth_user_id', session.user.id)
              .single();

            if (profile) {
              setCurrentUser(profile);
            } else {
              // Fallback profile if record is being created
              setCurrentUser({
                id: session.user.id,
                auth_user_id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: (session.user.user_metadata?.role as UserRole) || 'student',
                status: 'active',
                created_at: new Date().toISOString(),
              });
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          // Check local stored session
          const stored = localStorage.getItem('he_session_user');
          if (stored) {
            setCurrentUser(JSON.parse(stored));
          } else {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes if Supabase is active
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await client
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
          }
        } else {
          setCurrentUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (
    identifier: string,
    password?: string,
    roleHint?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanIdentifier = identifier.trim();

      // 1. Try Supabase Auth first if configured
      if (isSupabaseConfigured && supabase && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanIdentifier,
            password,
          });

          if (!error && data?.user) {
            // Fetch user profile from Supabase
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('auth_user_id', data.user.id)
              .single();

            if (profile) {
              setCurrentUser(profile);
              redirectToRoleDashboard(profile.role);
              return { success: true };
            }
          }
        } catch {
          // Supabase cloud sign-in didn't match, continue to local database fallback
        }
      }

      // 2. Local institutional database lookup via API route
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdentifier, roleHint }),
      });
      const authData = await res.json();

      if (authData.success && authData.user) {
        setCurrentUser(authData.user);
        localStorage.setItem('he_session_user', JSON.stringify(authData.user));
        redirectToRoleDashboard(authData.user.role);
        return { success: true };
      }

      return { success: false, error: authData.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });
        if (error) return { success: false, error: error.message };

        if (data.user) {
          // Insert into user_profiles
          await supabase.from('user_profiles').insert({
            auth_user_id: data.user.id,
            name,
            email,
            role,
            status: 'active',
          });
        }
      }

      const userProfile: UserProfile = {
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      setCurrentUser(userProfile);
      localStorage.setItem('he_session_user', JSON.stringify(userProfile));
      redirectToRoleDashboard(role);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('he_session_user');
      setCurrentUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const redirectToRoleDashboard = (userRole: UserRole) => {
    if (userRole === 'admin') router.push('/admin/dashboard');
    else if (userRole === 'lecturer') router.push('/lecturer/dashboard');
    else router.push('/student/dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isLoading,
        isSupabaseConnected: isSupabaseConfigured,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
