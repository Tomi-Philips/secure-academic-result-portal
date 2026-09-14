/**
 * Server-only Supabase admin client.
 * Uses the SERVICE ROLE key — bypasses all RLS policies.
 * MUST NOT be imported in any 'use client' component.
 * Safe to use exclusively inside Next.js Route Handlers (server-side only).
 *
 * Uses lazy initialization so the module can be safely imported during
 * Next.js build-time page-data collection without throwing when env vars
 * are not yet present. The error is deferred to the first actual request.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  _adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

/**
 * @deprecated Use getSupabaseAdmin() instead to avoid build-time errors.
 * Kept for backward compatibility — will throw if env vars are missing at import time.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
