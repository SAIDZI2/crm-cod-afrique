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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.email) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: crmUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        setUser(crmUser as User | null);
      } catch (err) {
        console.error('Auth error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        return;
      }

      if (session?.user?.email) {
        const { data: crmUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        setUser(crmUser as User | null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
