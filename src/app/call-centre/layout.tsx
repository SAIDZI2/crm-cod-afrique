'use client';

import { Sidebar } from '@/components/sidebar';

const sidebarItems = [
  { label: 'Dashboard', href: '/call-centre/dashboard', icon: 'dashboard' },
  { label: "File d'Appels", href: '/call-centre/file-appels', icon: 'file-appels' },
  { label: 'Rappels', href: '/call-centre/rappels', icon: 'rappels' },
  { label: 'Statistiques', href: '/call-centre/statistiques', icon: 'statistiques' },
];

export default function CallCentreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Call Centre" titleColor="text-blue-400" items={sidebarItems} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
