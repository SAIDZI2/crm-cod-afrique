'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  color?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export function KpiCard({ label, value, color, subtitle, icon: Icon, iconBg, iconColor }: KpiCardProps) {
  // New icon-based variant (matching modern dashboard design)
  if (Icon) {
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <div
              className={`w-12 h-12 rounded-full ${iconBg ?? 'bg-blue-100'} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-6 h-6 ${iconColor ?? 'text-blue-500'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Legacy border-left variant (backward compat)
  return (
    <Card className={`border-l-4 ${color ?? ''}`}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
