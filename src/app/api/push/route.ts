import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/tenant-filter';

// POST: guardar suscripción push
export async function POST(request: Request) {
  return withTenantContext(async (ctx) => {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Datos de suscripción inválidos' }, { status: 400 });
    }

    const { error } = await ctx.supabase
      .from('push_subscriptions')
      .upsert({
        user_id: ctx.userId,
        tenant_id: ctx.tenantId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'user_id,endpoint' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  });
}

// DELETE: eliminar suscripción push
export async function DELETE(request: Request) {
  return withTenantContext(async (ctx) => {
    const body = await request.json();
    const { endpoint } = body;

    await ctx.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', ctx.userId)
      .eq('endpoint', endpoint);

    return NextResponse.json({ ok: true });
  });
}
