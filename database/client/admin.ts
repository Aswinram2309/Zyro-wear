import { createClient } from '@supabase/supabase-js';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Creates an authoritative Supabase client for server-side operations.
 * Uses SUPABASE_SERVICE_ROLE_KEY for administrative and atomic database tasks.
 */
export function createAdminClient() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceRoleKey = cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
