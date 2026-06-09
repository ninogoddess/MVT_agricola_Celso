import { NextResponse, type NextRequest } from 'next/server';
import webpush from 'web-push';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

export const runtime = 'nodejs'; // web-push requiere Node.js, no edge runtime

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * POST /api/push/send
 * Envía notificaciones push a todos los dispositivos de un usuario.
 * Llamado por el cron de recordatorios o directamente.
 */
export async function POST(request: NextRequest) {
  // Validar CRON_SECRET
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, title, body, url = '/recordatorios' } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, message: 'No hay suscripciones' });
  }

  const payload = JSON.stringify({ title, body, url, icon: '/assets/logo_principal.png' });
  let sent = 0;
  const stale: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err: unknown) {
      // 404/410 = suscripción expirada, la eliminamos
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        stale.push(sub.endpoint);
      }
    }
  }

  // Limpiar suscripciones expiradas
  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale);
  }

  return NextResponse.json({ sent, stale: stale.length });
}
