'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { useAuth, getRoleBasePath, isRoleAllowedForPath } from '@/hooks/use-auth';
import { LoadingPage } from '@/hooks/use-supabase';

const sidebarItems = [
  { label: 'Dashboard', href: '/media-buyer/dashboard', icon: 'dashboard' },
  { label: 'Offres', href: '/media-buyer/offres', icon: 'offres' },
  { label: 'Commandes', href: '/media-buyer/commandes', icon: 'commandes' },
  { label: 'Spend', href: '/media-buyer/spend', icon: 'spend' },
  { label: 'Balance', href: '/media-buyer/balance', icon: 'balance' },
  { label: 'Blacklist', href: '/media-buyer/blacklist', icon: 'blacklist' },
  { label: 'Equipe', href: '/media-buyer/equipe', icon: 'equipe' },
  { label: 'Commissions', href: '/media-buyer/commissions', icon: 'commissions' },
];

export default function MediaBuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingPage />;

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isRoleAllowedForPath(user.role, '/media-buyer')) {
    router.push(getRoleBasePath(user.role));
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Media Buyer" titleColor="text-orange-400" items={sidebarItems} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
