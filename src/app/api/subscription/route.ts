import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';
import { SubscriptionService } from '@/lib/services/subscription.service';

/**
 * GET /api/subscription
 * Devuelve el plan actual del tenant para la UI.
 */
export async function GET() {
  return withTenantContext(async (ctx) => {
    const service = new SubscriptionService(ctx.supabase, ctx.tenantId);
    const sub = await service.getCurrentSubscription();
    const plan = (sub as any)?.plan;

    return NextResponse.json({
      planId: plan?.id ?? 'free',
      planName: plan?.name ?? 'Gratis',
      status: (sub as any)?.status ?? 'active',
    });
  });
}
