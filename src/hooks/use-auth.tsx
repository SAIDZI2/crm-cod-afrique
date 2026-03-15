'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        // Use getUser() (server validation) instead of getSession() (local cache)
        // This is more reliable when navigator.locks is bypassed
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!authUser?.email) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: crmUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (!cancelled) {
          setUser(crmUser as User | null);
        }
      } catch (err) {
        console.error('Auth error:', err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;

      // Only clear user on explicit sign-out
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }

      // For INITIAL_SESSION, loadProfile already handles it — skip to avoid race
      if (event === 'INITIAL_SESSION') return;

      // For TOKEN_REFRESHED, SIGNED_IN, etc. — update user if we have a valid session
      if (session?.user?.email) {
        const { data: crmUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        // Only update if we got a valid CRM user — don't clear on transient failures
        if (!cancelled && crmUser) {
          setUser(crmUser as User);
        }
      }
      // If session is null for non-SIGNED_OUT events, keep the current user
      // (handles transient null sessions during token refresh without locks)
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        const { data: crmUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        if (crmUser) setUser(crmUser as User);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getRoleBasePath(role: UserRole): string {
  const map: Record<UserRole, string> = {
    media_buyer: '/media-buyer/dashboard',
    call_center: '/call-centre/dashboard',
    livreur: '/livreur/dashboard',
    admin: '/admin',
    superviseur_cc: '/call-centre/dashboard',
    responsable_logistique: '/livreur/dashboard',
  };
  return map[role] ?? '/login';
}

export function isRoleAllowedForPath(role: UserRole, pathPrefix: string): boolean {
  const rolePathMap: Record<string, UserRole[]> = {
    '/media-buyer': ['media_buyer', 'admin'],
    '/call-centre': ['call_center', 'superviseur_cc', 'admin'],
    '/livreur': ['livreur', 'responsable_logistique', 'admin'],
    '/admin': ['admin'],
  };

  for (const [prefix, allowedRoles] of Object.entries(rolePathMap)) {
    if (pathPrefix.startsWith(prefix)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}
