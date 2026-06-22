import { MercadoPagoConfig, PreApproval, Payment, Preference } from 'mercadopago';
import type { SupabaseClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export class PaymentService {
  constructor(private supabase: SupabaseClient) {}

  private getSiteUrl() {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  }

  async createSubscriptionCheckout(tenantId: string, planId: string, priceClp: number, planName: string, payerEmail: string) {
    const preApproval = new PreApproval(client);
    const siteUrl = this.getSiteUrl();

    // El external_reference de preapproval es un string de max 256 chars
    const reference = JSON.stringify({ tenantId, planId });

    let result;
    try {
      result = await preApproval.create({
        body: {
          reason: `Suscripción Mensual - Plan ${planName}`,
          external_reference: reference,
          payer_email: payerEmail,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: priceClp,
            currency_id: 'CLP',
          },
          back_url: `${siteUrl}/dashboard?payment=processing`,
          status: 'pending',
        },
      });
    } catch (err: any) {
      // Guardamos el detalle real del error de MP para diagnóstico
      const mpCause = err?.cause ?? err?.error ?? err?.response?.data ?? null;
      await this.logEvent(tenantId, 'mp_error', {
        plan_id: planId,
        price: priceClp,
        payer_email: payerEmail,
        site_url: siteUrl,
        message: err?.message ?? null,
        status: err?.status ?? err?.statusCode ?? null,
        cause: mpCause,
      });
      throw err;
    }

    await this.logEvent(tenantId, 'initiated', {
      preapproval_id: result.id,
      plan_id: planId,
      price: priceClp,
      payer_email: payerEmail,
    });

    return {
      initPoint: result.init_point,
      sandboxInitPoint: result.init_point, // PreApproval API no tiene sandbox_init_point en el SDK, usa init_point
      preapprovalId: result.id,
    };
  }

  async verifyPreApproval(preapprovalId: string) {
    const preApproval = new PreApproval(client);
    const result = await preApproval.get({ id: preapprovalId });
    return result;
  }

  /**
   * Pago mensual único vía Checkout Pro (Preference).
   * Acepta TODOS los medios: débito, CuentaRUT/RedCompra, crédito y prepago.
   * No es recurrente: activa el plan por un período y el usuario vuelve a pagar al vencer.
   */
  async createOneTimeCheckout(tenantId: string, planId: string, priceClp: number, planName: string, payerEmail: string) {
    const preference = new Preference(client);
    const siteUrl = this.getSiteUrl();
    const reference = JSON.stringify({ tenantId, planId, type: 'oneshot' });

    let result;
    try {
      result = await preference.create({
        body: {
          items: [
            {
              id: planId,
              title: `Plan ${planName} - 1 mes`,
              quantity: 1,
              unit_price: priceClp,
              currency_id: 'CLP',
            },
          ],
          external_reference: reference,
          payer: { email: payerEmail },
          back_urls: {
            success: `${siteUrl}/dashboard?payment=processing`,
            pending: `${siteUrl}/dashboard?payment=processing`,
            failure: `${siteUrl}/planes?payment=failure`,
          },
          auto_return: 'approved',
          statement_descriptor: 'AGRENCIA',
          metadata: { tenant_id: tenantId, plan_id: planId },
        },
      });
    } catch (err: any) {
      const mpCause = err?.cause ?? err?.error ?? err?.response?.data ?? null;
      await this.logEvent(tenantId, 'mp_error', {
        flow: 'oneshot',
        plan_id: planId,
        price: priceClp,
        payer_email: payerEmail,
        site_url: siteUrl,
        message: err?.message ?? null,
        status: err?.status ?? err?.statusCode ?? null,
        cause: mpCause,
      });
      throw err;
    }

    await this.logEvent(tenantId, 'initiated', {
      preference_id: result.id,
      plan_id: planId,
      price: priceClp,
      payer_email: payerEmail,
      flow: 'oneshot',
    });

    return { initPoint: result.init_point };
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
