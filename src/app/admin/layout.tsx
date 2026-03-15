'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useAuth, getRoleBasePath, isRoleAllowedForPath } from '@/hooks/use-auth';
import { LoadingPage } from '@/hooks/use-supabase';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: 'equipe' },
  { label: 'Commissions', href: '/admin/commissions', icon: 'commissions' },
  { label: 'Produits', href: '/admin/produits', icon: 'offres' },
  { label: 'Tournees', href: '/admin/tournees', icon: 'tournee' },
  { label: 'Preparation', href: '/admin/preparation', icon: 'historique' },
  { label: 'Roles', href: '/admin/roles', icon: 'offres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingPage />;

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isRoleAllowedForPath(user.role, '/admin')) {
    router.push(getRoleBasePath(user.role));
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Admin" titleColor="text-purple-400" items={sidebarItems} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
