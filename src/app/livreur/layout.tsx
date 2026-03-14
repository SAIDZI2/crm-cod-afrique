'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useAuth, getRoleBasePath, isRoleAllowedForPath } from '@/hooks/use-auth';
import { LoadingPage } from '@/hooks/use-supabase';

const sidebarItems = [
  { label: 'Dashboard', href: '/livreur/dashboard', icon: 'dashboard' },
  { label: 'Ma Tournee', href: '/livreur/tournee', icon: 'tournee' },
  { label: 'Cash', href: '/livreur/cash', icon: 'cash' },
  { label: 'Retours', href: '/livreur/retours', icon: 'retours' },
  { label: 'Historique', href: '/livreur/historique', icon: 'historique' },
];

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingPage />;

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isRoleAllowedForPath(user.role, '/livreur')) {
    router.push(getRoleBasePath(user.role));
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Livreur" titleColor="text-green-400" items={sidebarItems} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
