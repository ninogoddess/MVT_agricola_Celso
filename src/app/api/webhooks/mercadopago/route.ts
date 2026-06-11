import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { PaymentService } from '@/lib/services/payment.service';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const bodyText = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(bodyText);
    } catch {}

    // El ID del pago suele venir en query params o en el body
    const paymentId = url.searchParams.get('data.id') || body?.data?.id;
    const type = url.searchParams.get('type') || body?.type;

    if (!paymentId || type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const supabase = createSupabaseServiceRoleClient();
    const paymentService = new PaymentService(supabase);

    // Validar autenticidad mediante firma si tenemos el Webhook Secret
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (xSignature && xRequestId && secret) {
      const parts = xSignature.split(',');
      const tsPart = parts.find(p => p.trim().startsWith('ts='));
      const v1Part = parts.find(p => p.trim().startsWith('v1='));
      
      if (tsPart && v1Part) {
        const ts = tsPart.split('=')[1];
        const hash = v1Part.split('=')[1];
        
        // Según documentación de MP: manifest = "id:[data.id];request-id:[x-request-id];ts:[ts];"
        const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const digest = hmac.digest('hex');
        
        if (digest !== hash) {
          // Firma inválida
          await paymentService.logEvent(null, 'validation_error', { error: 'Invalid x-signature', paymentId });
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }

    // 1. Logear recepción de webhook
    await paymentService.logEvent(null, 'webhook_received', { paymentId, body });

    // 2. Verificar en MP el estado real del pago
    let mpPayment;
    try {
      mpPayment = await paymentService.verifyPayment(paymentId);
    } catch (err: any) {
      await paymentService.logEvent(null, 'validation_error', { error: 'Failed to verify payment with MP API', details: err.message });
      return NextResponse.json({ error: 'Error verifying payment' }, { status: 500 });
    }

    const status = mpPayment.status;
    const externalReference = mpPayment.external_reference; // JSON string = { tenantId, planId }
    
    if (!externalReference) {
      await paymentService.logEvent(null, 'validation_error', { error: 'Missing external_reference' });
      return NextResponse.json({ received: true });
    }

    let tenantId, planId;
    try {
      const ref = JSON.parse(externalReference);
      tenantId = ref.tenantId;
      planId = ref.planId;
    } catch {
      await paymentService.logEvent(null, 'validation_error', { error: 'Invalid external_reference format' });
      return NextResponse.json({ received: true });
    }

    if (status === 'approved') {
      // 3. Pago aprobado -> Actualizar Suscripción
      await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);
        
      await paymentService.logEvent(tenantId, 'approved', { paymentId, planId });
    } else if (status === 'rejected' || status === 'cancelled') {
      await paymentService.logEvent(tenantId, 'rejected', { paymentId, planId, mpStatus: status });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
