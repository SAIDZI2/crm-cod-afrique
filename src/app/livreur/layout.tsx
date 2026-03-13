'use client';

import { Sidebar } from '@/components/sidebar';

const sidebarItems = [
  { label: 'Dashboard', href: '/livreur/dashboard', icon: 'dashboard' },
  { label: 'Ma Tournee', href: '/livreur/tournee', icon: 'tournee' },
  { label: 'Cash', href: '/livreur/cash', icon: 'cash' },
  { label: 'Retours', href: '/livreur/retours', icon: 'retours' },
  { label: 'Historique', href: '/livreur/historique', icon: 'historique' },
];

export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Livreur" titleColor="text-green-400" items={sidebarItems} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
