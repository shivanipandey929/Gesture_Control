import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthResponse {
  error: AuthError | Error | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  continueAsGuest: () => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
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

    // Check active session from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      } else {
        const mode = localStorage.getItem('aerotouch_auth_mode');
        setIsGuest(mode !== 'authenticated');
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
      setIsGuest(true);
    });

    // Listen for auth state changes (e.g. login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
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

  const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    if (!supabase) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
      };
    }

    try {
      const res = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (res.error) {
        return { error: res.error };
      }

      if (res.data.session) {
        setSession(res.data.session);
        setUser(res.data.user);
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<AuthResponse> => {
    if (!supabase) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
      };
    }

    try {
      const trimmedEmail = email.trim();
      const res = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: displayName?.trim() || trimmedEmail.split('@')[0]
          },
        },
      });

      if (res.error) {
        return { error: res.error };
      }

      // Check if user already exists (Supabase returns empty identities array when user already exists and email confirm is on)
      if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
        return {
          error: new Error('An account with this email already exists. Please switch to Sign In.')
        };
      }

      // If Supabase requires email confirmation, session will be null
      if (res.data.user && !res.data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      // If auto-confirmed
      if (res.data.session) {
        setSession(res.data.session);
        setUser(res.data.user);
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      }

      return { error: null, needsEmailConfirmation: false };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const res = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/studio` : undefined,
        },
      });
      return { error: res.error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
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
