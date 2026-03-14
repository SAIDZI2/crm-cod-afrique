'use client';

import { Sidebar } from '@/components/sidebar';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: 'equipe' },
  { label: 'Commissions', href: '/admin/commissions', icon: 'commissions' },
  { label: 'Rôles', href: '/admin/roles', icon: 'offres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Admin" titleColor="text-purple-400" items={sidebarItems} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
