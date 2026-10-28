import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface SignUpResult {
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'orbit_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // 1. Check if demo session is stored
    const storedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setUser(parsed);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    // 2. Real Supabase Auth listener
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session from Supabase local storage
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        setUser(formatSupabaseUser(initialSession.user));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Subscribe to auth state updates (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(formatSupabaseUser(currentSession.user));
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      } else if (!isDemoUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoUser]);

  const formatSupabaseUser = (sbUser: User): UserProfile => {
    const fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Explorer';
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name: fullName,
      avatarUrl: sbUser.user_metadata?.avatar_url,
    };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not configured.',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && data.session) {
        setUser(formatSupabaseUser(data.user));
        setSession(data.session);
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not configured.',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name?.trim() || cleanEmail.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Check if Supabase created a user without a session (meaning email confirmation is required)
      const requiresEmailConfirmation = Boolean(data.user && !data.session);

      if (data.user && data.session) {
        setUser(formatSupabaseUser(data.user));
        setSession(data.session);
        setIsDemoUser(false);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }

      return { error: null, requiresEmailConfirmation };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred during sign up' };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to resend confirmation email.' };
    }
  };

  const signOut = async () => {
    if (isDemoUser) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
      setIsDemoUser(false);
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const enterDemoMode = () => {
    const demoUser: UserProfile = {
      id: 'demo-user-123',
      email: 'alex@orbit.os',
      name: 'Alex Vance',
    };
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signUp,
        resendConfirmation,
        signOut,
        enterDemoMode,
        isDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
