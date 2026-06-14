import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

/**
 * POST /api/subscription/cancel
 *
 * Baja al tenant al plan Gratis. Si existe una suscripción recurrente activa en
 * Mercado Pago (preapproval), intenta cancelarla para que no se vuelva a cobrar.
 */
export async function POST() {
  return withTenantContext(async (ctx) => {
    const serviceRole = createSupabaseServiceRoleClient();

    // Leer la suscripción actual del tenant
    const { data: sub } = await serviceRole
      .from('subscriptions')
      .select('id, plan_id, status, mp_preapproval_id')
      .eq('tenant_id', ctx.tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Intentar cancelar la suscripción recurrente en Mercado Pago (no es fatal si falla)
    if (sub?.mp_preapproval_id) {
      try {
        const client = new MercadoPagoConfig({
          accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
        });
        await new PreApproval(client).update({
          id: sub.mp_preapproval_id,
          body: { status: 'cancelled' },
        });
      } catch (err) {
        console.error('No se pudo cancelar el preapproval en MP:', err);
      }
    }

    // Bajar a plan free (update-or-insert)
    const { data: updated } = await serviceRole
      .from('subscriptions')
      .update({
        plan_id: 'free',
        status: 'active',
        cancelled_at: new Date().toISOString(),
        mp_preapproval_id: null,
        next_billing_date: null,
      })
      .eq('tenant_id', ctx.tenantId)
      .select('id');

    if (!updated || updated.length === 0) {
      await serviceRole.from('subscriptions').insert({
        tenant_id: ctx.tenantId,
        plan_id: 'free',
        status: 'active',
      });
    }

    return NextResponse.json({ updated: true, plan: 'free' });
  });
}
