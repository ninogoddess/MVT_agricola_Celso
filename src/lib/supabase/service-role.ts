import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con service_role key — bypass de RLS.
 * SOLO usar server-side: cron jobs, registro inicial.
 * NUNCA importar desde código cliente.
 */
export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
