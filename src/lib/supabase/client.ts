import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        // Bypass navigator.locks which hangs indefinitely on some deployments
        lock: <R,>(
          _name: string,
          _acquireTimeout: number,
          fn: () => Promise<R>
        ): Promise<R> => fn(),
      },
    }
  );
  return client;
}
