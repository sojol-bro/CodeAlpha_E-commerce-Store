import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserAddress } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  jwtToken: string | null;
  profile: UserProfile | null;
  savedAddress: UserAddress | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  handleDirectAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  saveShippingAddress: (addressData: Partial<UserAddress>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; onAdminRouteRedirect?: () => void }> = ({
  children,
  onAdminRouteRedirect,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedAddress, setSavedAddress] = useState<UserAddress | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mio_jwt_token') : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile and addresses from Express/Postgres database
  const syncDatabaseUser = async (authUser: User) => {
    try {
      const email = authUser.email || '';
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
      const res = await fetch(`/api/users/profile?email=${encodeURIComponent(email)}&userId=${authUser.id}&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        if (data.defaultAddress) {
          setSavedAddress(data.defaultAddress);
        }
        // If user has an active cart in database, persist its id
        if (data.cart?.cart?.id) {
          localStorage.setItem('mio_cart_id', data.cart.cart.id);
        }
      }
    } catch (err) {
      console.warn('Could not sync user profile from database:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.access_token) {
        setJwtToken(initialSession.access_token);
        localStorage.setItem('mio_jwt_token', initialSession.access_token);
      }
      if (initialSession?.user) {
        await syncDatabaseUser(initialSession.user);
      }
      setIsLoading(false);
    });

    // 2. Global session persistence using supabase.auth.onAuthStateChange()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.access_token) {
        setJwtToken(currentSession.access_token);
        localStorage.setItem('mio_jwt_token', currentSession.access_token);
      }

      if (currentSession?.user) {
        // Query saved profile and active cart from database
        await syncDatabaseUser(currentSession.user);

        // Check if user is admin
        if (currentSession.user.email === 'sojolislam576@gmail.com') {
          if (onAdminRouteRedirect) {
            onAdminRouteRedirect();
          }
        }
      } else {
        setProfile(null);
        setSavedAddress(null);
        setJwtToken(null);
        localStorage.removeItem('mio_jwt_token');
      }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [onAdminRouteRedirect]);

  // Google OAuth Initiator
  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      const targetRedirect = redirectTo || (typeof window !== 'undefined' ? window.location.origin : '');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetRedirect,
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Task 2: Specific login handler checking exact credentials
  const handleDirectAdminLogin = async (emailInput: string, passInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const exactAdminEmail = 'sojolislam576@gmail.com';
    const exactAdminPass = 'sojol@3997';

    if (cleanEmail === exactAdminEmail && passInput === exactAdminPass) {
      // Authenticate admin session
      const adminSyntheticUser: User = {
        id: 'admin-sojol-3997-verified',
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: 'Sojol Islam (Atelier Director)' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: exactAdminEmail,
        role: 'authenticated',
      };

      setUser(adminSyntheticUser);
      setProfile({
        id: 'admin-sojol-3997-verified',
        email: exactAdminEmail,
        full_name: 'Sojol Islam (Atelier Director)',
        role: 'admin',
      });

      // Synchronize in backend database
      try {
        await fetch(`/api/users/profile?email=${encodeURIComponent(exactAdminEmail)}&name=${encodeURIComponent('Sojol Islam')}`);
      } catch {
        // Ignore network fallback
      }

      // Immediately redirect React router/session to /admin
      if (onAdminRouteRedirect) {
        onAdminRouteRedirect();
      }

      return { success: true };
    }

    // Attempt standard Supabase Auth if not matching hardcoded admin
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passInput,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user?.email === exactAdminEmail) {
        if (onAdminRouteRedirect) {
          onAdminRouteRedirect();
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSavedAddress(null);
  };

  const saveShippingAddress = async (addressData: Partial<UserAddress>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/users/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...addressData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAddress(data.address);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncDatabaseUser(user);
    }
  };

  const authFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
    const token = jwtToken || (typeof window !== 'undefined' ? localStorage.getItem('mio_jwt_token') : null);
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...init, headers });
  };

  const isAdmin = user?.email === 'sojolislam576@gmail.com' || profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        jwtToken,
        profile,
        savedAddress,
        isLoading,
        isAdmin,
        signInWithGoogle,
        handleDirectAdminLogin,
        signOut,
        saveShippingAddress,
        refreshProfile,
        authFetch,
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
