'use client';

import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}

export function KpiCard({ label, value, color, subtitle }: KpiCardProps) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
