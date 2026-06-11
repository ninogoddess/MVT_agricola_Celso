import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type { SupabaseClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export class PaymentService {
  constructor(private supabase: SupabaseClient) {}

  async createPreference(tenantId: string, planId: string, priceClp: number, planName: string) {
    const preference = new Preference(client);

    // Usa localhost por defecto en desarrollo si no está definida la variable
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: `Suscripción a Plan ${planName}`,
            quantity: 1,
            unit_price: priceClp,
            currency_id: 'CLP',
          },
        ],
        // Pasamos datos clave en reference para usarlos luego en el Webhook
        external_reference: JSON.stringify({ tenantId, planId }),
        back_urls: {
          success: `${siteUrl}/dashboard?payment=success`,
          failure: `${siteUrl}/dashboard?payment=failure`,
          pending: `${siteUrl}/dashboard?payment=pending`,
        },
        auto_return: 'approved',
        // notification_url no debe apuntar a localhost a menos que uses un proxy como ngrok.
        // Lo omitiremos aquí o pasaremos el URL de ngrok, pero MP no permite localhost.
        // Lo inyectamos dinámicamente si siteUrl no es localhost:
        ...(siteUrl.includes('localhost') ? {} : { notification_url: `${siteUrl}/api/webhooks/mercadopago` })
      },
    });

    await this.logEvent(tenantId, 'initiated', {
      preference_id: result.id,
      plan_id: planId,
      price: priceClp,
    });

    return {
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  async verifyPayment(paymentId: string) {
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });
    return result;
  }

  async logEvent(tenantId: string | null, eventType: string, details: Record<string, any>) {
    if (!tenantId) {
      console.warn('Payment log missing tenantId:', eventType, details);
      return;
    }
    
    await this.supabase.from('payment_logs').insert({
      tenant_id: tenantId,
      event_type: eventType,
      details,
    });
  }
}
