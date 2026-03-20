'use client';

import { useAuth } from '@/hooks/use-auth';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

const roleColors: Record<string, string> = {
  admin: 'from-purple-500 to-purple-600',
  call_center: 'from-blue-500 to-blue-600',
  media_buyer: 'from-orange-500 to-orange-600',
  livreur: 'from-green-500 to-green-600',
  superviseur_cc: 'from-cyan-500 to-cyan-600',
  responsable_logistique: 'from-teal-500 to-teal-600',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  call_center: 'Agent Call Center',
  media_buyer: 'Media Buyer',
  livreur: 'Livreur',
  superviseur_cc: 'Superviseur CC',
  responsable_logistique: 'Resp. Logistique',
};

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const avatarGradient = user ? (roleColors[user.role] ?? 'from-gray-500 to-gray-600') : 'from-gray-400 to-gray-500';

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-6">
        <span className="text-base font-semibold text-gray-800 hidden sm:block">
          CRM COD
        </span>
      </div>

      {/* Right: Search + Bell + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-56 h-9 bg-gray-50/80 border-gray-200 text-sm rounded-lg focus:bg-white"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
        </button>

        {/* User Avatar Dropdown */}
        {user && (
          <div className="ml-1 pl-3 border-l border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-sm font-bold">
                    {user.nom?.charAt(0)?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user.nom}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {roleLabels[user.role] ?? user.role}
                  </p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="font-medium text-sm">{user.nom}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="w-4 h-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
