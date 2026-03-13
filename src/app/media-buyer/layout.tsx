'use client';

import { Sidebar } from '@/components/sidebar';

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
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar title="Media Buyer" titleColor="text-orange-400" items={sidebarItems} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
