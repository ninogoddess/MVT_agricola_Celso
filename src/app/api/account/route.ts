import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/account
 * Devuelve los datos de la cuenta en sesión para la pestaña de ajustes.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const serviceRole = createSupabaseServiceRoleClient();

  const { data: profile } = await serviceRole
    .from('user_profiles')
    .select('role, tenant_id, created_at')
    .eq('id', user.id)
    .maybeSingle();

  let tenantName: string | null = null;
  if (profile?.tenant_id) {
    const { data: tenant } = await serviceRole
      .from('tenants')
      .select('name')
      .eq('id', profile.tenant_id)
      .maybeSingle();
    tenantName = tenant?.name ?? null;
  }

  const provider = (user.app_metadata as { provider?: string })?.provider ?? 'email';

  return NextResponse.json({
    email: user.email,
    tenantName,
    role: profile?.role ?? 'admin',
    provider,
    createdAt: user.created_at,
  });
}

/**
 * DELETE /api/account
 * Elimina la cuenta del usuario autenticado y todos sus datos.
 * Libera el email para que pueda volver a registrarse.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const serviceRole = createSupabaseServiceRoleClient();

  // 1. Obtener tenant_id del usuario
  const { data: profile } = await serviceRole
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profile?.tenant_id) {
    // 2. Eliminar datos del tenant (en orden por dependencias)
    const tenantId = profile.tenant_id;
    await serviceRole.from('reminders').delete().eq('tenant_id', tenantId);
    await serviceRole.from('recommendations').delete().eq('tenant_id', tenantId);
    await serviceRole.from('alerts').delete().eq('tenant_id', tenantId);
    await serviceRole.from('alert_thresholds').delete().eq('tenant_id', tenantId);
    await serviceRole.from('soil_data').delete().eq('tenant_id', tenantId);
    await serviceRole.from('climate_data').delete().eq('tenant_id', tenantId);
    await serviceRole.from('cultivos').delete().eq('tenant_id', tenantId);
    await serviceRole.from('parcelas').delete().eq('tenant_id', tenantId);
    await serviceRole.from('user_profiles').delete().eq('tenant_id', tenantId);
    await serviceRole.from('tenants').delete().eq('id', tenantId);
  }

  // 3. Eliminar usuario de Supabase Auth (libera el email)
  await serviceRole.auth.admin.deleteUser(user.id);

  // 4. Cerrar sesión
  await supabase.auth.signOut();

  return NextResponse.json({ message: 'Cuenta eliminada correctamente' });
}
