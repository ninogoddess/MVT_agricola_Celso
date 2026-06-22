import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { PaymentService } from '@/lib/services/payment.service';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: Request) {
  return withTenantContext(async (ctx) => {
    try {
      const { planId, payerEmail: customPayerEmail, mode } = await request.json();

      if (!planId) {
        return NextResponse.json({ error: 'planId es requerido' }, { status: 400 });
      }

      // Modo de cobro: 'oneshot' (pago mensual, acepta débito) o 'subscription'
      // (débito automático recurrente, solo crédito). Por defecto, pago mensual.
      const payMode = mode === 'subscription' ? 'subscription' : 'oneshot';
      // Validar que el plan existe y obtener su precio real de la BD
      const { data: plan, error } = await ctx.supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error || !plan) {
        return NextResponse.json({ error: 'Plan no válido' }, { status: 404 });
      }

      // Crear la preferencia usando el PaymentService
      const paymentService = new PaymentService(ctx.supabase);

      // Email del comprador (payer).
      //
      // En PRUEBAS, tanto el comprador como el vendedor deben ser usuarios de
      // prueba de la MISMA aplicación de Mercado Pago, de lo contrario MP responde:
      // "Both payer and collector must be real or test users".
      //
      // El usuario puede indicar en el checkout un correo de Mercado Pago distinto
      // al de su cuenta de Agrencia (campo opcional del popup). Si no lo indica,
      // usamos el email de su sesión.
      const cleanCustom = typeof customPayerEmail === 'string' ? customPayerEmail.trim() : '';
      const payerEmail = cleanCustom || ctx.user.email;

      if (!payerEmail) {
        return NextResponse.json({ error: 'No se pudo determinar el email del comprador' }, { status: 400 });
      }

      // ── Pago mensual (Checkout Pro): acepta débito, CuentaRUT y todas las tarjetas ──
      if (payMode === 'oneshot') {
        const { initPoint } = await paymentService.createOneTimeCheckout(
          ctx.tenantId,
          plan.id,
          plan.price_clp,
          plan.name,
          payerEmail
        );

        // Marcar la suscripción como tipo 'oneshot' (se confirmará al aprobar el pago).
        const serviceRole = createSupabaseServiceRoleClient();
        const { data: updated } = await serviceRole
          .from('subscriptions')
          .update({ payment_type: 'oneshot' })
          .eq('tenant_id', ctx.tenantId)
          .select('id');
        if (!updated || updated.length === 0) {
          await serviceRole.from('subscriptions').insert({
            tenant_id: ctx.tenantId,
            plan_id: 'free',
            status: 'active',
            payment_type: 'oneshot',
          });
        }

        return NextResponse.json({ url: initPoint });
      }

      // ── Suscripción automática (PreApproval): solo tarjetas de crédito ──
      const { sandboxInitPoint, preapprovalId } = await paymentService.createSubscriptionCheckout(
        ctx.tenantId,
        plan.id,
        plan.price_clp,
        plan.name,
        payerEmail
      );

      // Guardamos el preapproval_id en la suscripción del tenant (vía service role,
      // porque `subscriptions` tiene RLS sin política de UPDATE para usuarios).
      // Esto permite verificar y confirmar el pago al volver (back_url), sin depender
      // únicamente del webhook.
      if (preapprovalId) {
        const serviceRole = createSupabaseServiceRoleClient();
        const { data: updated } = await serviceRole
          .from('subscriptions')
          .update({ mp_preapproval_id: preapprovalId, payment_type: 'subscription' })
          .eq('tenant_id', ctx.tenantId)
          .select('id');

        // Si el tenant no tenía fila de suscripción, la creamos (plan free por ahora;
        // el confirm la elevará a Pro al verificar el pago).
        if (!updated || updated.length === 0) {
          await serviceRole.from('subscriptions').insert({
            tenant_id: ctx.tenantId,
            plan_id: 'free',
            status: 'active',
            mp_preapproval_id: preapprovalId,
            payment_type: 'subscription',
          });
        }
      }

      // Como el requerimiento es Sandbox explícito, siempre retornamos sandboxInitPoint
      return NextResponse.json({ url: sandboxInitPoint });

    } catch (err: any) {
      console.error('Checkout error:', err);

      // El SDK de Mercado Pago suele incluir el detalle real en err.cause / err.error.
      // Lo extraemos para mostrar la causa concreta en lugar de "Internal server error".
      const mpCause =
        err?.cause ??
        err?.error ??
        err?.response?.data ??
        null;

      let detalle = err?.message || 'Desconocido';
      try {
        if (mpCause) {
          detalle = typeof mpCause === 'string' ? mpCause : JSON.stringify(mpCause);
        }
      } catch {
        // ignore stringify errors
      }

      return NextResponse.json({
        error: `Error de Mercado Pago: ${detalle}`,
        message: err?.message ?? null,
        status: err?.status ?? err?.statusCode ?? null,
        cause: mpCause,
      }, { status: 500 });
    }
  });
}
