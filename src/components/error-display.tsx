'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  if (!error) return null;
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-red-600">Une erreur est survenue</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3 h-3 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
