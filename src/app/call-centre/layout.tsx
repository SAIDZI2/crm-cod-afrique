'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useAuth, getRoleBasePath, isRoleAllowedForPath } from '@/hooks/use-auth';
import { LoadingPage } from '@/hooks/use-supabase';

const sidebarItems = [
  { label: 'Dashboard', href: '/call-centre/dashboard', icon: 'dashboard' },
  { label: "File d'Appels", href: '/call-centre/file-appels', icon: 'file-appels' },
  { label: 'Rappels', href: '/call-centre/rappels', icon: 'rappels' },
  { label: 'Statistiques', href: '/call-centre/statistiques', icon: 'statistiques' },
];

export default function CallCentreLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingPage />;

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isRoleAllowedForPath(user.role, '/call-centre')) {
    router.push(getRoleBasePath(user.role));
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        title="Call Centre"
        titleColor="text-blue-600"
        accentColor="bg-blue-500"
        items={sidebarItems}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto bg-[#f5f6fa]">{children}</main>
      </div>
    </div>
  );
}
