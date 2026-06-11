import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: Request) {
  return withTenantContext(async (ctx) => {
    try {
      const { planId } = await request.json();

      if (!planId) {
        return NextResponse.json({ error: 'planId es requerido' }, { status: 400 });
      }

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
      
      const { sandboxInitPoint } = await paymentService.createPreference(
        ctx.tenantId,
        plan.id,
        plan.price_clp,
        plan.name
      );

      // Como el requerimiento es Sandbox explícito, siempre retornamos sandboxInitPoint
      return NextResponse.json({ url: sandboxInitPoint });

    } catch (err: any) {
      console.error('Checkout error:', err);
      return NextResponse.json({ error: 'No se pudo crear el checkout', details: err.message }, { status: 500 });
    }
  });
}
