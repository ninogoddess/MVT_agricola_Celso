import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { PaymentService } from '@/lib/services/payment.service';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * POST /api/checkout/confirm
 *
 * Verifica el estado real de la suscripción (preapproval) directamente con
 * Mercado Pago y actualiza el plan del tenant si está autorizada.
 *
 * Es un fallback robusto al webhook: se invoca cuando el usuario vuelve al
 * sitio (back_url) tras pagar, de modo que el plan se active aunque el webhook
 * tarde o no esté configurado.
 *
 * Acepta opcionalmente `preapprovalId` en el body (lo que MP agrega a la URL de
 * retorno). Si no viene, usa el `mp_preapproval_id` guardado en la suscripción.
 */
export async function POST(request: Request) {
  return withTenantContext(async (ctx) => {
    try {
      let bodyPreapprovalId: string | undefined;
      try {
        const body = await request.json();
        bodyPreapprovalId = body?.preapprovalId || body?.preapproval_id;
      } catch {
        // sin body, está bien
      }

      const serviceRole = createSupabaseServiceRoleClient();

      // Determinar el preapproval_id a verificar
      let preapprovalId = bodyPreapprovalId;
      if (!preapprovalId) {
        const { data: sub } = await serviceRole
          .from('subscriptions')
          .select('mp_preapproval_id')
          .eq('tenant_id', ctx.tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        preapprovalId = sub?.mp_preapproval_id || undefined;
      }

      if (!preapprovalId) {
        return NextResponse.json({ updated: false, reason: 'no_preapproval' });
      }

      // Verificar con Mercado Pago
      const paymentService = new PaymentService(serviceRole);
      const mp = await paymentService.verifyPreApproval(preapprovalId);

      const status = mp.status;
      const externalReference = mp.external_reference;

      // Seguridad: el preapproval debe pertenecer a este tenant
      let refTenantId: string | undefined;
      let planId: string | undefined;
      try {
        const ref = JSON.parse(externalReference || '{}');
        refTenantId = ref.tenantId;
        planId = ref.planId;
      } catch {
        // external_reference inválido
      }

      if (!refTenantId || refTenantId !== ctx.tenantId) {
        return NextResponse.json(
          { updated: false, reason: 'tenant_mismatch' },
          { status: 403 }
        );
      }

      if (status === 'authorized' && planId) {
        await serviceRole
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            start_date: new Date().toISOString(),
            mp_preapproval_id: preapprovalId,
            next_billing_date: (mp as any).next_payment_date ?? null,
          })
          .eq('tenant_id', ctx.tenantId);

        await paymentService.logEvent(ctx.tenantId, 'preapproval_processed', {
          paymentId: preapprovalId,
          planId,
          status,
          source: 'confirm',
        });

        return NextResponse.json({ updated: true, plan: planId, status });
      }

      // Aún no autorizada (pending, etc.)
      return NextResponse.json({ updated: false, status });
    } catch (err: any) {
      console.error('Confirm error:', err);
      return NextResponse.json(
        { updated: false, error: err?.message || 'Error al confirmar el pago' },
        { status: 500 }
      );
    }
  });
}
