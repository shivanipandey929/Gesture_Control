import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  continueAsGuest: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('aerotouch_auth_mode') !== 'authenticated';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setIsGuest(true);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      } else {
        setIsGuest(true);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('aerotouch_auth_mode', 'guest');
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured yet. Please provide .env keys.') };
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data.user) {
      setIsGuest(false);
      localStorage.setItem('aerotouch_auth_mode', 'authenticated');
    }
    return { error: res.error };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured yet. Please provide .env keys.') };
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName || email.split('@')[0] },
      },
    });
    if (!res.error && res.data.user) {
      setIsGuest(false);
      localStorage.setItem('aerotouch_auth_mode', 'authenticated');
    }
    return { error: res.error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: new Error('Supabase is not configured yet.') };
    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: res.error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuest(true);
    localStorage.setItem('aerotouch_auth_mode', 'guest');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isGuest,
        isLoading,
        isConfigured: isSupabaseConfigured,
        continueAsGuest,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

