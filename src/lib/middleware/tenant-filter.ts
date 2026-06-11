import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface TenantContext {
  userId: string;
  tenantId: string;
  supabase: SupabaseClient;
  user: User;
}

/**
 * Wrapper que resuelve sesión + tenant_id antes de ejecutar el handler.
 * Retorna 401 si no hay sesión, 403 si no se resuelve tenant_id.
 */
export async function withTenantContext(
  handler: (ctx: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Sesión requerida', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // tenant_id desde app_metadata (asignado en registro)
  let tenantId = user.app_metadata?.tenant_id;

  // Fallback: leer desde user_profiles
  if (!tenantId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    tenantId = data?.tenant_id;
  }

  if (!tenantId) {
    console.error('[SECURITY] Sesión sin tenant_id válido', {
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Contexto de tenant inválido', code: 'TENANT_CONTEXT_INVALID' },
      { status: 403 }
    );
  }

  return handler({ userId: user.id, tenantId, supabase, user });
}
