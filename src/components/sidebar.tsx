'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign, Wallet,
  Ban, Users, Percent, Phone, ListTodo, Clock, BarChart3,
  Truck, MapPin, Banknote, RotateCcw, History, LogOut, UserCircle
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  offres: Package,
  commandes: ShoppingCart,
  spend: DollarSign,
  balance: Wallet,
  blacklist: Ban,
  equipe: Users,
  commissions: Percent,
  'file-appels': Phone,
  'commande': ListTodo,
  rappels: Clock,
  statistiques: BarChart3,
  tournee: Truck,
  colis: MapPin,
  cash: Banknote,
  retours: RotateCcw,
  historique: History,
};

interface SidebarProps {
  title: string;
  titleColor: string;
  items: { label: string; href: string; icon: string }[];
}

export function Sidebar({ title, titleColor, items }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-gray-950 text-white flex flex-col">
      <div className={`p-6 border-b border-gray-800`}>
        <h1 className={`text-lg font-bold ${titleColor}`}>{title}</h1>
        <p className="text-xs text-gray-400 mt-1">CRM COD Afrique</p>
        {user && (
          <p className="text-xs text-gray-500 mt-2 truncate">{user.nom}</p>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-gray-800 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-2 text-sm w-full px-1 py-1 rounded transition-colors',
            pathname === '/profile'
              ? 'text-white font-medium'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <UserCircle className="w-4 h-4" />
          Mon Profil
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-1 py-1"
        >
          <LogOut className="w-4 h-4" />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
