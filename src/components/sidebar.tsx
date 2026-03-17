'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign, Wallet,
  Ban, Users, Percent, Phone, ListTodo, Clock, BarChart3,
  Truck, MapPin, Banknote, RotateCcw, History, LogOut, UserCircle,
  Home, Plug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  offres: Package,
  commandes: ShoppingCart,
  spend: DollarSign,
  balance: Wallet,
  blacklist: Ban,
  equipe: Users,
  commissions: Percent,
  'file-appels': Phone,
  commande: ListTodo,
  rappels: Clock,
  statistiques: BarChart3,
  tournee: Truck,
  colis: MapPin,
  cash: Banknote,
  retours: RotateCcw,
  historique: History,
  integration: Plug,
};

interface SidebarProps {
  title: string;
  titleColor: string;
  accentColor?: string;
  items: { label: string; href: string; icon: string }[];
}

function useActiveItem(items: { href: string }[], pathname: string) {
  return (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + '/')) {
      const hasMoreSpecific = items.some(
        (other) =>
          other.href !== href &&
          other.href.length > href.length &&
          (pathname === other.href || pathname.startsWith(other.href + '/'))
      );
      return !hasMoreSpecific;
    }
    return false;
  };
}

export function Sidebar({ title, titleColor, accentColor = 'bg-blue-500', items }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isActive = useActiveItem(items, pathname);

  return (
    <div className="flex h-screen sticky top-0">
      {/* ── Icon Rail ── */}
      <div className="w-[68px] bg-slate-900 flex flex-col items-center py-5 gap-1.5 shrink-0">
        {/* Logo */}
        <div
          className={`w-11 h-11 ${accentColor} rounded-xl flex items-center justify-center mb-5 shadow-lg`}
        >
          <Home className="w-5 h-5 text-white" />
        </div>

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto scrollbar-none">
          {items.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                  active
                    ? `${accentColor} text-white shadow-lg`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>

        {/* Bottom icons */}
        <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-slate-800">
          <Link
            href="/profile"
            title="Mon Profil"
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
              pathname === '/profile'
                ? `${accentColor} text-white`
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <UserCircle className="w-5 h-5" />
          </Link>
          <button
            onClick={() => signOut()}
            title="Deconnexion"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Expanded Text Panel ── */}
      <div className="w-[220px] bg-white border-r border-gray-200/80 flex flex-col shrink-0 hidden md:flex">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className={`text-lg font-bold ${titleColor}`}>{title}</h1>
          <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">CRM COD Afrique</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-[13px] transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-gray-100">
          {user && (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full ${accentColor} flex items-center justify-center shrink-0`}
              >
                <span className="text-white text-xs font-bold">
                  {user.nom?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.nom}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
