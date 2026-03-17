'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useAuth, getRoleBasePath, isRoleAllowedForPath } from '@/hooks/use-auth';
import { LoadingPage } from '@/hooks/use-supabase';

const livreurItems = [
  { label: 'Dashboard', href: '/livreur/dashboard', icon: 'dashboard' },
  { label: 'Ma Tournée', href: '/livreur/tournee', icon: 'tournee' },
  { label: 'Cash', href: '/livreur/cash', icon: 'cash' },
  { label: 'Retours', href: '/livreur/retours', icon: 'retours' },
  { label: 'Historique', href: '/livreur/historique', icon: 'historique' },
];

const responsableItems = [
  { label: 'Dashboard', href: '/livreur/dashboard', icon: 'dashboard' },
  { label: 'Gestion Tournées', href: '/livreur/gestion-tournees', icon: 'tournee' },
  { label: 'Validation Cash', href: '/livreur/validation-cash', icon: 'cash' },
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

  const isResponsable = user.role === 'responsable_logistique';
  const sidebarItems = isResponsable ? responsableItems : livreurItems;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        title={isResponsable ? 'Logistique' : 'Livreur'}
        titleColor="text-green-600"
        accentColor="bg-green-500"
        items={sidebarItems}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto bg-[#f5f6fa]">{children}</main>
      </div>
    </div>
  );
}
