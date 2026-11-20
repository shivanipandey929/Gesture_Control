import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { exportAllUserData, clearAllUserData } from '../db/db';

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
  exitGuestMode: () => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResponse>;
  verifyOtp: (email: string, token: string) => Promise<AuthResponse>;
  resendOtp: (email: string) => Promise<AuthResponse>;
  resetPasswordForEmail: (email: string) => Promise<AuthResponse>;
  updateUserPassword: (newPassword: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  exportUserData: () => Promise<string>;
  deleteAccountAndData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('aerotouch_auth_mode') === 'guest';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setIsGuest(localStorage.getItem('aerotouch_auth_mode') === 'guest');
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      } else {
        const mode = localStorage.getItem('aerotouch_auth_mode');
        setIsGuest(mode === 'guest');
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
      setIsGuest(localStorage.getItem('aerotouch_auth_mode') === 'guest');
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setIsGuest(false);
        localStorage.setItem('aerotouch_auth_mode', 'authenticated');
      } else {
        const mode = localStorage.getItem('aerotouch_auth_mode');
        setIsGuest(mode === 'guest');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('aerotouch_auth_mode', 'guest');
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem('aerotouch_auth_mode');
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    if (!supabase) {
      return {
        error: new Error('Cloud sync service is currently unconfigured. You can continue as a Guest.')
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
        error: new Error('Cloud sync service is currently unconfigured. You can continue as a Guest.')
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

      if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
        return {
          error: new Error('An account with this email already exists. Please switch to Sign in.')
        };
      }

      // If email confirmation is required, session is initially null
      if (res.data.user && !res.data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

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

  const verifyOtp = async (email: string, token: string): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Cloud sync service is unconfigured.') };
    }

    try {
      // First try type 'signup'
      let res = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      });

      // If type 'signup' failed, retry with type 'email' (login/recovery OTP)
      if (res.error) {
        res = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'email',
        });
      }

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

  const resendOtp = async (email: string): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Cloud sync service is unconfigured.') };
    }

    try {
      const res = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      return { error: res.error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Cloud sync service is unconfigured.') };
    }

    try {
      const res = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      return { error: res.error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Cloud sync service is unconfigured.') };
    }

    try {
      const res = await supabase.auth.updateUser({ password: newPassword });
      return { error: res.error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    if (!supabase) {
      return { error: new Error('Google sign-in is not set up yet.') };
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
    setIsGuest(false);
    localStorage.removeItem('aerotouch_auth_mode');
  };

  const exportUserData = async (): Promise<string> => {
    return await exportAllUserData();
  };

  const deleteAccountAndData = async (): Promise<void> => {
    await clearAllUserData();
    await signOut();
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
        exitGuestMode,
        signInWithEmail,
        signUpWithEmail,
        verifyOtp,
        resendOtp,
        resetPasswordForEmail,
        updateUserPassword,
        signInWithGoogle,
        signOut,
        exportUserData,
        deleteAccountAndData,
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
