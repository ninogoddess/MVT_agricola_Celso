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
      
      const { sandboxInitPoint } = await paymentService.createSubscriptionCheckout(
        ctx.tenantId,
        plan.id,
        plan.price_clp,
        plan.name,
        ctx.user.email || 'hola@agrencia.cl'
      );

      // Como el requerimiento es Sandbox explícito, siempre retornamos sandboxInitPoint
      return NextResponse.json({ url: sandboxInitPoint });

    } catch (err: any) {
      console.error('Checkout error:', err);
      // Devolvemos err.message en el campo error para que el frontend lo muestre directamente en el cartel rojo
      return NextResponse.json({ 
        error: `Error de Mercado Pago: ${err.message || 'Desconocido'}`, 
        details: err.message 
      }, { status: 500 });
    }
  });
}
