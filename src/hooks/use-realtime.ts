'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to Supabase Postgres Changes on a table.
 * Calls `onEvent` whenever an INSERT, UPDATE, or DELETE happens.
 * Automatically cleans up subscription on unmount.
 *
 * @param table  - The Postgres table name (e.g. 'commandes')
 * @param onEvent - Callback fired on any change
 * @param filter - Optional Postgres filter string (e.g. 'user_id=eq.abc')
 */
export function useRealtime(
  table: string,
  onEvent: () => void,
  filter?: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-${table}-${filter ?? 'all'}`;

    const channelConfig: {
      event: '*';
      schema: 'public';
      table: string;
      filter?: string;
    } = {
      event: '*',
      schema: 'public',
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, () => {
        onEvent();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]); // eslint-disable-line react-hooks/exhaustive-deps
}
