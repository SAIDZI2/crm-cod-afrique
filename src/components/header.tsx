'use client';

import { useAuth } from '@/hooks/use-auth';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user } = useAuth();

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

        {/* User Avatar + Name */}
        {user && (
          <div className="flex items-center gap-3 ml-1 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">
                {user.nom?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user.nom}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
