'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseSupabaseResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSupabase<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): UseSupabaseResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      console.error('Supabase query error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Loading skeleton component
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}
